import dotenv from 'dotenv'
import path from 'path'

import { runIsolatedRetailerScrape } from '../src/lib/scrape-runtime'
import { scrapeLafoirfouilleProductsDetailed } from '../src/lib/scrapers/lafoirfouille-scraper'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

runIsolatedRetailerScrape('lafoirfouille', "La Foir'Fouille", scrapeLafoirfouilleProductsDetailed).catch((error) => {
  console.error("La Foir'Fouille scrape failed:", error)
  process.exitCode = 1
})
