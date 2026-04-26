import { NextRequest, NextResponse } from 'next/server'
import * as fs from 'fs'
import * as path from 'path'

import {
  CATEGORY_LABELS,
  SUPPORTED_CATEGORIES,
  isSupportedCategory,
  type SupportedCategory,
} from '@/lib/catalog'
import { getOffersByCategory, searchOffersInDb } from '@/lib/db'
import { scrapeRetailers } from '@/lib/scrape-runtime'
import { filterOffersByQuery, sortRetailerOfferCards, toRetailerOfferCard } from '@/lib/scraper-utils'
import type { RetailerOfferCard } from '@/lib/types'

export const dynamic = 'force-dynamic'

const LIVE_SCRAPE_TIMEOUT_MS = 30000

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

function getDemoOffers(query: string, category: SupportedCategory | null) {
  let offers = DEMO_OFFERS

  if (category) {
    offers = offers.filter((offer) => offer.category === category)
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

  try {
    databaseOffers = query ? await searchOffersInDb(query, category) : category ? await getOffersByCategory(category) : []
  } catch (error) {
    console.error('Search API database lookup failed:', error)
  }

  let liveOffers: RetailerOfferCard[] = []
  const shouldLiveScrape = databaseOffers.length < 5

  if (shouldLiveScrape) {
    const scrapeResults = await withTimeout(
      'Retailer scrape',
      scrapeRetailers({
        searchQuery: query || undefined,
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

  if (category) {
    mergedOffers = mergedOffers.filter((offer) => offer.category === category)
  }

  if (query) {
    mergedOffers = filterOffersByQuery(mergedOffers, query)
  }

  mergedOffers = sortRetailerOfferCards(mergedOffers)

  let source: SearchSource = null

  if (databaseOffers.length > 0) {
    source = 'database'
  } else if (liveOffers.length > 0) {
    source = 'real-time'
  } else {
    mergedOffers = getDemoOffers(query, category)
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
