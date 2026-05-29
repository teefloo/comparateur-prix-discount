import * as fs from 'node:fs'
import * as path from 'node:path'

import {
  CATEGORY_LABELS,
  RETAILERS,
  SUPPORTED_CATEGORIES,
  isRetailer,
  isSupportedCategory,
  type Retailer,
  type SupportedCategory,
} from './catalog'
import { DEMO_OFFERS } from './demo-offers'
import { hasDatabaseUrl } from './ensure-db-env'
import { getOffersByCategoryStrict, searchOffersInDbStrict } from './db'
import { applyPriceFilters, normalizePriceRange, normalizePriceSort, type PriceSortOption } from './result-filters'
import { scrapeRetailers } from './scrape-runtime'
import { filterOffersByQuery, normalizeRetailerSelection, sortRetailerOfferCards, toRetailerOfferCard } from './scraper-utils'
import type { RetailerOfferCard } from './types'
import type { SearchSource } from './search-ui'

export interface SearchFilters {
  query?: string
  category?: string | null
  retailer?: string | string[] | null
  minPrice?: string | number | null
  maxPrice?: string | number | null
  sort?: string | null
}

export interface SearchResponse {
  products: RetailerOfferCard[]
  count: number
  grouped: false
  source: SearchSource
  lastUpdate: string | null
  categories: Record<SupportedCategory, string>
  errorCode?: 'DB_UNAVAILABLE'
  error?: string
}

interface SearchDeps {
  hasDatabaseUrl: boolean
  canLiveScrape: boolean
  searchOffersInDb: typeof searchOffersInDbStrict
  getOffersByCategory: typeof getOffersByCategoryStrict
  scrapeRetailers: typeof scrapeRetailers
  readLastUpdateTimestamp: () => string | null
}

interface SearchContext {
  query: string
  category: SupportedCategory | null
  selectedRetailers: Retailer[]
  validatedRetailer: Retailer | null
  minPrice: number | null
  maxPrice: number | null
  sort: PriceSortOption
  lastUpdate: string | null
}

const LIVE_SCRAPE_TIMEOUT_MS = process.env.VERCEL === '1' ? 8000 : 30000
const CATEGORY_DB_LIMIT = 5000
const CATEGORY_RESULTS_LIMIT = 120
const CATEGORY_ONLY_LIVE_SCRAPE_RETAILERS = RETAILERS.filter(
  (retailer): retailer is Retailer => retailer !== 'lafoirfouille' && retailer !== 'maxibazar',
)

function buildCategories() {
  return Object.fromEntries(SUPPORTED_CATEGORIES.map((value) => [value, CATEGORY_LABELS[value]])) as Record<
    SupportedCategory,
    string
  >
}

function dedupeOffers(offers: RetailerOfferCard[]) {
  const seenIds = new Set<string>()
  const deduped: RetailerOfferCard[] = []

  for (const offer of offers) {
    if (seenIds.has(offer.id)) continue
    seenIds.add(offer.id)
    deduped.push(offer)
  }

  return deduped
}

function parseCategory(value: string | null | undefined): SupportedCategory | null {
  return isSupportedCategory(value) ? value : null
}

function readLastUpdateTimestamp() {
  try {
    const resultsPath = path.resolve(process.cwd(), 'scrape-results.json')
    if (!fs.existsSync(resultsPath)) {
      return null
    }

    const parsed = JSON.parse(fs.readFileSync(resultsPath, 'utf8'))
    return typeof parsed.timestamp === 'string' ? parsed.timestamp : null
  } catch (error) {
    console.error('Error reading scrape-results.json:', error)
    return null
  }
}

async function withTimeout<T>(taskName: string, task: Promise<T>, timeoutMs: number): Promise<T | null> {
  let timeoutId: NodeJS.Timeout | null = null

  const timeoutPromise = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn(`${taskName} timed out after ${timeoutMs}ms`)
      resolve(null)
    }, timeoutMs)
  })

  const result = await Promise.race([task, timeoutPromise])
  if (timeoutId) {
    clearTimeout(timeoutId)
  }

  return result
}

function toSearchErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return `La recherche est temporairement indisponible. Réessayez dans quelques instants.`
  }

  return 'Une erreur inattendue est survenue. Réessayez dans quelques instants.'
}

function buildDemoOffers(context: SearchContext) {
  let offers = DEMO_OFFERS

  if (context.category) {
    offers = offers.filter((offer) => offer.category === context.category)
  }

  if (context.selectedRetailers.length > 0) {
    offers = offers.filter((offer) => context.selectedRetailers.includes(offer.retailer))
  }

  if (context.query) {
    offers = filterOffersByQuery(offers, context.query)
  }

  offers = applyPriceFilters(offers, {
    minPrice: context.minPrice,
    maxPrice: context.maxPrice,
    sort: context.sort,
  })

  if (context.sort === 'default') {
    return sortRetailerOfferCards(offers)
  }

  return offers
}

function buildSearchResponse(options: {
  products: RetailerOfferCard[]
  source: SearchSource
  lastUpdate: string | null
  errorCode?: 'DB_UNAVAILABLE'
  error?: string
}): SearchResponse {
  return {
    products: options.products,
    count: options.products.length,
    grouped: false,
    source: options.source,
    lastUpdate: options.lastUpdate,
    categories: buildCategories(),
    ...(options.errorCode ? { errorCode: options.errorCode } : {}),
    ...(options.error ? { error: options.error } : {}),
  }
}

