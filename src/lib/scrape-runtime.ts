import { RETAILERS, type Retailer } from './catalog'
import { pruneStaleOffersByRetailer, upsertOfferPricesBatch, upsertOffersBatch } from './db'
import { validateOffersForRetailer } from './scraper-utils'
import type {
  OfferValidationReport,
  RetailerCoverageReport,
  RetailerScrapeDetails,
  ScrapeIssue,
  ValidatedOffer,
} from './types'
import {
  scrapeActionProductsDetailed,
  scrapeAldiProductsDetailed,
  scrapeBMProductsDetailed,
  scrapeCentrakorProductsDetailed,
  scrapeActionDealsDetailed,
  scrapeAldiDealsDetailed,
  scrapeBMDealsDetailed,
  scrapeCentrakorDealsDetailed,
  scrapeGifiDealsDetailed,
  scrapeLafoirfouilleDealsDetailed,
  scrapeLidlDealsDetailed,
  scrapeMaxibazarDealsDetailed,
  scrapeNozDealsDetailed,
  scrapeStokomaniDealsDetailed,
  scrapeGifiProductsDetailed,
  scrapeMaxibazarProductsDetailed,
  scrapeNozProductsDetailed,
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
  maxibazar: { scraper: scrapeMaxibazarProductsDetailed, browserRequired: false },
  noz: { scraper: scrapeNozProductsDetailed, browserRequired: false },
}

const DEAL_SCRAPER_REGISTRY: Record<Retailer, { scraper: ScraperFn; browserRequired: boolean }> = {
  action: { scraper: scrapeActionDealsDetailed, browserRequired: true },
  stokomani: { scraper: scrapeStokomaniDealsDetailed, browserRequired: false },
  bm: { scraper: scrapeBMDealsDetailed, browserRequired: true },
  centrakor: { scraper: scrapeCentrakorDealsDetailed, browserRequired: true },
  aldi: { scraper: scrapeAldiDealsDetailed, browserRequired: true },
  gifi: { scraper: scrapeGifiDealsDetailed, browserRequired: false },
  lafoirfouille: { scraper: scrapeLafoirfouilleDealsDetailed, browserRequired: false },
  lidl: { scraper: scrapeLidlDealsDetailed, browserRequired: false },
  maxibazar: { scraper: scrapeMaxibazarDealsDetailed, browserRequired: false },
  noz: { scraper: scrapeNozDealsDetailed, browserRequired: false },
}

function hasBlockingIssues(issues: ScrapeIssue[]) {
  return issues.some((issue) => issue.severity !== 'warning')
}

const FETCH_RETAILER_TIMEOUT_MS = 20 * 60 * 1000
const STOKOMANI_RETAILER_TIMEOUT_MS = 45 * 60 * 1000

function getRetailerTimeoutMs(retailer: Retailer): number {
  // Browser scrapers need more time (navigation + rendering); fetch scrapers are faster
  if (retailer === 'stokomani') {
    return STOKOMANI_RETAILER_TIMEOUT_MS
  }

  return SCRAPER_REGISTRY[retailer].browserRequired ? 45 * 60 * 1000 : FETCH_RETAILER_TIMEOUT_MS
}

async function runRetailerScrapeWithTimeout(
  retailer: Retailer,
  searchQuery: string | undefined,
  maxAttempts: number,
): Promise<RetailerScrapeExecutionResult> {
  const timeoutMs = getRetailerTimeoutMs(retailer)

  return Promise.race([
    runRetailerScrape(retailer, searchQuery, maxAttempts),
    new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Scraper ${retailer} timed out after ${timeoutMs}ms`))
      }, timeoutMs)
      if ('unref' in timer && typeof timer.unref === 'function') {
        timer.unref()
      }
    }),
  ])
}

async function runRetailerDealScrapeWithTimeout(
  retailer: Retailer,
  searchQuery: string | undefined,
  maxAttempts: number,
): Promise<RetailerScrapeExecutionResult> {
  const timeoutMs = getRetailerTimeoutMs(retailer)

  return Promise.race([
    runRetailerDealScrape(retailer, searchQuery, maxAttempts),
    new Promise<never>((_, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Deal scraper ${retailer} timed out after ${timeoutMs}ms`))
      }, timeoutMs)
      if ('unref' in timer && typeof timer.unref === 'function') {
        timer.unref()
      }
    }),
  ])
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

