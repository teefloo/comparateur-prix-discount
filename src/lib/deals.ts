import { load } from 'cheerio'

import type { Retailer } from './catalog'
import { DEAL_ENTRYPOINTS, DEAL_SECTION_KEYWORDS } from './deals-config'
import { toAbsoluteUrl } from './scraper-utils'
import type { RetailerOfferCard, RetailerScrapeDetails } from './types'

export type DealSource = 'database' | 'real-time' | 'empty'

export function isPromotionalOffer(offer: Pick<RetailerOfferCard, 'isOnPromotion' | 'originalPrice' | 'discount' | 'price'>) {
  if (offer.isOnPromotion) return true
  if (typeof offer.discount === 'number' && offer.discount > 0) return true
  if (typeof offer.originalPrice === 'number' && offer.originalPrice > offer.price) return true
  return false
}

export function filterPromotionalOffers<T extends Pick<RetailerOfferCard, 'isOnPromotion' | 'originalPrice' | 'discount' | 'price'>>(
  offers: T[],
): T[] {
  return offers.filter((offer) => isPromotionalOffer(offer))
}

export function dedupeDealOffers<T extends RetailerOfferCard>(offers: T[]): T[] {
  const seen = new Set<string>()
  const deduped: T[] = []

  for (const offer of offers) {
    const key = `${offer.retailer}:${offer.productId || offer.id}`
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(offer)
  }

  return deduped
}

export function getDealEntrypoint(retailer: Retailer) {
  return DEAL_ENTRYPOINTS[retailer]
}

export function getDealKeywords() {
  return [...DEAL_SECTION_KEYWORDS]
}

export function discoverDealUrlsFromHtml(retailer: Retailer, html: string, baseUrl: string) {
  const $ = load(html)
  const keywords = [
    ...getDealKeywords(),
    ...getDealEntrypoint(retailer).keywords,
  ].map((keyword) => keyword.toLowerCase())
  const discovered = new Set<string>()

  for (const anchor of $('a[href]').toArray()) {
    const element = $(anchor)
    const href = element.attr('href') || ''
    const text = `${element.text() || ''} ${href}`.toLowerCase()
    if (!keywords.some((keyword) => text.includes(keyword))) {
      continue
    }

    const absolute = toAbsoluteUrl(href, baseUrl)
    if (absolute) {
      discovered.add(absolute)
    }
  }

  const fallback = getDealEntrypoint(retailer)
  discovered.add(fallback.url)
  return Array.from(discovered)
}

export function extractDealOffersFromScrapeResult(result: RetailerScrapeDetails): RetailerScrapeDetails {
  const offers = filterPromotionalOffers(result.offers)
  return {
    ...result,
    offers,
    coverage: {
      ...result.coverage,
      discoveredListings: result.coverage.discoveredListings,
      completedListings: result.coverage.completedListings,
      collectionRate: result.coverage.collectionRate,
      isComplete: result.coverage.isComplete && offers.length > 0,
    },
  }
}

export function sortDealsByPriority<T extends RetailerOfferCard>(offers: T[]) {
  return [...offers].sort((left, right) => {
    const leftDiscount = typeof left.discount === 'number' ? left.discount : 0
    const rightDiscount = typeof right.discount === 'number' ? right.discount : 0

    if (leftDiscount !== rightDiscount) {
      return rightDiscount - leftDiscount
    }

    const leftUpdated = left.lastUpdated ? Date.parse(left.lastUpdated) : 0
    const rightUpdated = right.lastUpdated ? Date.parse(right.lastUpdated) : 0

    if (leftUpdated !== rightUpdated) {
      return rightUpdated - leftUpdated
    }

    if (left.price !== right.price) {
      return left.price - right.price
    }

    return left.name.localeCompare(right.name)
  })
}
