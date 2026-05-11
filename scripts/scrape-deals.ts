import dotenv from 'dotenv'
import path from 'path'

import { RETAILERS, type Retailer } from '../src/lib/catalog'
import { upsertOfferPricesBatch, upsertOffersBatch } from '../src/lib/db'
import { scrapeDealRetailers } from '../src/lib/scrape-runtime'
import { isPromotionalOffer } from '../src/lib/deals'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

function parseRetailers(argv: string[]): Retailer[] | undefined {
  if (argv.length === 0) return undefined

  const selected = argv.flatMap((value) => value.split(',')).map((value) => value.trim()).filter(Boolean)
  const invalid = selected.filter((value) => !RETAILERS.includes(value as Retailer))

  if (invalid.length > 0) {
    throw new Error(`Retailer(s) inconnue(s): ${invalid.join(', ')}`)
  }

  return selected as Retailer[]
}

async function run() {
  const retailers = parseRetailers(process.argv.slice(2))
  const results = await scrapeDealRetailers({
    retailers,
    includeBrowserScrapers: true,
    maxAttempts: 2,
  })

  const issues = results.flatMap((result) => result.issues)
  const offers = results.flatMap((result) => result.offers.filter(isPromotionalOffer))
  console.log(`Validated promotional offers: ${offers.length}`)

  for (const issue of issues) {
    const location = [issue.url, issue.page ? `page ${issue.page}` : null].filter(Boolean).join(' - ')
    console.warn(`[${issue.retailer}] ${issue.code}: ${issue.message}${location ? ` (${location})` : ''}`)
  }

  if (offers.length === 0) {
    console.log('No deals found to persist.')
    return
  }

  if (process.env.POSTGRES_URL || process.env.DATABASE_URL) {
    await upsertOffersBatch(offers)
    await upsertOfferPricesBatch(offers)
    console.log('Saved deal offers to the database.')
  } else {
    console.log('Database URL missing, skipping persistence.')
  }
}

run().catch((error) => {
  console.error('Deal scrape failed:', error)
  setImmediate(() => process.exit(1))
})
