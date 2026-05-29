import {
  CATEGORY_LABELS,
  RETAILERS,
  SUPPORTED_CATEGORIES,
  isRetailer,
  isSupportedCategory,
  type Retailer,
  type SupportedCategory,
} from './catalog'
import { filterDemoOffers } from './demo-offers'
import { getDealsInDb } from './db'
import { hasDatabaseUrl } from './ensure-db-env'
import { sortDealsByPriority } from './deals'
import { applyPriceFilters, normalizePriceBound, normalizePriceSort, sortOffersByPrice, type PriceSortOption } from './result-filters'
import type { RetailerOfferCard } from './types'

export interface DealsFeedOptions {
  query?: string | null
  category?: string | null
  retailer?: string | string[] | null
  limit?: number
  minPrice?: string | number | null
  maxPrice?: string | number | null
  sort?: string | null
  liveScrape?: boolean
  persistLive?: boolean
}

export interface DealsFeedResult {
  products: RetailerOfferCard[]
  count: number
  source: 'database' | 'real-time' | 'demo-fallback' | 'empty'
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

export function prepareDealsProducts(
  offers: RetailerOfferCard[],
  options: {
    limit: number
    retailerOrder: Retailer[]
    minPrice?: number | null
    maxPrice?: number | null
    sort?: PriceSortOption
  },
) {
  const filteredOffers = applyPriceFilters(offers, {
    minPrice: options.minPrice ?? null,
    maxPrice: options.maxPrice ?? null,
  })

  if (options.sort === 'price-asc' || options.sort === 'price-desc') {
    return sortOffersByPrice(filteredOffers, options.sort).slice(0, options.limit)
  }

  const shouldBalancedMix = options.retailerOrder.length > 1
  return shouldBalancedMix
    ? mixDealsByRetailer(filteredOffers, options.limit, options.retailerOrder)
    : sortDealsByPriority(filteredOffers).slice(0, options.limit)
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
  demoFallback?: boolean
}) {
  const warnings = new Set<string>()
  if (options.demoFallback) {
    warnings.add('demo_fallback')
    return Array.from(warnings)
  }

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
  const minPrice = normalizePriceBound(options.minPrice)
  const maxPrice = normalizePriceBound(options.maxPrice)
  const sort = normalizePriceSort(options.sort)
  const retailerFilter = retailers.length > 0 ? retailers : null
  const requestedRetailers = retailerFilter || [...RETAILERS]
  const hasDb = hasDatabaseUrl()
  const shouldBalancedMix = requestedRetailers.length > 1
  const browserUnavailableRetailers: Retailer[] = []
  let databaseOffers: RetailerOfferCard[] = []
  if (!hasDb) {
    const demoOffers = filterDemoOffers({
      query,
      category,
      retailer: retailerFilter,
      minPrice,
      maxPrice,
      sort,
    })

    const products = prepareDealsProducts(demoOffers, {
      limit,
      retailerOrder: requestedRetailers,
      minPrice,
      maxPrice,
      sort,
    })

    return {
      products,
      count: products.length,
      source: 'demo-fallback',
      lastUpdate: null,
      warnings: buildDealsWarnings({
        requestedRetailers,
        coveredRetailers: [],
        demoFallback: true,
      }),
    }
  }

  const candidateLimit = shouldBalancedMix ? Math.max(limit * 4, requestedRetailers.length * 25, 200) : limit
  databaseOffers = await getDealsInDb(category, candidateLimit, retailerFilter || null, query || null, sort)

  const coveredRetailers = Array.from(new Set(databaseOffers.map((product) => product.retailer)))

  for (const retailer of requestedRetailers) {
    if (process.env.VERCEL === '1' && BROWSER_ONLY_RETAILERS.has(retailer)) {
      browserUnavailableRetailers.push(retailer)
    }
  }

  const products = prepareDealsProducts(databaseOffers, {
    limit,
    retailerOrder: requestedRetailers,
    minPrice,
    maxPrice,
    sort,
  })

  const warnings = buildDealsWarnings({
    requestedRetailers,
    coveredRetailers,
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
    source: databaseOffers.length > 0 ? 'database' : 'empty',
    lastUpdate: null,
    warnings: buildDealsWarnings({
      requestedRetailers,
      coveredRetailers,
      browserUnavailableRetailers,
    }),
  }
}