function createDefaultDeps(): SearchDeps {
  const hasDb = hasDatabaseUrl()

  return {
    hasDatabaseUrl: hasDb,
    canLiveScrape: hasDb && process.env.VERCEL !== '1',
    searchOffersInDb: searchOffersInDbStrict,
    getOffersByCategory: getOffersByCategoryStrict,
    scrapeRetailers,
    readLastUpdateTimestamp,
  }
}

async function fetchDatabaseOffers(
  context: SearchContext,
  deps: SearchDeps,
): Promise<{ offers: RetailerOfferCard[]; error?: string }> {
  if (!deps.hasDatabaseUrl) {
    return { offers: [] }
  }

  try {
    const offers = context.query
      ? await deps.searchOffersInDb(context.query, context.category, context.validatedRetailer, context.sort)
      : context.category
        ? await deps.getOffersByCategory(context.category, CATEGORY_DB_LIMIT, context.validatedRetailer, context.sort)
        : []

    return { offers }
  } catch (error) {
    console.error('Search service database lookup failed:', error)
    return { offers: [], error: toSearchErrorMessage(error) }
  }
}

async function fetchLiveOffers(
  context: SearchContext,
  databaseOffers: RetailerOfferCard[],
  deps: SearchDeps,
) {
  if (!deps.canLiveScrape) {
    return []
  }

  const shouldLiveScrape = context.query
    ? databaseOffers.length < 5
    : Boolean(context.category) && databaseOffers.length === 0

  if (!shouldLiveScrape) {
    return []
  }

  const scrapeResults = await withTimeout(
    'Retailer scrape',
    deps.scrapeRetailers({
      searchQuery: context.query || undefined,
      retailers: context.query ? undefined : CATEGORY_ONLY_LIVE_SCRAPE_RETAILERS,
      includeBrowserScrapers: deps.canLiveScrape,
      maxAttempts: 2,
    }),
    LIVE_SCRAPE_TIMEOUT_MS,
  )

  if (!scrapeResults) {
    return []
  }

  return scrapeResults.flatMap((result) =>
    result.offers.map((offer) =>
      toRetailerOfferCard({
        ...offer,
        url: offer.sourceUrl,
      }),
    ),
  )
}

function finalizeOffers(context: SearchContext, databaseOffers: RetailerOfferCard[], liveOffers: RetailerOfferCard[]) {
  let mergedOffers = dedupeOffers([...databaseOffers, ...liveOffers])

  if (context.selectedRetailers.length > 0) {
    mergedOffers = mergedOffers.filter((offer) => context.selectedRetailers.includes(offer.retailer))
  }

  if (context.category) {
    mergedOffers = mergedOffers.filter((offer) => offer.category === context.category)
  }

  if (context.query) {
    mergedOffers = filterOffersByQuery(mergedOffers, context.query)
  }

  mergedOffers = applyPriceFilters(mergedOffers, {
    minPrice: context.minPrice,
    maxPrice: context.maxPrice,
    sort: context.sort,
  })

  if (context.sort === 'default') {
    mergedOffers = sortRetailerOfferCards(mergedOffers)
  }

  if (!context.query && context.category) {
    mergedOffers = mergedOffers.slice(0, CATEGORY_RESULTS_LIMIT)
  }

  return mergedOffers
}

export async function runSearch(filters: SearchFilters, deps: Partial<SearchDeps> = {}): Promise<SearchResponse> {
  const resolvedDeps: SearchDeps = {
    ...createDefaultDeps(),
    ...deps,
  }

  const query = (filters.query || '').trim()
  const category = parseCategory(filters.category)
  const selectedRetailers = normalizeRetailerSelection(filters.retailer)
  const validatedRetailer = selectedRetailers.length === 1 ? selectedRetailers[0] : null
  const { minPrice, maxPrice } = normalizePriceRange(filters.minPrice, filters.maxPrice)
  const sort = normalizePriceSort(filters.sort)
  const lastUpdate = resolvedDeps.readLastUpdateTimestamp()

  if (!query && !category) {
    return buildSearchResponse({
      products: [],
      source: null,
      lastUpdate,
    })
  }

  const context: SearchContext = {
    query,
    category,
    selectedRetailers,
    validatedRetailer,
    minPrice,
    maxPrice,
    sort,
    lastUpdate,
  }

  const { offers: databaseOffers, error } = await fetchDatabaseOffers(context, resolvedDeps)

  if (query && error) {
    return buildSearchResponse({
      products: [],
      source: null,
      lastUpdate,
      errorCode: 'DB_UNAVAILABLE',
      error,
    })
  }

  const liveOffers = await fetchLiveOffers(context, databaseOffers, resolvedDeps)
  let mergedOffers = finalizeOffers(context, databaseOffers, liveOffers)

  let source: SearchSource = null
  if (databaseOffers.length > 0) {
    source = 'database'
  } else if (liveOffers.length > 0) {
    source = 'real-time'
  } else if (!query) {
    mergedOffers = buildDemoOffers(context)
    source = 'demo-fallback'
  }

  return buildSearchResponse({
    products: mergedOffers,
    source,
    lastUpdate,
  })
}

export function readSearchLastUpdateTimestamp() {
  return readLastUpdateTimestamp()
}
