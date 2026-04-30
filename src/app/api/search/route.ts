import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

import {
  CATEGORY_LABELS,
  RETAILERS,
  SUPPORTED_CATEGORIES,
  isRetailer,
  isSupportedCategory,
  type Retailer,
  type SupportedCategory,
} from '@/lib/catalog'
import { getOffersByCategory, searchOffersInDb } from '@/lib/db'
import { scrapeRetailers } from '@/lib/scrape-runtime'
import { filterOffersByQuery, sortRetailerOfferCards, toRetailerOfferCard } from '@/lib/scraper-utils'
import type { RetailerOfferCard } from '@/lib/types'

export const dynamic = 'force-dynamic'

const LIVE_SCRAPE_TIMEOUT_MS = process.env.VERCEL === '1' ? 8000 : 30000
const CATEGORY_DB_LIMIT = 5000
const CATEGORY_RESULTS_LIMIT = 120
const CATEGORY_ONLY_LIVE_SCRAPE_RETAILERS = RETAILERS.filter(
  (retailer): retailer is Retailer => retailer !== 'lafoirfouille' && retailer !== 'maxibazar',
)

const DEMO_OFFERS: RetailerOfferCard[] = [
  {
    id: 'demo-action-lessive-yara',
    productId: 'demo-action-lessive-yara',
    retailer: 'action',
    name: 'Lessive liquide Yara',
    category: 'menage',
    price: 7.99,
    url: 'https://www.action.com/fr-fr/',
    image: '',
    quantity: '2l',
    unitPrice: 4,
    unitPriceLabel: '/l',
  },
  {
    id: 'demo-aldi-lait-demi-ecreme',
    productId: 'demo-aldi-lait-demi-ecreme',
    retailer: 'aldi',
    name: 'Lait demi-écrémé',
    category: 'alimentation',
    price: 0.99,
    url: 'https://www.aldi.fr/',
    image: '',
    quantity: '1l',
    unitPrice: 0.99,
    unitPriceLabel: '/l',
  },
  {
    id: 'demo-stokomani-shampoing-quotidien',
    productId: 'demo-stokomani-shampoing-quotidien',
    retailer: 'stokomani',
    name: 'Shampoing usage quotidien',
    category: 'hygiene',
    price: 3.99,
    url: 'https://www.stokomani.fr/',
    image: '',
    quantity: '300ml',
    unitPrice: 13.3,
    unitPriceLabel: '/l',
  },
  {
    id: 'demo-bm-dentifrice-menthol',
    productId: 'demo-bm-dentifrice-menthol',
    retailer: 'bm',
    name: 'Dentifrice menthol',
    category: 'hygiene',
    price: 2.29,
    url: 'https://bmstores.fr/',
    image: '',
    quantity: '75ml',
    unitPrice: 30.53,
    unitPriceLabel: '/l',
  },
  {
    id: 'demo-centrakor-brosse-dents',
    productId: 'demo-centrakor-brosse-dents',
    retailer: 'centrakor',
    name: 'Brosse à dents',
    category: 'hygiene',
    price: 2.99,
    url: 'https://www.centrakor.com/',
    image: '',
    quantity: '2pcs',
    unitPrice: 1.5,
    unitPriceLabel: '/pcs',
  },
  {
    id: 'demo-action-coussin-fleuri',
    productId: 'demo-action-coussin-fleuri',
    retailer: 'action',
    name: 'Coussin fleuri',
    category: 'maison-deco',
    price: 7.49,
    url: 'https://www.action.com/fr-fr/',
    image: '',
  },
  {
    id: 'demo-centrakor-vase-verre',
    productId: 'demo-centrakor-vase-verre',
    retailer: 'centrakor',
    name: 'Vase en verre décoratif',
    category: 'maison-deco',
    price: 4.99,
    url: 'https://www.centrakor.com/',
    image: '',
  },
  {
    id: 'demo-stokomani-transat-pliant',
    productId: 'demo-stokomani-transat-pliant',
    retailer: 'stokomani',
    name: 'Transat pliant',
    category: 'jardin',
    price: 19.99,
    url: 'https://www.stokomani.fr/',
    image: '',
  },
  {
    id: 'demo-bm-serviette-plage',
    productId: 'demo-bm-serviette-plage',
    retailer: 'bm',
    name: 'Serviette de plage',
    category: 'jardin',
    price: 4.99,
    url: 'https://bmstores.fr/',
    image: '',
  },
  {
    id: 'demo-action-tournevis-cruciforme',
    productId: 'demo-action-tournevis-cruciforme',
    retailer: 'action',
    name: 'Tournevis cruciforme',
    category: 'bricolage',
    price: 2.99,
    url: 'https://www.action.com/fr-fr/',
    image: '',
  },
  {
    id: 'demo-bm-ruban-adhesif-masking',
    productId: 'demo-bm-ruban-adhesif-masking',
    retailer: 'bm',
    name: 'Ruban adhésif masking',
    category: 'bricolage',
    price: 1.99,
    url: 'https://bmstores.fr/',
    image: '',
  },
  {
    id: 'demo-action-peluche-licorne',
    productId: 'demo-action-peluche-licorne',
    retailer: 'action',
    name: 'Peluche licorne',
    category: 'loisirs',
    price: 7.99,
    url: 'https://www.action.com/fr-fr/',
    image: '',
  },
  {
    id: 'demo-stokomani-puzzle-1000-pieces',
    productId: 'demo-stokomani-puzzle-1000-pieces',
    retailer: 'stokomani',
    name: 'Puzzle 1000 pièces',
    category: 'loisirs',
    price: 12.99,
    url: 'https://www.stokomani.fr/',
    image: '',
  },
  {
    id: 'demo-stokomani-croquettes-chien-5kg',
    productId: 'demo-stokomani-croquettes-chien-5kg',
    retailer: 'stokomani',
    name: 'Croquettes chien 5kg',
    category: 'animaux',
    price: 24.99,
    url: 'https://www.stokomani.fr/',
    image: '',
    quantity: '5kg',
    unitPrice: 5,
    unitPriceLabel: '/kg',
  },
  {
    id: 'demo-action-litiere-chat',
    productId: 'demo-action-litiere-chat',
    retailer: 'action',
    name: 'Litière chat',
    category: 'animaux',
    price: 6.99,
    url: 'https://www.action.com/fr-fr/',
    image: '',
  },
  {
    id: 'demo-centrakor-housse-couette',
    productId: 'demo-centrakor-housse-couette',
    retailer: 'centrakor',
    name: 'Housse de couette 240x220',
    category: 'textile',
    price: 19.99,
    url: 'https://www.centrakor.com/',
    image: '',
  },
  {
    id: 'demo-bm-rideau-occultant',
    productId: 'demo-bm-rideau-occultant',
    retailer: 'bm',
    name: 'Rideau occultant',
    category: 'textile',
    price: 9.99,
    url: 'https://bmstores.fr/',
    image: '',
  },
  {
    id: 'demo-gifi-spray-nettoyant',
    productId: 'demo-gifi-spray-nettoyant',
    retailer: 'gifi',
    name: 'Spray nettoyant multi-usage cerise',
    category: 'menage',
    price: 1.55,
    url: 'https://www.gifi.fr/',
    image: '',
    quantity: '750ml',
    unitPrice: 2.07,
    unitPriceLabel: '/l',
  },
  {
    id: 'demo-gifi-bobine-essuie-tout',
    productId: 'demo-gifi-bobine-essuie-tout',
    retailer: 'gifi',
    name: 'Bobine essuie tout Tenerella XL x2',
    category: 'menage',
    price: 4.99,
    url: 'https://www.gifi.fr/',
    image: '',
    quantity: '2pcs',
    unitPrice: 2.5,
    unitPriceLabel: '/pcs',
  },
  {
    id: 'demo-lafoirfouille-boite-rangement',
    productId: 'demo-lafoirfouille-boite-rangement',
    retailer: 'lafoirfouille',
    name: 'Boite de rangement avec couvercle',
    category: 'menage',
    price: 4.99,
    url: 'https://www.lafoirfouille.fr/',
    image: '',
  },
  {
    id: 'demo-lidl-caffeinethe',
    productId: 'demo-lidl-caffeinethe',
    retailer: 'lidl',
    name: 'Café moulu intense',
    category: 'alimentation',
    price: 3.49,
    url: 'https://www.lidl.fr/',
    image: '',
    quantity: '500g',
    unitPrice: 6.98,
    unitPriceLabel: '/kg',
  },
  {
    id: 'demo-noz-billes-chocolat-noir',
    productId: 'demo-noz-billes-chocolat-noir',
    retailer: 'noz',
    name: 'Billes de chocolat noir',
    category: 'alimentation',
    price: 1.79,
    url: 'https://www.noz.fr/shop/',
    image: '',
    quantity: '500g',
    unitPrice: 3.58,
    unitPriceLabel: '/kg',
  },
  {
    id: 'demo-noz-blocs-wc',
    productId: 'demo-noz-blocs-wc',
    retailer: 'noz',
    name: 'Blocs WC avec applicateur parfume',
    category: 'menage',
    price: 1.79,
    url: 'https://www.noz.fr/shop/',
    image: '',
    quantity: '12pcs',
    unitPrice: 0.15,
    unitPriceLabel: '/pcs',
  },
]

