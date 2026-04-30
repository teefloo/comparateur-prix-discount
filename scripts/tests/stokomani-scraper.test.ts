import assert from 'node:assert/strict'
import test from 'node:test'

import {
  normalizeRetailerBrand,
  normalizeRetailerProductName,
  toRetailerOfferCard,
} from '../../src/lib/scraper-utils'

test('stokomani product names drop retailer prefixes', () => {
  assert.equal(
    normalizeRetailerProductName('stokomani', 'Stokomani Eau de parfum kiss my ex'),
    'Eau de parfum kiss my ex',
  )
  assert.equal(
    normalizeRetailerProductName('stokomani', 'Stockomani Eau de parfum kiss my ex'),
    'Eau de parfum kiss my ex',
  )
})

test('stokomani retailer names are not treated as product brands', () => {
  assert.equal(normalizeRetailerBrand('stokomani', 'Stokomani'), undefined)
  assert.equal(normalizeRetailerBrand('stokomani', 'stockomani'), undefined)
})

test('stokomani retail cards keep the product title only', () => {
  const card = toRetailerOfferCard({
    id: 'stokomani-1',
    retailer: 'stokomani',
    name: 'Stokomani Shampoing usage quotidien',
    category: 'hygiene',
    brand: 'Stokomani',
    price: 3.99,
    url: 'https://www.stokomani.fr/products/shampoing-usage-quotidien',
    image: '',
  })

  assert.equal(card.name, 'Shampoing usage quotidien')
  assert.equal(card.brand, undefined)
})
