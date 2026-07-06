import dotenv from 'dotenv'
import path from 'path'

import { runIsolatedRetailerScrape } from '../src/lib/scrape-runtime'
import { scrapeNozProductsDetailed } from '../src/lib/scrapers/noz-scraper'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

runIsolatedRetailerScrape('noz', 'Noz', scrapeNozProductsDetailed).catch((error) => {
  console.error('Noz scrape failed:', error)
  process.exitCode = 1
})