type SearchSource = 'database' | 'real-time' | 'demo-fallback' | null

function dedupeOffers(offers: RetailerOfferCard[]) {
  const seenIds = new Set<string>()
  const deduped: RetailerOfferCard[] = []

  for (const offer of offers) {
    if (seenIds.has(offer.id)) continue
    seenIds.add(offer.id)
    deduped.push(offer)
  }

  return deduped
}

function getDemoOffers(query: string, category: SupportedCategory | null, selectedRetailers: Retailer[]) {
  let offers = DEMO_OFFERS

  if (category) {
    offers = offers.filter((offer) => offer.category === category)
  }

  if (selectedRetailers.length > 0) {
    offers = offers.filter((offer) => selectedRetailers.includes(offer.retailer))
  }

  if (query) {
    offers = filterOffersByQuery(offers, query)
  }

  return sortRetailerOfferCards(offers)
}

function readLastUpdateTimestamp() {
  try {
    const resultsPath = path.resolve(process.cwd(), 'scrape-results.json')
    if (!fs.existsSync(resultsPath)) {
      return null
    }

    const parsed = JSON.parse(fs.readFileSync(resultsPath, 'utf8'))
    return typeof parsed.timestamp === 'string' ? parsed.timestamp : null
  } catch (error) {
    console.error('Error reading scrape-results.json:', error)
    return null
  }
}

