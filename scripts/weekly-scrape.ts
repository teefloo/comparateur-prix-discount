import dotenv from 'dotenv'
import path from 'path'
import { appendFileSync, writeFileSync } from 'fs'

import { RETAILERS, SUPPORTED_CATEGORIES, type Retailer, type SupportedCategory } from '../src/lib/catalog'
import { pruneStaleOffersByRetailer, upsertOfferPricesBatch, upsertOffersBatch } from '../src/lib/db'
import { isPromotionalOffer } from '../src/lib/deals'
import { scrapeDealRetailers, scrapeRetailers } from '../src/lib/scrape-runtime'
import type { CategoryResolutionConfidence, CategoryResolutionSource, ScrapeIssueSeverity } from '../src/lib/types'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const OPTIONAL_WEEKLY_RETAILERS: Retailer[] = ['lafoirfouille', 'lidl', 'maxibazar', 'noz']
const REQUIRED_WEEKLY_RETAILERS = RETAILERS.filter(
  (retailer): retailer is Retailer => !OPTIONAL_WEEKLY_RETAILERS.includes(retailer),
)

type StoreSummary = {
  attempts: number
  durationMs: number
  rawCount: number
  validatedCount: number
  rejectedCount: number
  rejectionReasons: Record<string, number>
  categories: Record<SupportedCategory, number>
  categoryResolvedCount: number
  categoryFallbackCount: number
  categoryConfidenceCounts: Record<CategoryResolutionConfidence, number>
  categorySourceCounts: Record<CategoryResolutionSource, number>
  categoryFallbackExamples: Array<{ name: string; sourceUrl: string; sourceCategoryPath?: string; matchedSignals: string[] }>
  collectionRate: number
  isComplete: boolean
  issues: Array<{ code: string; message: string; severity?: ScrapeIssueSeverity }>
  errors: string[]
}

function createEmptyCategoryCounts() {
  return SUPPORTED_CATEGORIES.reduce(
    (acc, category) => {
      acc[category] = 0
      return acc
    },
    {} as Record<SupportedCategory, number>,
  )
}

function createEmptyCategoryConfidenceCounts() {
  return {
    high: 0,
    medium: 0,
    low: 0,
    fallback: 0,
  } as Record<CategoryResolutionConfidence, number>
}

function createEmptyCategorySourceCounts() {
  return {
    native_mapping: 0,
    source_path: 0,
    tags: 0,
    text: 0,
    fallback: 0,
  } as Record<CategoryResolutionSource, number>
}

function hasBlockingIssues(issues: Array<{ severity?: ScrapeIssueSeverity }>) {
  return issues.some((issue) => issue.severity !== 'warning')
}

