import dotenv from 'dotenv'
import path from 'path'

import { runIsolatedRetailerScrape } from '../src/lib/scrape-runtime'
import { scrapeMaxibazarProductsDetailed } from '../src/lib/scrapers/maxibazar-scraper'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

runIsolatedRetailerScrape('maxibazar', 'Maxi Bazar', scrapeMaxibazarProductsDetailed).catch((error) => {
  console.error('Maxi Bazar scrape failed:', error)
  process.exitCode = 1
})
