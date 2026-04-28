import dotenv from 'dotenv'
import path from 'path'

import { scrapeGifiProductsDetailed } from '../src/lib/scrapers/gifi-scraper'
import { validateOffersForRetailer } from '../src/lib/scraper-utils'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

function hasBlockingIssues(issues: Array<{ severity?: string }>) {
  return issues.some((issue) => issue.severity !== 'warning')
}

async function runGifiScrape() {
  console.log('Starting isolated GIFI scrape...')
  console.log('DB URL:', process.env.POSTGRES_URL || process.env.DATABASE_URL ? 'SET' : 'NOT SET')

  const result = await scrapeGifiProductsDetailed()
  const validated = validateOffersForRetailer('gifi', result.offers)

  console.log(
    `GIFI summary: raw=${result.offers.length} validated=${validated.offers.length} rejected=${validated.report.rejectedCount} coverage=${result.coverage.collectionRate}%`,
  )

  if (result.issues.length > 0) {
    console.log(
      `GIFI issues: ${result.issues.map((issue) => `${issue.severity || 'error'}:${issue.code}`).join(', ')}`,
    )
  }

  if (hasBlockingIssues(result.issues) || validated.offers.length === 0) {
    throw new Error(
      `GIFI scrape failed validation: validated=${validated.offers.length} blockingIssues=${hasBlockingIssues(result.issues) ? 'yes' : 'no'}`,
    )
  }

  console.log(`GIFI scrape completed successfully with ${validated.offers.length} validated offers`)
}

runGifiScrape().catch((error) => {
  console.error('GIFI scrape failed:', error)
  process.exitCode = 1
})
