import assert from 'node:assert/strict'
import test from 'node:test'

import { NextRequest } from 'next/server'

import nextConfig from '../next.config.mjs'
import {
  PRODUCT_API_CACHE_CONTROL,
  PRODUCT_CACHE_REVALIDATE_SECONDS,
  PRODUCT_CACHE_STALE_WHILE_REVALIDATE_SECONDS,
} from '../src/lib/cache-policy.ts'
import { DEMO_OFFERS } from '../src/lib/demo-offers.ts'
import { GET as getProductApi } from '../src/app/api/produit/[id]/route.ts'
import {
  dynamic,
  dynamicParams,
  generateMetadata,
  revalidate,
} from '../src/app/produit/[id]/page.tsx'

test('product page uses on-demand ISR while preserving dynamic product URLs', () => {
  assert.equal(dynamic, 'force-static')
  assert.equal(revalidate, PRODUCT_CACHE_REVALIDATE_SECONDS)
  assert.equal(dynamicParams, true)
})

test('product metadata keeps the existing canonical URL', async () => {
  const product = DEMO_OFFERS[0]
  const metadata = await generateMetadata({ params: Promise.resolve({ id: product.id }) })

  assert.equal(metadata.alternates?.canonical, `/produit/${product.id}`)
  assert.equal(metadata.title, product.name)
})

test('product API caches public success responses and keeps the response shape', async () => {
  const product = DEMO_OFFERS[0]
  const response = await getProductApi(
    new NextRequest(`http://localhost/api/produit/${product.id}`),
    { params: Promise.resolve({ id: product.id }) },
  )

  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), PRODUCT_API_CACHE_CONTROL)
  assert.equal(
    PRODUCT_API_CACHE_CONTROL,
    `public, s-maxage=${PRODUCT_CACHE_REVALIDATE_SECONDS}, stale-while-revalidate=${PRODUCT_CACHE_STALE_WHILE_REVALIDATE_SECONDS}`,
  )

  const payload = await response.json()
  assert.equal(payload.offer.id, product.id)
  assert.equal(payload.offer.price, product.price)
})

test('product API keeps its not-found status and error shape', async () => {
  const response = await getProductApi(
    new NextRequest('http://localhost/api/produit/unknown-product-id'),
    { params: Promise.resolve({ id: 'unknown-product-id' }) },
  )

  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), { error: 'Produit non trouvé' })
})

test('Next headers keep the longer cache scoped to product API responses', async () => {
  const headers = await nextConfig.headers()
  const productRule = headers.find((entry) => entry.source === '/api/produit/:id')
  const genericApiRule = headers.find((entry) => entry.source === '/api/:path*')

  assert.equal(productRule?.headers[0]?.value, PRODUCT_API_CACHE_CONTROL)
  assert.equal(genericApiRule?.headers[0]?.value, 'public, s-maxage=60, stale-while-revalidate=300')
})
