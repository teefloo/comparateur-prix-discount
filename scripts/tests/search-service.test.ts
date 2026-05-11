import assert from 'node:assert/strict'
import test from 'node:test'

import { runSearch } from '../../src/lib/search-service'
import type { RetailerOfferCard } from '../../src/lib/types'

function buildOffer(overrides: Partial<RetailerOfferCard> & Pick<RetailerOfferCard, 'id' | 'productId' | 'retailer' | 'name' | 'category' | 'price' | 'url' | 'image'>): RetailerOfferCard {
  return {
    ...overrides,
  }
}

function createSearchDeps(offers: RetailerOfferCard[]) {
  return {
    canLiveScrape: false,
    searchOffersInDb: async () => offers,
    getOffersByCategory: async () => [],
    scrapeRetailers: async () => [],
    readLastUpdateTimestamp: () => null,
  }
}

test('text search keeps database results when the DB responds', async () => {
  const offer = buildOffer({
    id: 'db-1',
    productId: 'db-1',
    retailer: 'action',
    name: 'Lessive en feuilles Color',
    category: 'menage',
    price: 2.28,
    url: 'https://example.com/db-1',
    image: '',
  })

  const response = await runSearch(
    { query: 'lessive' },
    {
      canLiveScrape: false,
      searchOffersInDb: async () => [offer],
      getOffersByCategory: async () => [],
      scrapeRetailers: async () => [],
      readLastUpdateTimestamp: () => '2026-04-30T00:00:00.000Z',
    },
  )

  assert.equal(response.source, 'database')
  assert.equal(response.count, 1)
  assert.equal(response.products[0]?.id, 'db-1')
  assert.equal(response.error, undefined)
  assert.equal(response.errorCode, undefined)
})

test('text search surfaces a database outage instead of demo results', async () => {
  const response = await runSearch(
    { query: 'lessive' },
    {
      canLiveScrape: true,
      searchOffersInDb: async () => {
        throw new Error('database offline')
      },
      getOffersByCategory: async () => [],
      scrapeRetailers: async () => {
        throw new Error('live scrape should not run after a DB failure')
      },
      readLastUpdateTimestamp: () => null,
    },
  )

  assert.equal(response.source, null)
  assert.equal(response.count, 0)
  assert.equal(response.products.length, 0)
  assert.equal(response.errorCode, 'DB_UNAVAILABLE')
  assert.match(response.error || '', /temporairement indisponible/i)
})

test('text search returns an empty result set when nothing matches', async () => {
  const response = await runSearch(
    { query: 'zzzzzz' },
    {
      canLiveScrape: false,
      searchOffersInDb: async () => [],
      getOffersByCategory: async () => [],
      scrapeRetailers: async () => [],
      readLastUpdateTimestamp: () => null,
    },
  )

  assert.equal(response.source, null)
  assert.equal(response.count, 0)
  assert.equal(response.products.length, 0)
  assert.equal(response.error, undefined)
  assert.equal(response.errorCode, undefined)
})

test('text search filters offers with a minimum price, maximum price and inclusive range', async () => {
  const offers = [
    buildOffer({
      id: 'search-1',
      productId: 'search-1',
      retailer: 'action',
      name: 'Savon eco 1',
      category: 'hygiene',
      price: 1.99,
      url: 'https://example.com/search-1',
      image: '',
    }),
    buildOffer({
      id: 'search-2',
      productId: 'search-2',
      retailer: 'stokomani',
      name: 'Savon eco 2',
      category: 'hygiene',
      price: 3,
      url: 'https://example.com/search-2',
      image: '',
    }),
    buildOffer({
      id: 'search-3',
      productId: 'search-3',
      retailer: 'bm',
      name: 'Savon eco 3',
      category: 'hygiene',
      price: 4.5,
      url: 'https://example.com/search-3',
      image: '',
    }),
  ]

  const minOnlyResponse = await runSearch({ query: 'savon', minPrice: '3' }, createSearchDeps(offers))
  const maxOnlyResponse = await runSearch({ query: 'savon', maxPrice: '3' }, createSearchDeps(offers))
  const rangeResponse = await runSearch({ query: 'savon', minPrice: '3', maxPrice: '4.5' }, createSearchDeps(offers))

  assert.deepEqual(
    minOnlyResponse.products.map((offer) => offer.id),
    ['search-2', 'search-3'],
  )
  assert.deepEqual(
    maxOnlyResponse.products.map((offer) => offer.id),
    ['search-1', 'search-2'],
  )
  assert.deepEqual(
    rangeResponse.products.map((offer) => offer.id),
    ['search-2', 'search-3'],
  )
})

