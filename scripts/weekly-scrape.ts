import dotenv from 'dotenv'
import path from 'path'
import { appendFileSync, writeFileSync } from 'fs'

import { RETAILERS, SUPPORTED_CATEGORIES, type Retailer, type SupportedCategory } from '../src/lib/catalog'
import { pruneStaleOffersByRetailer, upsertOfferPricesBatch, upsertOffersBatch } from '../src/lib/db'
import { scrapeRetailers } from '../src/lib/scrape-runtime'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

type StoreSummary = {
  attempts: number
  durationMs: number
  rawCount: number
  validatedCount: number
  rejectedCount: number
  rejectionReasons: Record<string, number>
  categories: Record<SupportedCategory, number>
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

async function runWeeklyScrape() {
  console.log('Starting weekly store-specific scrape...\n')
  console.log('DB URL:', process.env.POSTGRES_URL || process.env.DATABASE_URL ? 'SET' : 'NOT SET')

  const timestamp = new Date().toISOString()
  const scrapeResults = await scrapeRetailers({
    includeBrowserScrapers: true,
    maxAttempts: 3,
  })

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
            errors: ['Retailer scrape missing from execution results'],
          }
      return acc
    },
    {} as Record<Retailer, StoreSummary>,
  )

  const allOffers = scrapeResults.flatMap((result) => result.offers)
  const totals = {
    rawCount: scrapeResults.reduce((sum, result) => sum + result.report.rawCount, 0),
    validatedCount: scrapeResults.reduce((sum, result) => sum + result.report.validatedCount, 0),
    rejectedCount: scrapeResults.reduce((sum, result) => sum + result.report.rejectedCount, 0),
    categories: createEmptyCategoryCounts(),
  }

  for (const category of SUPPORTED_CATEGORIES) {
    totals.categories[category] = scrapeResults.reduce(
      (sum, result) => sum + (result.report.categoryCounts[category] || 0),
      0,
    )
  }

  const failedRetailers = scrapeResults
    .filter((result) => result.offers.length === 0)
    .map((result) => result.retailer)

  const summary = {
    timestamp,
    stores,
    totals,
    failedRetailers,
  }

  writeFileSync(path.resolve(process.cwd(), 'scrape-results.json'), JSON.stringify(summary, null, 2))
  appendFileSync(
    path.resolve(process.cwd(), 'scrape-history.log'),
    `${timestamp} - validated=${totals.validatedCount} rejected=${totals.rejectedCount} failed=${failedRetailers.join(',') || 'none'}\n`,
  )

  console.log('Validation summary:')
  for (const retailer of RETAILERS) {
    const summaryEntry = stores[retailer]
    console.log(
      `  ${retailer}: raw=${summaryEntry.rawCount} validated=${summaryEntry.validatedCount} rejected=${summaryEntry.rejectedCount} attempts=${summaryEntry.attempts}`,
    )
    if (summaryEntry.errors.length > 0) {
      console.log(`    errors: ${summaryEntry.errors.join(' | ')}`)
    }
    const rejectedReasons = Object.entries(summaryEntry.rejectionReasons)
      .filter(([, count]) => count > 0)
      .map(([reason, count]) => `${reason}=${count}`)
    if (rejectedReasons.length > 0) {
      console.log(`    rejected: ${rejectedReasons.join(', ')}`)
    }
  }

  if (failedRetailers.length > 0) {
    throw new Error(`Scrape failed validation for retailers: ${failedRetailers.join(', ')}`)
  }

  if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
    console.log('POSTGRES_URL / DATABASE_URL not set, skipping DB save')
    return
  }

  await upsertOffersBatch(allOffers)
  await upsertOfferPricesBatch(allOffers)
  for (const retailer of RETAILERS) {
    const retailerOfferIds = scrapeResults
      .find((result) => result.retailer === retailer)
      ?.offers.map((offer) => offer.id)
    if (!retailerOfferIds || retailerOfferIds.length === 0) {
      throw new Error(`Cannot prune stale offers for retailer ${retailer}: no validated offers returned`)
    }

    await pruneStaleOffersByRetailer(retailer, retailerOfferIds)
  }

  console.log(`Saved ${allOffers.length} validated store offers to the database`)
}

runWeeklyScrape().catch((error) => {
  console.error('Weekly scrape failed:', error)
  process.exitCode = 1
})
