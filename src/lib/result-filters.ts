import { toValidPrice } from './scraper-utils'

export type PriceSortOption = 'default' | 'price-asc' | 'price-desc'

export interface PriceFilterOptions {
  minPrice?: number | null
  maxPrice?: number | null
  sort?: PriceSortOption
}

export interface NormalizedPriceRange {
  minPrice: number | null
  maxPrice: number | null
}

function normalizePriceCandidate(value: string | string[] | number | null | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value
  return toValidPrice(rawValue ?? null)
}

export function normalizePriceBound(value: string | string[] | number | null | undefined) {
  return normalizePriceCandidate(value)
}

export function normalizePriceRange(
  minPrice: string | string[] | number | null | undefined,
  maxPrice: string | string[] | number | null | undefined,
): NormalizedPriceRange {
  const normalizedMinPrice = normalizePriceCandidate(minPrice)
  const normalizedMaxPrice = normalizePriceCandidate(maxPrice)

  if (
    normalizedMinPrice !== null &&
    normalizedMaxPrice !== null &&
    normalizedMinPrice > normalizedMaxPrice
  ) {
    return {
      minPrice: normalizedMaxPrice,
      maxPrice: normalizedMinPrice,
    }
  }

  return {
    minPrice: normalizedMinPrice,
    maxPrice: normalizedMaxPrice,
  }
}

export function normalizePriceSort(value: string | string[] | null | undefined): PriceSortOption {
  const rawValue = Array.isArray(value) ? value[0] : value
  if (rawValue === 'price-asc' || rawValue === 'price-desc') {
    return rawValue
  }

  return 'default'
}

export function filterOffersByPriceRange<T extends { price: number }>(
  offers: T[],
  minPrice: number | null = null,
  maxPrice: number | null = null,
) {
  const normalizedRange = normalizePriceRange(minPrice, maxPrice)

  if (normalizedRange.minPrice === null && normalizedRange.maxPrice === null) {
    return offers
  }

  return offers.filter((offer) => {
    if (normalizedRange.minPrice !== null && offer.price < normalizedRange.minPrice) return false
    if (normalizedRange.maxPrice !== null && offer.price > normalizedRange.maxPrice) return false
    return true
  })
}

export function sortOffersByPrice<T extends { price: number; name?: string; id?: string }>(
  offers: T[],
  sort: Exclude<PriceSortOption, 'default'>,
) {
  return [...offers].sort((left, right) => {
    if (left.price !== right.price) {
      return sort === 'price-asc' ? left.price - right.price : right.price - left.price
    }

    const nameComparison = (left.name || '').localeCompare(right.name || '')
    if (nameComparison !== 0) {
      return nameComparison
    }

    return (left.id || '').localeCompare(right.id || '')
  })
}

export function applyPriceFilters<T extends { price: number; name?: string; id?: string }>(
  offers: T[],
  options: PriceFilterOptions = {},
) {
  const filteredOffers = filterOffersByPriceRange(offers, options.minPrice ?? null, options.maxPrice ?? null)

  if (options.sort === 'price-asc' || options.sort === 'price-desc') {
    return sortOffersByPrice(filteredOffers, options.sort)
  }

  return filteredOffers
}