async function runWeeklyScrape() {
  console.log('Starting weekly store-specific scrape...\n')
  console.log('DB URL:', process.env.POSTGRES_URL || process.env.DATABASE_URL ? 'SET' : 'NOT SET')

  const timestamp = new Date().toISOString()
  const requiredScrapeResults = await scrapeRetailers({
    retailers: REQUIRED_WEEKLY_RETAILERS,
    includeBrowserScrapers: true,
    maxAttempts: 3,
  })
  const blockingFailedRetailers = requiredScrapeResults
    .filter((result) => !result.coverage.isComplete || hasBlockingIssues(result.issues) || result.offers.length === 0)
    .map((result) => result.retailer)
  const hasDatabaseUrl = Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL)

  if (hasDatabaseUrl) {
    const successfulRequiredResults = requiredScrapeResults.filter(
      (result) => result.coverage.isComplete && !hasBlockingIssues(result.issues) && result.offers.length > 0,
    )
    const successfulRequiredOffers = successfulRequiredResults.flatMap((result) => result.offers)

    if (successfulRequiredOffers.length > 0) {
      await upsertOffersBatch(successfulRequiredOffers)
      await upsertOfferPricesBatch(successfulRequiredOffers)
    }

    for (const result of successfulRequiredResults) {
      await pruneStaleOffersByRetailer(
        result.retailer,
        result.offers.map((offer) => offer.id),
      )
    }

    console.log(`Saved ${successfulRequiredOffers.length} validated required store offers to the database`)
  }

  let optionalScrapeResults = await scrapeRetailers({
    retailers: OPTIONAL_WEEKLY_RETAILERS,
    includeBrowserScrapers: true,
    maxAttempts: 1,
  })

  optionalScrapeResults = optionalScrapeResults.map((result) => {
    if (result.coverage.isComplete && !hasBlockingIssues(result.issues) && result.offers.length > 0) {
      return result
    }

    return {
      ...result,
      errors:
        result.errors.length > 0
          ? result.errors
          : [`Optional retailer ${result.retailer} did not return a complete validated scrape`],
    }
  })

  const scrapeResults = [...requiredScrapeResults, ...optionalScrapeResults]
  const successfulOptionalScrapeResults = optionalScrapeResults.filter(
    (result) => result.coverage.isComplete && !hasBlockingIssues(result.issues) && result.offers.length > 0,
  )

  const stores = RETAILERS.reduce(
    (acc, retailer) => {
      const result = scrapeResults.find((entry) => entry.retailer === retailer)
      acc[retailer] = result
        ? {
            attempts: result.attempts,
            durationMs: result.durationMs,
            rawCount: result.report.rawCount,
            validatedCount: result.report.validatedCount,
            rejectedCount: result.report.rejectedCount,
            rejectionReasons: result.report.rejectedReasons,
            categories: result.report.categoryCounts,
            categoryResolvedCount: result.report.categoryResolvedCount,
            categoryFallbackCount: result.report.categoryFallbackCount,
            categoryConfidenceCounts: result.report.categoryConfidenceCounts,
            categorySourceCounts: result.report.categorySourceCounts,
            categoryFallbackExamples: result.report.categoryFallbackExamples,
            collectionRate: result.coverage.collectionRate,
            isComplete: result.coverage.isComplete && !hasBlockingIssues(result.issues),
            issues: result.issues.map((issue) => ({ code: issue.code, message: issue.message, severity: issue.severity })),
            errors: result.errors,
          }
        : {
            attempts: 0,
            durationMs: 0,
            rawCount: 0,
            validatedCount: 0,
            rejectedCount: 0,
            rejectionReasons: { scraper_error: 1 },
            categories: createEmptyCategoryCounts(),
            categoryResolvedCount: 0,
            categoryFallbackCount: 0,
            categoryConfidenceCounts: createEmptyCategoryConfidenceCounts(),
            categorySourceCounts: createEmptyCategorySourceCounts(),
            categoryFallbackExamples: [],
            collectionRate: 0,
            isComplete: false,
            issues: [{ code: 'scraper_error', message: 'Retailer scrape missing from execution results', severity: 'error' }],
            errors: ['Retailer scrape missing from execution results'],
          }
      return acc
    },
    {} as Record<Retailer, StoreSummary>,
  )

  const optionalOffers = successfulOptionalScrapeResults.flatMap((result) => result.offers)
  const totals = {
    rawCount: scrapeResults.reduce((sum, result) => sum + result.report.rawCount, 0),
    validatedCount: scrapeResults.reduce((sum, result) => sum + result.report.validatedCount, 0),
    rejectedCount: scrapeResults.reduce((sum, result) => sum + result.report.rejectedCount, 0),
    categories: createEmptyCategoryCounts(),
    categoryResolvedCount: scrapeResults.reduce((sum, result) => sum + result.report.categoryResolvedCount, 0),
    categoryFallbackCount: scrapeResults.reduce((sum, result) => sum + result.report.categoryFallbackCount, 0),
    categoryConfidenceCounts: createEmptyCategoryConfidenceCounts(),
    categorySourceCounts: createEmptyCategorySourceCounts(),
  }

  for (const category of SUPPORTED_CATEGORIES) {
    totals.categories[category] = scrapeResults.reduce(
      (sum, result) => sum + (result.report.categoryCounts[category] || 0),
      0,
    )
  }

  for (const confidence of Object.keys(totals.categoryConfidenceCounts) as CategoryResolutionConfidence[]) {
    totals.categoryConfidenceCounts[confidence] = scrapeResults.reduce(
      (sum, result) => sum + (result.report.categoryConfidenceCounts[confidence] || 0),
      0,
    )
  }

  for (const source of Object.keys(totals.categorySourceCounts) as CategoryResolutionSource[]) {
    totals.categorySourceCounts[source] = scrapeResults.reduce(
      (sum, result) => sum + (result.report.categorySourceCounts[source] || 0),
      0,
    )
  }

  const failedRetailers = scrapeResults
    .filter((result) => !result.coverage.isComplete || hasBlockingIssues(result.issues) || result.offers.length === 0)
    .map((result) => result.retailer)
  const optionalFailedRetailers = optionalScrapeResults
    .filter((result) => !result.coverage.isComplete || hasBlockingIssues(result.issues) || result.offers.length === 0)
    .map((result) => result.retailer)

  const summary = {
    timestamp,
    stores,
    totals,
    failedRetailers,
    optionalFailedRetailers,
  }

  writeFileSync(path.resolve(process.cwd(), 'scrape-results.json'), JSON.stringify(summary, null, 2))
  appendFileSync(
    path.resolve(process.cwd(), 'scrape-history.log'),
    `${timestamp} - validated=${totals.validatedCount} rejected=${totals.rejectedCount} failed=${
      failedRetailers.join(',') || 'none'
    } optional_failed=${optionalFailedRetailers.join(',') || 'none'}\n`,
  )

  console.log('Validation summary:')
  for (const retailer of RETAILERS) {
    const summaryEntry = stores[retailer]
    console.log(
      `  ${retailer}: raw=${summaryEntry.rawCount} validated=${summaryEntry.validatedCount} rejected=${summaryEntry.rejectedCount} coverage=${summaryEntry.collectionRate}% attempts=${summaryEntry.attempts}`,
    )
    console.log(`    complete: ${summaryEntry.isComplete ? 'yes' : 'no'}`)
    console.log(
      `    categorization: resolved=${summaryEntry.categoryResolvedCount} fallback=${summaryEntry.categoryFallbackCount}`,
    )
    if (summaryEntry.errors.length > 0) {
      console.log(`    errors: ${summaryEntry.errors.join(' | ')}`)
    }
    if (summaryEntry.issues.length > 0) {
      console.log(
        `    issues: ${summaryEntry.issues.map((issue) => `${issue.severity || 'error'}:${issue.code}`).join(', ')}`,
      )
    }
    const rejectedReasons = Object.entries(summaryEntry.rejectionReasons)
      .filter(([, count]) => count > 0)
      .map(([reason, count]) => `${reason}=${count}`)
    if (rejectedReasons.length > 0) {
      console.log(`    rejected: ${rejectedReasons.join(', ')}`)
    }
  }

  if (!hasDatabaseUrl) {
    console.log('POSTGRES_URL / DATABASE_URL not set, skipping DB save')
  } else if (optionalOffers.length > 0) {
    await upsertOffersBatch(optionalOffers)
    await upsertOfferPricesBatch(optionalOffers)

    for (const result of successfulOptionalScrapeResults) {
      await pruneStaleOffersByRetailer(
        result.retailer,
        result.offers.map((offer) => offer.id),
      )
    }

    console.log(`Saved ${optionalOffers.length} validated optional store offers to the database`)
  }

  const promotionalOffers = scrapeResults.flatMap((result) => result.offers.filter(isPromotionalOffer))
  if (hasDatabaseUrl && promotionalOffers.length > 0) {
    await upsertOffersBatch(promotionalOffers)
    await upsertOfferPricesBatch(promotionalOffers)
    console.log(`Re-applied ${promotionalOffers.length} validated promotional offers to the database`)
  }

  const dealScrapeResults = await scrapeDealRetailers({
    retailers: [...RETAILERS],
    includeBrowserScrapers: true,
    maxAttempts: 2,
  })
  const dealOffers = dealScrapeResults.flatMap((result) => result.offers)
  if (hasDatabaseUrl && dealOffers.length > 0) {
    await upsertOffersBatch(dealOffers)
    await upsertOfferPricesBatch(dealOffers)
    console.log(`Persisted ${dealOffers.length} validated offers from deal sections`)
  }

  if (optionalFailedRetailers.length > 0) {
    console.log(`Optional retailers skipped: ${optionalFailedRetailers.join(', ')}`)
  }

  if (blockingFailedRetailers.length > 0) {
    throw new Error(`Scrape failed validation for retailers: ${blockingFailedRetailers.join(', ')}`)
  }
}

runWeeklyScrape().catch((error) => {
  console.error('Weekly scrape failed:', error)
  setImmediate(() => process.exit(1))
})
