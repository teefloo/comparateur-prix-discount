import { RETAILERS, type Retailer } from './catalog'
import { validateOffersForRetailer } from './scraper-utils'
import type { OfferValidationReport, ScrapedOffer, ValidatedOffer } from './types'
import {
  scrapeActionProducts,
  scrapeAldiProducts,
  scrapeBMProducts,
  scrapeCentrakorProducts,
  scrapeStokomaniProducts,
} from './scrapers'

type ScraperFn = (searchQuery?: string) => Promise<ScrapedOffer[]>

export interface RetailerScrapeExecutionResult {
  retailer: Retailer
  offers: ValidatedOffer[]
  report: OfferValidationReport
  attempts: number
  durationMs: number
  errors: string[]
}

export interface ScrapeRetailersOptions {
  searchQuery?: string
  retailers?: Retailer[]
  includeBrowserScrapers?: boolean
  maxAttempts?: number
}

const SCRAPER_REGISTRY: Record<Retailer, { scraper: ScraperFn; browserRequired: boolean }> = {
  action: { scraper: scrapeActionProducts, browserRequired: true },
  stokomani: { scraper: scrapeStokomaniProducts, browserRequired: false },
  bm: { scraper: scrapeBMProducts, browserRequired: true },
  centrakor: { scraper: scrapeCentrakorProducts, browserRequired: true },
  aldi: { scraper: scrapeAldiProducts, browserRequired: true },
}

function buildEmptyReport(retailer: Retailer, reason?: string): OfferValidationReport {
  const base = validateOffersForRetailer(retailer, [])
  if (reason) {
    base.report.rejectedReasons[reason] = 1
  }
  return base.report
}

async function runRetailerScrape(
  retailer: Retailer,
  searchQuery: string | undefined,
  maxAttempts: number,
): Promise<RetailerScrapeExecutionResult> {
  const start = Date.now()
  const errors: string[] = []
  let attempts = 0
  let latestReport = buildEmptyReport(retailer)
  let latestOffers: ValidatedOffer[] = []

  while (attempts < maxAttempts) {
    attempts += 1

    try {
      const rawOffers = await SCRAPER_REGISTRY[retailer].scraper(searchQuery)
      const validated = validateOffersForRetailer(retailer, rawOffers)

      latestReport = validated.report
      latestOffers = validated.offers

      if (validated.offers.length > 0 || searchQuery) {
        break
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
      latestReport = buildEmptyReport(retailer, 'scraper_error')
      latestOffers = []
    }
  }

  return {
    retailer,
    offers: latestOffers,
    report: latestReport,
    attempts,
    durationMs: Date.now() - start,
    errors,
  }
}

export async function scrapeRetailers(options: ScrapeRetailersOptions = {}): Promise<RetailerScrapeExecutionResult[]> {
  const includeBrowserScrapers = options.includeBrowserScrapers ?? true
  const maxAttempts = options.maxAttempts ?? 2
  const retailers = (options.retailers || RETAILERS).filter((retailer) => {
    const config = SCRAPER_REGISTRY[retailer]
    return includeBrowserScrapers || !config.browserRequired
  })

  if (process.env.VERCEL === '1') {
    const results: RetailerScrapeExecutionResult[] = []

    for (const retailer of retailers) {
      results.push(await runRetailerScrape(retailer, options.searchQuery, maxAttempts))
    }

    return results
  }

  const settled = await Promise.allSettled(
    retailers.map((retailer) => runRetailerScrape(retailer, options.searchQuery, maxAttempts)),
  )

  return settled.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value
    }

    const retailer = retailers[index]
    return {
      retailer,
      offers: [],
      report: buildEmptyReport(retailer, 'scraper_error'),
      attempts: maxAttempts,
      durationMs: 0,
      errors: [result.reason instanceof Error ? result.reason.message : String(result.reason)],
    }
  })
}
