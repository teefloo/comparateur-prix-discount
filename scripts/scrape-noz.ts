import dotenv from 'dotenv'
import path from 'path'

import { pruneStaleOffersByRetailer, upsertOfferPricesBatch, upsertOffersBatch } from '../src/lib/db'
import { scrapeNozProductsDetailed } from '../src/lib/scrapers/noz-scraper'
import { validateOffersForRetailer } from '../src/lib/scraper-utils'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

function hasBlockingIssues(issues: Array<{ severity?: string }>) {
  return issues.some((issue) => issue.severity !== 'warning')
}

async function runNozScrape() {
  console.log('Starting isolated Noz scrape...')
  console.log('DB URL:', process.env.POSTGRES_URL || process.env.DATABASE_URL ? 'SET' : 'NOT SET')

  const result = await scrapeNozProductsDetailed()
  const validated = validateOffersForRetailer('noz', result.offers)

  console.log(
    `Noz summary: raw=${result.offers.length} validated=${validated.offers.length} rejected=${validated.report.rejectedCount} coverage=${result.coverage.collectionRate}%`,
  )

  if (result.issues.length > 0) {
    console.log(`Noz issues: ${result.issues.map((issue) => `${issue.severity || 'error'}:${issue.code}`).join(', ')}`)
  }

  if (hasBlockingIssues(result.issues) || validated.offers.length === 0) {
    throw new Error(
      `Noz scrape failed validation: validated=${validated.offers.length} blockingIssues=${hasBlockingIssues(result.issues) ? 'yes' : 'no'}`,
    )
  }

  const hasDatabaseUrl = Boolean(process.env.POSTGRES_URL || process.env.DATABASE_URL)
  if (hasDatabaseUrl) {
    console.log(`Persisting ${validated.offers.length} validated offers to the database...`)
    await upsertOffersBatch(validated.offers)
    await upsertOfferPricesBatch(validated.offers)
    await pruneStaleOffersByRetailer(
      'noz',
      validated.offers.map((offer) => offer.id),
    )
    console.log('Successfully persisted Noz offers to the database')
  } else {
    console.log('POSTGRES_URL / DATABASE_URL not set, skipping DB save')
  }

  console.log(`Noz scrape completed successfully with ${validated.offers.length} validated offers`)
}

runNozScrape().catch((error) => {
  console.error('Noz scrape failed:', error)
  process.exitCode = 1
})
