import assert from 'node:assert/strict'
import test from 'node:test'

import { CATEGORY_LABELS } from '../../src/lib/catalog'
import { buildDealsApiResponse } from '../../src/lib/deals-feed'
import type { RetailerOfferCard } from '../../src/lib/types'

test('deals api response keeps the expected payload shape', () => {
  const sampleOffer: RetailerOfferCard = {
    id: 'deal-1',
    productId: 'deal-1',
    retailer: 'action',
    name: 'Promo sample',
    category: 'menage',
    price: 2.99,
    originalPrice: 4.99,
    discount: 40,
    url: 'https://example.com/deal-1',
    image: '',
    isOnPromotion: true,
  }

  const response = buildDealsApiResponse({
    products: [sampleOffer],
    count: 1,
    source: 'database',
    lastUpdate: '2026-04-30T10:00:00.000Z',
    warnings: ['partial_database_coverage'],
  })

  assert.deepEqual(Object.keys(response).sort(), ['categories', 'count', 'lastUpdate', 'products', 'source', 'warnings'])
  assert.equal(response.count, 1)
  assert.equal(response.source, 'database')
  assert.equal(response.lastUpdate, '2026-04-30T10:00:00.000Z')
  assert.equal(response.products[0]?.id, 'deal-1')
  assert.equal(response.categories.hygiene, CATEGORY_LABELS.hygiene)
  assert.deepEqual(response.warnings, ['partial_database_coverage'])
})
