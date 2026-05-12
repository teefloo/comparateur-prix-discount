import assert from 'node:assert/strict'
import test from 'node:test'

import {
  normalizeRetailerBrand,
  normalizeRetailerProductName,
  toRetailerOfferCard,
} from '../../src/lib/scraper-utils'
import {
  getStokomaniPageDelayMs,
  scrapeStokomaniProductsDetailed,
} from '../../src/lib/scrapers/stokomani-scraper'

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

test('stokomani page delay is configurable and pagination stops on partial pages', async () => {
  const originalEnv = {
    STOKOMANI_PAGE_DELAY_MS: process.env.STOKOMANI_PAGE_DELAY_MS,
    STOKOMANI_REQUEST_TIMEOUT_MS: process.env.STOKOMANI_REQUEST_TIMEOUT_MS,
    STOKOMANI_FULL_ENRICHMENT_LIMIT: process.env.STOKOMANI_FULL_ENRICHMENT_LIMIT,
  }
  const originalFetch = globalThis.fetch
  const requestedUrls: string[] = []

  function setEnv(name: keyof typeof originalEnv, value: string | undefined) {
    if (typeof value === 'undefined') {
      delete process.env[name]
      return
    }

    process.env[name] = value
  }

  try {
    setEnv('STOKOMANI_PAGE_DELAY_MS', undefined)
    assert.equal(getStokomaniPageDelayMs(), 3000)

    setEnv('STOKOMANI_PAGE_DELAY_MS', '1')
    setEnv('STOKOMANI_REQUEST_TIMEOUT_MS', '1000')
    setEnv('STOKOMANI_FULL_ENRICHMENT_LIMIT', '0')
    assert.equal(getStokomaniPageDelayMs(), 1)

    globalThis.fetch = (async (input: Parameters<typeof fetch>[0]) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
      requestedUrls.push(url)

      if (url === 'https://www.stokomani.fr/') {
        return new Response('<html><body>Stokomani</body></html>', {
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        })
      }

      const parsedUrl = new URL(url)
      const page = Number(parsedUrl.searchParams.get('page'))
      const productCount = page === 4 ? 12 : 250

      const products = Array.from({ length: productCount }, (_, index) => ({
        id: `${page}-${index}`,
        title: `Produit test ${page}-${index}`,
        handle: `produit-test-${page}-${index}`,
        vendor: 'Stokomani',
        product_type: 'menage',
        available: true,
        price: '9.99',
        compare_at_price: '12.99',
        variants: [{ price: '9.99', compare_at_price: '12.99' }],
      }))

      return new Response(JSON.stringify({ products }), {
        status: 200,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      })
    }) as typeof fetch

    const result = await scrapeStokomaniProductsDetailed()

    assert.equal(result.issues.length, 0)
    assert.equal(result.coverage.discoveredListings, 4)
    assert.equal(result.coverage.completedListings, 4)
    assert.equal(result.coverage.isComplete, true)
    assert.equal(result.offers.length, 762)
    assert.equal(requestedUrls.some((url) => url.includes('page=5')), false)
    assert.equal(requestedUrls.filter((url) => url.includes('/products.json')).length, 4)
  } finally {
    globalThis.fetch = originalFetch
    setEnv('STOKOMANI_PAGE_DELAY_MS', originalEnv.STOKOMANI_PAGE_DELAY_MS)
    setEnv('STOKOMANI_REQUEST_TIMEOUT_MS', originalEnv.STOKOMANI_REQUEST_TIMEOUT_MS)
    setEnv('STOKOMANI_FULL_ENRICHMENT_LIMIT', originalEnv.STOKOMANI_FULL_ENRICHMENT_LIMIT)
  }
})
