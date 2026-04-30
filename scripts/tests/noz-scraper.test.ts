import assert from 'node:assert/strict'
import test from 'node:test'

import {
  dedupeNozOffers,
  extractNozApiProductOffer,
  extractNozListingEnhancements,
  parseNozPrice,
  type NozStoreProduct,
} from '../../src/lib/scrapers/noz-scraper'

const barreChocolatee: NozStoreProduct = {
  id: 118474,
  name: 'BARRE CHOCOLAT\u00c9E',
  sku: '625c41c347ce',
  permalink: 'https://www.noz.fr/product/barre-chocolatee/',
  prices: {
    price: '199',
    regular_price: '199',
    sale_price: '199',
    currency_minor_unit: 2,
  },
  images: [
    {
      src: 'https://www.noz.fr/uploads/2026/01/BARRE-CHOCOLATEE.jpg',
    },
  ],
  categories: [
    {
      name: 'Alimentaire',
      slug: 'alimentaire-boissons',
    },
  ],
  tags: [{ name: 'Nouveau', slug: 'nouveau' }],
  is_in_stock: true,
}

const listingHtml = `
<ul class="products">
  <li class="product">
    <a href="https://www.noz.fr/product/barre-chocolatee/" class="woocommerce-LoopProduct-link">
      <div class="statutprod">surstocks</div>
      <div class="subtitle1">185 g</div>
      <div class="subtitle2">Divers mod&egrave;les</div>
      <div class="priceunite">Soit 10.76 &#8364; le kg</div>
      <h2 class="woocommerce-loop-product__title">BARRE CHOCOLAT&Eacute;E</h2>
      <span class="price">1,99 &#8364;</span>
    </a>
  </li>
</ul>
`

test('parses Noz API products with decoded names and store price units', () => {
  const offer = extractNozApiProductOffer({
    ...barreChocolatee,
    name: 'LIMONADE AROMATIS\u00c9E \u00c0 L&rsquo;HIBISCUS',
    prices: {
      price: '59',
      currency_minor_unit: 2,
    },
  })

  assert.ok(offer)
  assert.equal(offer?.retailer, 'noz')
  assert.equal(offer?.sourceProductId, '625c41c347ce')
  assert.equal(offer?.sourceUrl, 'https://www.noz.fr/product/barre-chocolatee/')
  assert.equal(offer?.name, "LIMONADE AROMATIS\u00c9E \u00c0 L'HIBISCUS")
  assert.equal(offer?.price, 0.59)
  assert.equal(offer?.image, 'https://www.noz.fr/uploads/2026/01/BARRE-CHOCOLATEE.jpg')
  assert.equal(offer?.availability, 'Disponible en magasin')
  assert.equal(offer?.category, 'alimentation')
})

test('parses Noz prices with currency minor units', () => {
  assert.equal(parseNozPrice({ prices: { price: '120', currency_minor_unit: 2 } }), 1.2)
  assert.equal(parseNozPrice({ prices: { price: '1200', currency_minor_unit: 3 } }), 1.2)
  assert.equal(parseNozPrice('199'), 1.99)
})

test('enriches Noz API products with listing subtitles and unit price text', () => {
  const enhancements = extractNozListingEnhancements(listingHtml)
  const enhancement = enhancements.get('https://www.noz.fr/product/barre-chocolatee/')
  const offer = extractNozApiProductOffer(barreChocolatee, enhancement)

  assert.ok(enhancement)
  assert.equal(enhancement?.status, 'surstocks')
  assert.equal(enhancement?.subtitle1, '185 g')
  assert.equal(enhancement?.subtitle2, 'Divers mod\u00e8les')
  assert.equal(enhancement?.priceUnitText, '10,76 EUR/kg')
  assert.equal(offer?.quantity, '185g')
  assert.equal(offer?.description?.includes('surstocks'), true)
  assert.equal(offer?.description?.includes('Divers mod\u00e8les'), true)
})

test('deduplicates Noz offers by stable source identity', () => {
  const offer = extractNozApiProductOffer(barreChocolatee)

  assert.ok(offer)

  const deduped = dedupeNozOffers([offer!, { ...offer!, description: 'duplicate copy' }])
  assert.equal(deduped.length, 1)
})
