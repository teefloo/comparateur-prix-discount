import dotenv from 'dotenv'
import path from 'path'

import { upsertOfferPricesBatch, upsertOffersBatch } from '../src/lib/db'
import { scrapeRetailers } from '../src/lib/scrape-runtime'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const POPULAR_QUERIES = ['Fanta', 'Coca', 'Nutella', 'Kinder', 'Mochi', 'Ariel', 'Dash', 'Pringles']

async function updatePopular() {
  console.log('Updating popular offer searches in DB...')

  for (const query of POPULAR_QUERIES) {
    console.log(`\nSearching for: ${query}`)

    const results = await scrapeRetailers({
      searchQuery: query,
      includeBrowserScrapers: true,
      maxAttempts: 2,
    })

    const offers = results.flatMap((result) => result.offers)
    const validatedCount = offers.length

    console.log(`  Validated offers: ${validatedCount}`)
    results.forEach((result) => {
      console.log(
        `  - ${result.retailer}: raw=${result.report.rawCount} validated=${result.report.validatedCount} rejected=${result.report.rejectedCount}`,
      )
    })

    if (validatedCount === 0) {
      console.log(`  No validated offers found for "${query}", skipping DB write`)
      continue
    }

    await upsertOffersBatch(offers)
    await upsertOfferPricesBatch(offers)
    console.log(`  Saved ${validatedCount} store-specific offers for "${query}"`)
  }

  console.log('\nPopular products update completed')
}

updatePopular().catch((error) => {
  console.error('Popular products update failed:', error)
  process.exitCode = 1
})
