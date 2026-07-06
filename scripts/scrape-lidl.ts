import dotenv from 'dotenv'
import path from 'path'

import { runIsolatedRetailerScrape } from '../src/lib/scrape-runtime'
import { scrapeLidlProductsDetailed } from '../src/lib/scrapers/lidl-scraper'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

runIsolatedRetailerScrape('lidl', 'Lidl', scrapeLidlProductsDetailed).catch((error) => {
  console.error('Lidl scrape failed:', error)
  process.exitCode = 1
})
