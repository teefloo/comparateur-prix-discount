import { RETAILERS, type Retailer } from './catalog'
import { validateOffersForRetailer } from './scraper-utils'
import type {
  OfferValidationReport,
  RetailerCoverageReport,
  RetailerScrapeDetails,
  ScrapeIssue,
  ScrapedOffer,
  ValidatedOffer,
} from './types'
import {
  scrapeActionProductsDetailed,
  scrapeAldiProductsDetailed,
  scrapeBMProductsDetailed,
  scrapeCentrakorProductsDetailed,
  scrapeGifiProductsDetailed,
  scrapeLidlProductsDetailed,
  scrapeLafoirfouilleProductsDetailed,
  scrapeStokomaniProductsDetailed,
} from './scrapers'

type ScraperFn = (searchQuery?: string) => Promise<RetailerScrapeDetails>

export interface RetailerScrapeExecutionResult {
  retailer: Retailer
  offers: ValidatedOffer[]
  report: OfferValidationReport
  issues: ScrapeIssue[]
  coverage: RetailerCoverageReport
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
  action: { scraper: scrapeActionProductsDetailed, browserRequired: true },
  stokomani: { scraper: scrapeStokomaniProductsDetailed, browserRequired: false },
  bm: { scraper: scrapeBMProductsDetailed, browserRequired: true },
  centrakor: { scraper: scrapeCentrakorProductsDetailed, browserRequired: true },
  aldi: { scraper: scrapeAldiProductsDetailed, browserRequired: true },
  gifi: { scraper: scrapeGifiProductsDetailed, browserRequired: false },
  lafoirfouille: { scraper: scrapeLafoirfouilleProductsDetailed, browserRequired: false },
  lidl: { scraper: scrapeLidlProductsDetailed, browserRequired: false },
}

function hasBlockingIssues(issues: ScrapeIssue[]) {
  return issues.some((issue) => issue.severity !== 'warning')
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
  let latestIssues: ScrapeIssue[] = []
  let latestCoverage: RetailerCoverageReport = {
    discoveredListings: 0,
    completedListings: 0,
    collectionRate: 0,
    isComplete: false,
  }
  let attempts = 0
  let latestReport = buildEmptyReport(retailer)
  let latestOffers: ValidatedOffer[] = []

  while (attempts < maxAttempts) {
    attempts += 1

    try {
      const detailed = await SCRAPER_REGISTRY[retailer].scraper(searchQuery)
      const validated = validateOffersForRetailer(retailer, detailed.offers)

      latestReport = validated.report
      latestOffers = validated.offers
      latestIssues = detailed.issues
      latestCoverage = detailed.coverage

      const isComplete = detailed.coverage.isComplete && !hasBlockingIssues(detailed.issues)
      if (isComplete && (validated.offers.length > 0 || searchQuery)) {
        break
      }

      if (searchQuery && validated.offers.length > 0 && !hasBlockingIssues(detailed.issues)) {
        break
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error))
      latestReport = buildEmptyReport(retailer, 'scraper_error')
      latestOffers = []
      latestIssues = [
        {
          retailer,
          code: 'scraper_error',
          message: error instanceof Error ? error.message : String(error),
        },
      ]
      latestCoverage = {
        discoveredListings: 0,
        completedListings: 0,
        collectionRate: 0,
        isComplete: false,
      }
    }
  }

  return {
    retailer,
    offers: latestOffers,
    report: latestReport,
    issues: latestIssues,
    coverage: latestCoverage,
    attempts,
    durationMs: Date.now() - start,
    errors,
  }
}

export async function scrapeRetailers(options: ScrapeRetailersOptions = {}): Promise<RetailerScrapeExecutionResult[]> {
  const includeBrowserScrapers = process.env.VERCEL === '1' ? false : (options.includeBrowserScrapers ?? true)
  const maxAttempts = options.maxAttempts ?? 2
  const retailers = (options.retailers || RETAILERS).filter((retailer) => {
    const config = SCRAPER_REGISTRY[retailer]
    return includeBrowserScrapers || !config.browserRequired
  })

  const results: RetailerScrapeExecutionResult[] = []

  for (const retailer of retailers) {
    try {
      results.push(await runRetailerScrape(retailer, options.searchQuery, maxAttempts))
    } catch (error) {
      results.push({
        retailer,
        offers: [],
        report: buildEmptyReport(retailer, 'scraper_error'),
        issues: [
          {
            retailer,
            code: 'scraper_error',
            message: error instanceof Error ? error.message : String(error),
          },
        ],
        coverage: {
          discoveredListings: 0,
          completedListings: 0,
          collectionRate: 0,
          isComplete: false,
        },
        attempts: maxAttempts,
        durationMs: 0,
        errors: [error instanceof Error ? error.message : String(error)],
      })
    }
  }

  return results
}
