import assert from 'node:assert/strict'
import test from 'node:test'

import {
  dedupeMaxibazarOffers,
  extractMaxibazarProductPageOffer,
  parseMaxibazarPrice,
} from '../../src/lib/scrapers/maxibazar-scraper'

const productPageHtml = `
<html>
  <head>
    <title>CHAISE JARDIN ACACIA 40X52X85.5CM | Maxi Bazar</title>
  </head>
  <body>
    <script type="application/ld+json">
      [
        {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://maxibazar.fr/" },
            { "@type": "ListItem", "position": 2, "name": "Amenagement exterieur", "item": "https://maxibazar.fr/amenagement-exterieur" },
            { "@type": "ListItem", "position": 3, "name": "Mobilier de jardin", "item": "https://maxibazar.fr/mobilier-de-jardin" },
            { "@type": "ListItem", "position": 4, "name": "Assises pour exterieur", "item": "https://maxibazar.fr/assises-pour-exterieur" },
            { "@type": "ListItem", "position": 5, "name": "CHAISE JARDIN ACACIA 40X52X85.5CM" }
          ]
        },
        {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": "CHAISE JARDIN ACACIA 40X52X85.5CM",
          "sku": "2311000410",
          "image": ["/media/chaise.jpg"],
          "description": "Chaise de jardin en acacia.",
          "offers": {
            "@type": "Offer",
            "url": "/chaise-jardin-acacia-40x52x85-5cm",
            "price": "39,99",
            "availability": "https://schema.org/InStock"
          }
        }
      ]
    </script>
  </body>
</html>
`

const changeFallbackHtml = `
<html>
  <body>
    <script>
      window.__change['10'] = {
        common: {
          id: '2311000411',
          reference: '2311000411',
          brand: 'Maxi Home',
          description: 'Plateau de service polyvalent',
          URL: { canonical: 'https://maxibazar.fr/plateau-de-service' }
        },
        rootProduct: {
          name: 'Plateau de service',
          web_category_label: 'Tout pour la cuisine',
          category: { path: 'Accueil | Utilitaire de la maison et bazar | Tout pour la cuisine' }
        },
        visuals: [
          { detail: '/media/plateau-detail.jpg', original: '/media/plateau-original.jpg' }
        ],
        price: { current: '12.50', original: '15.00' },
        stock: { message: 'En stock dans 2 magasins' }
      }
    </script>
  </body>
</html>
`

test('parses Maxi Bazar product pages from json-ld with breadcrumb paths', () => {
  const offer = extractMaxibazarProductPageOffer(
    productPageHtml,
    'https://maxibazar.fr/chaise-jardin-acacia-40x52x85-5cm',
  )

  assert.ok(offer)
  assert.equal(offer?.retailer, 'maxibazar')
  assert.equal(offer?.sourceProductId, '2311000410')
  assert.equal(offer?.price, 39.99)
  assert.equal(offer?.image, 'https://maxibazar.fr/media/chaise.jpg')
  assert.equal(offer?.availability, 'En stock')
  assert.equal(offer?.category, 'jardin')
  assert.equal(offer?.sourceCategoryPath?.includes('Mobilier de jardin'), true)
})

test('parses Maxi Bazar fallback data from window.__change', () => {
  const offer = extractMaxibazarProductPageOffer(
    changeFallbackHtml,
    'https://maxibazar.fr/plateau-de-service',
  )

  assert.ok(offer)
  assert.equal(offer?.retailer, 'maxibazar')
  assert.equal(offer?.sourceProductId, '2311000411')
  assert.equal(offer?.brand, 'Maxi Home')
  assert.equal(offer?.price, 12.5)
  assert.equal(offer?.originalPrice, 15)
  assert.equal(offer?.image, 'https://maxibazar.fr/media/plateau-original.jpg')
  assert.equal(offer?.availability, 'En stock')
  assert.equal(offer?.category, 'bazar')
  assert.equal(offer?.sourceCategoryPath?.includes('Tout pour la cuisine'), true)
})

test('deduplicates Maxi Bazar offers by stable source identity', () => {
  const offer = extractMaxibazarProductPageOffer(
    productPageHtml,
    'https://maxibazar.fr/chaise-jardin-acacia-40x52x85-5cm',
  )

  assert.ok(offer)

  const deduped = dedupeMaxibazarOffers([offer!, { ...offer!, description: 'duplicate copy' }])
  assert.equal(deduped.length, 1)
})

test('parses Maxi Bazar price values', () => {
  assert.equal(parseMaxibazarPrice('39,99 EUR'), 39.99)
  assert.equal(parseMaxibazarPrice(12.5), 12.5)
})
