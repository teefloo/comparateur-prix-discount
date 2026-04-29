import dotenv from 'dotenv'
import path from 'path'

import { scrapeLafoirfouilleProductsDetailed } from '../src/lib/scrapers/lafoirfouille-scraper'
import { validateOffersForRetailer } from '../src/lib/scraper-utils'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

function hasBlockingIssues(issues: Array<{ severity?: string }>) {
  return issues.some((issue) => issue.severity !== 'warning')
}

async function runLafoirfouilleScrape() {
  console.log("Starting isolated La Foir'Fouille scrape...")
  console.log('DB URL:', process.env.POSTGRES_URL || process.env.DATABASE_URL ? 'SET' : 'NOT SET')

  const result = await scrapeLafoirfouilleProductsDetailed()
  const validated = validateOffersForRetailer('lafoirfouille', result.offers)

  console.log(
    `La Foir'Fouille summary: raw=${result.offers.length} validated=${validated.offers.length} rejected=${validated.report.rejectedCount} coverage=${result.coverage.collectionRate}%`,
  )

  if (result.issues.length > 0) {
    console.log(
      `La Foir'Fouille issues: ${result.issues.map((issue) => `${issue.severity || 'error'}:${issue.code}`).join(', ')}`,
    )
  }

  if (hasBlockingIssues(result.issues) || validated.offers.length === 0) {
    throw new Error(
      `La Foir'Fouille scrape failed validation: validated=${validated.offers.length} blockingIssues=${
        hasBlockingIssues(result.issues) ? 'yes' : 'no'
      }`,
    )
  }

  console.log(`La Foir'Fouille scrape completed successfully with ${validated.offers.length} validated offers`)
}

runLafoirfouilleScrape().catch((error) => {
  console.error("La Foir'Fouille scrape failed:", error)
  process.exitCode = 1
})
