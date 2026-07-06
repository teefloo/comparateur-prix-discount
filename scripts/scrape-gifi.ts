import dotenv from 'dotenv'
import path from 'path'

import { runIsolatedRetailerScrape } from '../src/lib/scrape-runtime'
import { scrapeGifiProductsDetailed } from '../src/lib/scrapers/gifi-scraper'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

runIsolatedRetailerScrape('gifi', 'GIFI', scrapeGifiProductsDetailed).catch((error) => {
  console.error('GIFI scrape failed:', error)
  process.exitCode = 1
})
