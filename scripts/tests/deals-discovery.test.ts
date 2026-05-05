import assert from 'node:assert/strict'
import test from 'node:test'

import { RETAILERS } from '../../src/lib/catalog'
import {
  discoverDealUrlsFromHtml,
  filterPromotionalOffers,
  getDealEntrypoint,
  sortDealsByPriority,
} from '../../src/lib/deals'
import { buildDealsWarnings, mixDealsByRetailer } from '../../src/lib/deals-feed'
import { filterOffersByQuery } from '../../src/lib/scraper-utils'
import type { RetailerOfferCard } from '../../src/lib/types'

function buildCard(overrides: Partial<RetailerOfferCard> & Pick<RetailerOfferCard, 'id' | 'productId' | 'retailer' | 'name' | 'category' | 'price' | 'url' | 'image'>): RetailerOfferCard {
  return {
    ...overrides,
  }
}

test('deal discovery picks up promo links and official fallbacks', () => {
  const html = `
    <html>
      <body>
        <a href="/fr-fr/les-affaires-du-moment/">Voir les affaires du moment</a>
        <a href="/c/promotions/">Promotions</a>
        <a href="/nouveautes/">Accueil</a>
      </body>
    </html>
  `

  const urls = discoverDealUrlsFromHtml('action', html, 'https://www.action.com')
  assert.ok(urls.includes('https://www.action.com/fr-fr/les-affaires-du-moment/'))
  assert.ok(urls.includes('https://www.action.com/c/promotions/'))
  assert.equal(urls.some((url) => url.endsWith('/nouveautes/')), false)
})

test('every retailer exposes a deal entrypoint', () => {
  for (const retailer of RETAILERS) {
    const entrypoint = getDealEntrypoint(retailer)
    assert.ok(entrypoint.label.length > 0)
    assert.ok(entrypoint.url.startsWith('https://'))
  }
})

test('promotional offers are filtered and sorted by discount first', () => {
  const offers = [
    buildCard({
      id: 'a',
      productId: 'a',
      retailer: 'action',
      name: 'Offer A',
      category: 'menage',
      price: 4,
      originalPrice: 10,
      discount: 60,
      url: 'https://example.com/a',
      image: '',
      lastUpdated: '2026-04-30T10:00:00.000Z',
    }),
    buildCard({
      id: 'b',
      productId: 'b',
      retailer: 'action',
      name: 'Offer B',
      category: 'menage',
      price: 5,
      originalPrice: 8,
      discount: 40,
      url: 'https://example.com/b',
      image: '',
      lastUpdated: '2026-04-30T11:00:00.000Z',
    }),
    buildCard({
      id: 'c',
      productId: 'c',
      retailer: 'action',
      name: 'Offer C',
      category: 'menage',
      price: 6,
      url: 'https://example.com/c',
      image: '',
    }),
  ]

  const filtered = filterPromotionalOffers(offers)
  assert.equal(filtered.length, 2)

  const sorted = sortDealsByPriority(filtered)
  assert.equal(sorted[0]?.id, 'a')
  assert.equal(sorted[1]?.id, 'b')
})

test('deal mixing keeps multiple retailers visible in the first cards', () => {
  const offers = mixDealsByRetailer(
    [
      buildCard({
        id: 'l-1',
        productId: 'l-1',
        retailer: 'lidl',
        name: 'Lidl 1',
        category: 'bazar',
        price: 1,
        discount: 80,
        url: 'https://example.com/l-1',
        image: '',
      }),
      buildCard({
        id: 'l-2',
        productId: 'l-2',
        retailer: 'lidl',
        name: 'Lidl 2',
        category: 'bazar',
        price: 2,
        discount: 70,
        url: 'https://example.com/l-2',
        image: '',
      }),
      buildCard({
        id: 's-1',
        productId: 's-1',
        retailer: 'stokomani',
        name: 'Stokomani 1',
        category: 'bazar',
        price: 3,
        discount: 60,
        url: 'https://example.com/s-1',
        image: '',
      }),
      buildCard({
        id: 'a-1',
        productId: 'a-1',
        retailer: 'action',
        name: 'Action 1',
        category: 'bazar',
        price: 4,
        url: 'https://example.com/a-1',
        image: '',
      }),
      buildCard({
        id: 'b-1',
        productId: 'b-1',
        retailer: 'bm',
        name: 'B&M 1',
        category: 'bazar',
        price: 5,
        url: 'https://example.com/b-1',
        image: '',
      }),
    ],
    4,
    ['action', 'stokomani', 'bm', 'lidl'],
  )

  assert.equal(offers.length, 4)
  assert.deepEqual(
    offers.map((offer) => offer.retailer),
    ['action', 'stokomani', 'bm', 'lidl'],
  )
})

test('deal warnings expose partial coverage and runtime limits', () => {
  const warnings = buildDealsWarnings({
    requestedRetailers: ['action', 'stokomani', 'bm'],
    coveredRetailers: ['stokomani'],
    browserUnavailableRetailers: ['action', 'bm'],
  })

  assert.deepEqual(warnings.sort(), ['browser_scraper_unavailable_on_runtime', 'partial_database_coverage'])
})

test('deal search filters cards by product name, brand and description', () => {
  const offers = [
    buildCard({
      id: 'search-1',
      productId: 'search-1',
      retailer: 'action',
      name: 'Lessive concentrée',
      category: 'menage',
      price: 3,
      url: 'https://example.com/search-1',
      image: '',
      description: 'Promo sur la lessive',
    }),
    buildCard({
      id: 'search-2',
      productId: 'search-2',
      retailer: 'lidl',
      name: 'Gel douche',
      category: 'hygiene',
      price: 2,
      url: 'https://example.com/search-2',
      image: '',
      brand: 'Marque X',
    }),
  ]

  const filteredByName = filterOffersByQuery(offers, 'lessive')
  assert.equal(filteredByName.length, 1)
  assert.equal(filteredByName[0]?.id, 'search-1')

  const filteredByBrand = filterOffersByQuery(offers, 'marque x')
  assert.equal(filteredByBrand.length, 1)
  assert.equal(filteredByBrand[0]?.id, 'search-2')

  const filteredByDescription = filterOffersByQuery(offers, 'promo sur la lessive')
  assert.equal(filteredByDescription.length, 1)
  assert.equal(filteredByDescription[0]?.id, 'search-1')
})