test('text search normalizes reversed price bounds before filtering', async () => {
  const offers = [
    buildOffer({
      id: 'range-1',
      productId: 'range-1',
      retailer: 'action',
      name: 'Liquide vaisselle 1',
      category: 'menage',
      price: 1.5,
      url: 'https://example.com/range-1',
      image: '',
    }),
    buildOffer({
      id: 'range-2',
      productId: 'range-2',
      retailer: 'bm',
      name: 'Liquide vaisselle 2',
      category: 'menage',
      price: 2.5,
      url: 'https://example.com/range-2',
      image: '',
    }),
    buildOffer({
      id: 'range-3',
      productId: 'range-3',
      retailer: 'gifi',
      name: 'Liquide vaisselle 3',
      category: 'menage',
      price: 4,
      url: 'https://example.com/range-3',
      image: '',
    }),
  ]

  const response = await runSearch({ query: 'liquide', minPrice: '4', maxPrice: '2' }, createSearchDeps(offers))

  assert.deepEqual(
    response.products.map((offer) => offer.id),
    ['range-2', 'range-3'],
  )
})

test('text search sorts results by numeric price in ascending and descending order', async () => {
  const offers = [
    buildOffer({
      id: 'sort-1',
      productId: 'sort-1',
      retailer: 'action',
      name: 'Dentifrice 1',
      category: 'hygiene',
      price: 9,
      url: 'https://example.com/sort-1',
      image: '',
    }),
    buildOffer({
      id: 'sort-2',
      productId: 'sort-2',
      retailer: 'bm',
      name: 'Dentifrice 2',
      category: 'hygiene',
      price: 3.25,
      url: 'https://example.com/sort-2',
      image: '',
    }),
    buildOffer({
      id: 'sort-3',
      productId: 'sort-3',
      retailer: 'gifi',
      name: 'Dentifrice 3',
      category: 'hygiene',
      price: 5.1,
      url: 'https://example.com/sort-3',
      image: '',
    }),
  ]

  const ascResponse = await runSearch({ query: 'dentifrice', sort: 'price-asc' }, createSearchDeps(offers))
  const descResponse = await runSearch({ query: 'dentifrice', sort: 'price-desc' }, createSearchDeps(offers))

  assert.deepEqual(
    ascResponse.products.map((offer) => offer.id),
    ['sort-2', 'sort-3', 'sort-1'],
  )
  assert.deepEqual(
    descResponse.products.map((offer) => offer.id),
    ['sort-1', 'sort-3', 'sort-2'],
  )
})

test('text search keeps a stable order when prices are identical', async () => {
  const offers = [
    buildOffer({
      id: 'stable-3',
      productId: 'stable-3',
      retailer: 'action',
      name: 'Shampoing Bravo',
      category: 'hygiene',
      price: 4.99,
      url: 'https://example.com/stable-3',
      image: '',
    }),
    buildOffer({
      id: 'stable-2',
      productId: 'stable-2',
      retailer: 'bm',
      name: 'Shampoing Alpha',
      category: 'hygiene',
      price: 4.99,
      url: 'https://example.com/stable-2',
      image: '',
    }),
    buildOffer({
      id: 'stable-1',
      productId: 'stable-1',
      retailer: 'gifi',
      name: 'Shampoing Alpha',
      category: 'hygiene',
      price: 4.99,
      url: 'https://example.com/stable-1',
      image: '',
    }),
  ]

  const response = await runSearch({ query: 'shampoing', sort: 'price-asc' }, createSearchDeps(offers))

  assert.deepEqual(
    response.products.map((offer) => offer.id),
    ['stable-1', 'stable-2', 'stable-3'],
  )
})