async function withTimeout<T>(taskName: string, task: Promise<T>, timeoutMs: number): Promise<T | null> {
  let timeoutId: NodeJS.Timeout | null = null

  const timeoutPromise = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => {
      console.warn(`${taskName} timed out after ${timeoutMs}ms`)
      resolve(null)
    }, timeoutMs)
  })

  const result = await Promise.race([task, timeoutPromise])
  if (timeoutId) {
    clearTimeout(timeoutId)
  }

  return result
}

function parseCategory(value: string | null): SupportedCategory | null {
  return isSupportedCategory(value) ? value : null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = (searchParams.get('query') || '').trim()
  const category = parseCategory(searchParams.get('category'))
  const retailerParam = searchParams.get('retailer') || ''
  const selectedRetailers = retailerParam.split(',').filter((r): r is Retailer => isRetailer(r))
  const lastUpdate = readLastUpdateTimestamp()

  if (!query && !category) {
    return NextResponse.json({
      products: [],
      count: 0,
      grouped: false,
      source: null,
      lastUpdate,
      categories: Object.fromEntries(SUPPORTED_CATEGORIES.map((value) => [value, CATEGORY_LABELS[value]])),
    })
  }

  let databaseOffers: RetailerOfferCard[] = []

  const validatedRetailer = selectedRetailers.length === 1 ? selectedRetailers[0] : null
  const dbLimit = validatedRetailer ? 5000 : CATEGORY_DB_LIMIT

  try {
    databaseOffers = query
      ? await searchOffersInDb(query, category, validatedRetailer)
      : category
        ? await getOffersByCategory(category, dbLimit, validatedRetailer)
        : []
  } catch (error) {
    console.error('Search API database lookup failed:', error)
  }

  let liveOffers: RetailerOfferCard[] = []
  // Category browsing should stay responsive; rely on persisted data unless there
  // is nothing stored yet, and keep live scraping for targeted search queries.
  const shouldLiveScrape = query
    ? databaseOffers.length < 5
    : Boolean(category) && databaseOffers.length === 0 && process.env.VERCEL !== '1'

  if (shouldLiveScrape) {
    const scrapeResults = await withTimeout(
      'Retailer scrape',
      scrapeRetailers({
        searchQuery: query || undefined,
        retailers: query ? undefined : CATEGORY_ONLY_LIVE_SCRAPE_RETAILERS,
        includeBrowserScrapers: process.env.VERCEL !== '1',
        maxAttempts: 2,
      }),
      LIVE_SCRAPE_TIMEOUT_MS,
    )

    if (scrapeResults) {
      liveOffers = scrapeResults.flatMap((result) =>
        result.offers.map((offer) =>
          toRetailerOfferCard({
            ...offer,
            url: offer.sourceUrl,
          }),
        ),
      )
    }
  }

  let mergedOffers = dedupeOffers([...databaseOffers, ...liveOffers])

  if (selectedRetailers.length > 0) {
    mergedOffers = mergedOffers.filter((offer) => selectedRetailers.includes(offer.retailer))
  }

  if (category) {
    mergedOffers = mergedOffers.filter((offer) => offer.category === category)
  }

  if (query) {
    mergedOffers = filterOffersByQuery(mergedOffers, query)
  }

  mergedOffers = sortRetailerOfferCards(mergedOffers)

  if (!query && category) {
    mergedOffers = mergedOffers.slice(0, CATEGORY_RESULTS_LIMIT)
  }

  let source: SearchSource = null

  if (databaseOffers.length > 0) {
    source = 'database'
  } else if (liveOffers.length > 0) {
    source = 'real-time'
  } else {
    mergedOffers = getDemoOffers(query, category, selectedRetailers)
    source = 'demo-fallback'
  }

  return NextResponse.json({
    products: mergedOffers,
    count: mergedOffers.length,
    grouped: false,
    source,
    lastUpdate,
    categories: Object.fromEntries(SUPPORTED_CATEGORIES.map((value) => [value, CATEGORY_LABELS[value]])),
  })
}