async function runRetailerDealScrape(
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
      const detailed = await DEAL_SCRAPER_REGISTRY[retailer].scraper(searchQuery)
      const validated = validateOffersForRetailer(retailer, detailed.offers)

      latestReport = validated.report
      latestOffers = validated.offers
      latestIssues = detailed.issues
      latestCoverage = detailed.coverage

      const isComplete = detailed.coverage.isComplete && !hasBlockingIssues(detailed.issues)
      if (isComplete && validated.offers.length > 0) {
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

  const settled = await Promise.allSettled(
    retailers.map((retailer) => runRetailerScrapeWithTimeout(retailer, options.searchQuery, maxAttempts)),
  )

  for (const [index, result] of settled.entries()) {
    const retailer = retailers[index]
    if (result.status === 'fulfilled') {
      results.push(result.value)
    } else {
      const error = result.reason
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

export async function scrapeDealRetailers(options: ScrapeRetailersOptions = {}): Promise<RetailerScrapeExecutionResult[]> {
  const includeBrowserScrapers = process.env.VERCEL === '1' ? false : (options.includeBrowserScrapers ?? true)
  const maxAttempts = options.maxAttempts ?? 2
  const retailers = (options.retailers || RETAILERS).filter((retailer) => {
    const config = DEAL_SCRAPER_REGISTRY[retailer]
    return includeBrowserScrapers || !config.browserRequired
  })

  const results: RetailerScrapeExecutionResult[] = []

  const settled = await Promise.allSettled(
    retailers.map((retailer) => runRetailerDealScrapeWithTimeout(retailer, options.searchQuery, maxAttempts)),
  )

  for (const [index, result] of settled.entries()) {
    const retailer = retailers[index]
    if (result.status === 'fulfilled') {
      results.push(result.value)
    } else {
      const error = result.reason
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

/**
 * Runs a single retailer's detailed scraper in isolation: validates the offers,
 * persists them when a database URL is configured, and throws on blocking
 * issues or empty results. Shared by the standalone `scrape:<retailer>` CLI scripts.
 */
export async function runIsolatedRetailerScrape(
  retailer: Retailer,
  displayName: string,
  scraper: ScraperFn,
): Promise<void> {
  console.log(`Starting isolated ${displayName} scrape...`)
  console.log('DB URL:', process.env.POSTGRES_URL || process.env.DATABASE_URL ? 'SET' : 'NOT SET')

  const result = await scraper()
  const validated = validateOffersForRetailer(retailer, result.offers)

  console.log(
    `${displayName} summary: raw=${result.offers.length} validated=${validated.offers.length} rejected=${validated.report.rejectedCount} coverage=${result.coverage.collectionRate}%`,
  )

  if (result.issues.length > 0) {
    console.log(
      `${displayName} issues: ${result.issues.map((issue) => `${issue.severity || 'error'}:${issue.code}`).join(', ')}`,
    )
  }

  if (hasBlockingIssues(result.issues) || validated.offers.length === 0) {
    throw new Error(
      `${displayName} scrape failed validation: validated=${validated.offers.length} blockingIssues=${
        hasBlockingIssues(result.issues) ? 'yes' : 'no'
      }`,
    )
  }

  const hasDatabaseUrl = Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL)
  if (hasDatabaseUrl) {
    console.log(`Persisting ${validated.offers.length} validated offers to the database...`)
    await upsertOffersBatch(validated.offers)
    await upsertOfferPricesBatch(validated.offers)
    await pruneStaleOffersByRetailer(
      retailer,
      validated.offers.map((offer) => offer.id),
    )
    console.log(`Successfully persisted ${displayName} offers to the database`)
  } else {
    console.log('POSTGRES_URL / DATABASE_URL not set, skipping DB save')
  }

  console.log(`${displayName} scrape completed successfully with ${validated.offers.length} validated offers`)
}
