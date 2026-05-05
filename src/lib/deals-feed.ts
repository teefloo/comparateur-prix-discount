import {
  CATEGORY_LABELS,
  RETAILERS,
  SUPPORTED_CATEGORIES,
  isRetailer,
  isSupportedCategory,
  type Retailer,
  type SupportedCategory,
} from './catalog'
import { getDealsInDb } from './db'
import { sortDealsByPriority } from './deals'
import type { RetailerOfferCard } from './types'

export interface DealsFeedOptions {
  query?: string | null
  category?: string | null
  retailer?: string | string[] | null
  limit?: number
  liveScrape?: boolean
  persistLive?: boolean
}

export interface DealsFeedResult {
  products: RetailerOfferCard[]
  count: number
  source: 'database' | 'real-time' | 'empty'
  lastUpdate: string | null
  warnings: string[]
}

const BROWSER_ONLY_RETAILERS = new Set<Retailer>(['action', 'bm', 'centrakor', 'aldi'])

export function buildDealsApiResponse(feed: DealsFeedResult) {
  return {
    products: feed.products,
    count: feed.count,
    source: feed.source,
    lastUpdate: feed.lastUpdate,
    warnings: feed.warnings,
    categories: Object.fromEntries(SUPPORTED_CATEGORIES.map((value) => [value, CATEGORY_LABELS[value]])),
  }
}

function normalizeRetailerFilter(value: string | string[] | null | undefined): Retailer[] {
  const rawValues = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : []

  return rawValues.map((entry) => entry.trim()).filter(isRetailer)
}

function normalizeCategoryFilter(value: string | null | undefined): SupportedCategory | null {
  return isSupportedCategory(value) ? value : null
}

function normalizeSearchFilter(value: string | null | undefined) {
  return (value || '').trim()
}

function getLatestUpdate(products: RetailerOfferCard[]) {
  const timestamps = products
    .map((product) => product.lastUpdated || null)
    .filter((value): value is string => Boolean(value))
    .map((value) => Date.parse(value))
    .filter((value) => Number.isFinite(value))

  if (timestamps.length === 0) {
    return null
  }

  return new Date(Math.max(...timestamps)).toISOString()
}

export function mixDealsByRetailer(
  offers: RetailerOfferCard[],
  limit: number,
  retailerOrder: Retailer[] = [...RETAILERS],
) {
  const groups = new Map<Retailer, RetailerOfferCard[]>()
  for (const retailer of retailerOrder) {
    groups.set(retailer, [])
  }

  for (const offer of offers) {
    const bucket = groups.get(offer.retailer) || []
    bucket.push(offer)
    groups.set(offer.retailer, bucket)
  }

  const orderedRetailers = retailerOrder.filter((retailer) => (groups.get(retailer) || []).length > 0)
  const sortedGroups = new Map<Retailer, RetailerOfferCard[]>(
    orderedRetailers.map((retailer) => [retailer, sortDealsByPriority(groups.get(retailer) || [])]),
  )

  const mixed: RetailerOfferCard[] = []
  let layer = 0

  while (mixed.length < limit) {
    let added = false

    for (const retailer of orderedRetailers) {
      const group = sortedGroups.get(retailer) || []
      const nextOffer = group[layer]
      if (!nextOffer) {
        continue
      }

      mixed.push(nextOffer)
      added = true
      if (mixed.length >= limit) {
        break
      }
    }

    if (!added) {
      break
    }

    layer += 1
  }

  return mixed
}

export function buildDealsWarnings(options: {
  requestedRetailers: Retailer[]
  coveredRetailers: Retailer[]
  browserUnavailableRetailers?: Retailer[]
}) {
  const warnings = new Set<string>()
  const coveredRetailerSet = new Set(options.coveredRetailers)
  const missingRetailers = options.requestedRetailers.filter((retailer) => !coveredRetailerSet.has(retailer))

  if (missingRetailers.length > 0) {
    warnings.add('partial_database_coverage')
  }

  if ((options.browserUnavailableRetailers || []).length > 0) {
    warnings.add('browser_scraper_unavailable_on_runtime')
  }

  return Array.from(warnings)
}

export async function loadDealsFeed(options: DealsFeedOptions = {}): Promise<DealsFeedResult> {
  const query = normalizeSearchFilter(options.query)
  const category = normalizeCategoryFilter(options.category)
  const retailers = normalizeRetailerFilter(options.retailer)
  const limit = options.limit ?? 120
  const retailerFilter = retailers.length > 0 ? retailers : null
  const requestedRetailers = retailerFilter || [...RETAILERS]
  const hasDatabaseUrl = Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL)
  const shouldBalancedMix = requestedRetailers.length > 1
  const browserUnavailableRetailers: Retailer[] = []
  let databaseOffers: RetailerOfferCard[] = []
  if (hasDatabaseUrl) {
    const candidateLimit = shouldBalancedMix ? Math.max(limit * 4, requestedRetailers.length * 25, 200) : limit
    databaseOffers = await getDealsInDb(category, candidateLimit, retailerFilter || null, query || null)
  }

  for (const retailer of requestedRetailers) {
    if (process.env.VERCEL === '1' && BROWSER_ONLY_RETAILERS.has(retailer)) {
      browserUnavailableRetailers.push(retailer)
    }
  }

  const products = shouldBalancedMix
    ? mixDealsByRetailer(databaseOffers, limit, requestedRetailers)
    : sortDealsByPriority(databaseOffers).slice(0, limit)

  const warnings = buildDealsWarnings({
    requestedRetailers,
    coveredRetailers: Array.from(new Set(products.map((product) => product.retailer))),
    browserUnavailableRetailers,
  })

  if (products.length > 0) {
    return {
      products,
      count: products.length,
      source: databaseOffers.length > 0 ? 'database' : 'empty',
      lastUpdate: getLatestUpdate(products),
      warnings,
    }
  }

  return {
    products: [],
    count: 0,
    source: 'empty',
    lastUpdate: null,
    warnings: buildDealsWarnings({
      requestedRetailers,
      coveredRetailers: [],
      browserUnavailableRetailers,
    }),
  }
}
