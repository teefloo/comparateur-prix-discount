import assert from 'node:assert/strict'
import test from 'node:test'

import { runSearch } from '../../src/lib/search-service'
import type { RetailerOfferCard } from '../../src/lib/types'

function buildOffer(overrides: Partial<RetailerOfferCard> & Pick<RetailerOfferCard, 'id' | 'productId' | 'retailer' | 'name' | 'category' | 'price' | 'url' | 'image'>): RetailerOfferCard {
  return {
    ...overrides,
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
