import assert from 'node:assert/strict'
import test from 'node:test'

import {
  extractGifiCategoryPageOffers,
  extractGifiProductPageOffer,
  normalizeGifiImageUrl,
  parseGifiPrice,
} from '../../src/lib/scrapers/gifi-scraper'

const categoryTileHtml = `
<div class="product" data-pid="000000000000405281">
  <div class="product-tile position-relative">
    <div class="image-container">
      <a href="/maison/rangement-et-entretien/nettoyage-et-entretien/eponge-brosse-et-chiffon/bobine-essuie-tout-tenerella-xl-x2/000000000000405281.html">
        <img
          class="tile-image gtm-button"
          src="/dw/image/v2/BJSK_PRD/on/demandware.static/-/Sites-master_GIFI/default/dw8a09a463/4/0/405281_F.jpg?sw=156&amp;sh=156&amp;sm=fit"
          srcset="/dw/image/v2/BJSK_PRD/on/demandware.static/-/Sites-master_GIFI/default/dw8a09a463/4/0/405281_F.jpg?sw=156&amp;sh=156&amp;sm=fit 156w, /dw/image/v2/BJSK_PRD/on/demandware.static/-/Sites-master_GIFI/default/dw8a09a463/4/0/405281_F.jpg?sw=634&amp;sh=634&amp;sm=fit 634w"
          alt="Bobine essuie tout Tenerella XL x2"
        />
      </a>
    </div>
    <div class="tile-body">
      <span class="pdp-link gtm-button text-left" data-gtm="{&quot;product_id&quot;:&quot;000000000000405281&quot;,&quot;product_sku&quot;:&quot;000000000000405281&quot;,&quot;product_name&quot;:&quot;bobine essuie tout tenerella xl x2&quot;,&quot;product_brand&quot;:null,&quot;product_cat1&quot;:&quot;maison&quot;,&quot;product_cat2&quot;:&quot;rangement et entretien&quot;,&quot;product_cat3&quot;:&quot;nettoyage et entretien&quot;,&quot;product_cat4&quot;:&quot;eponge. brosse et chiffon&quot;,&quot;product_availability&quot;:&quot;en stock, disponible magasin&quot;}">
        <a class="link" href="/maison/rangement-et-entretien/nettoyage-et-entretien/eponge-brosse-et-chiffon/bobine-essuie-tout-tenerella-xl-x2/000000000000405281.html">Bobine essuie tout Tenerella XL x2</a>
      </span>
      <div class="price">
        <span class="d-flex align-items-end price-wrapper">
          <span class="sales fs-lg-16 lh-20">
            <span class="value">
              <div class="formatted-price align-items-start formatted-price--pseudo-1">
                <span class="sr-only">4,99 â‚¬</span>
                <span class="formatted-price__before-decimal" data-integer="4"></span>
                <span class="formatted-price__after-decimal">
                  <span class="formatted-price__currency" data-currency-symbol="â‚¬" data-currency="EUR"></span>
                  <span class="formatted-price__after-decimal--value" data-decimal="99"></span>
                </span>
              </div>
            </span>
          </span>
        </span>
      </div>
    </div>
  </div>
</div>
`

const productPageHtml = `
<html>
  <head>
    <title>Spray nettoyant multi-usage cerise 750 ml | GiFi</title>
    <meta property="og:title" content="Spray nettoyant multi-usage cerise 750 ml" />
    <meta property="og:image" content="https://www.gifi.fr/on/demandware.static/-/Sites-master_GIFI/default/dwa4af3a3f/6/2/625527_F.jpg" />
  </head>
  <body>
    <h1>Spray nettoyant multi-usage cerise 750 ml</h1>
    <input type="hidden" class="add-to-cart-url" data-gtm="{&quot;product_id&quot;:&quot;000000000000625527&quot;,&quot;product_sku&quot;:&quot;000000000000625527&quot;,&quot;product_name&quot;:&quot;spray nettoyant multiusage cerise 750 ml&quot;,&quot;product_cat1&quot;:&quot;maison&quot;,&quot;product_cat2&quot;:&quot;rangement et entretien&quot;,&quot;product_cat3&quot;:&quot;nettoyage et entretien&quot;,&quot;product_cat4&quot;:&quot;produits dentretien&quot;,&quot;product_availability&quot;:&quot;en stock, disponible magasin&quot;}" />
    <script type="application/ld+json">
      {
        "@context": "http://schema.org/",
        "@type": "Product",
        "name": "Spray nettoyant multi-usage cerise 750 ml",
        "sku": "000000000000625527",
        "image": ["https://www.gifi.fr/dw/image/v2/BJSK_PRD/on/demandware.static/-/Sites-master_GIFI/default/dwa4af3a3f/6/2/625527_F.jpg?sw=156&sh=156&sm=fit"],
        "description": "Spray nettoyant pour toutes surfaces d'une contenance de 750 ml.",
        "offers": {
          "url": "https://www.gifi.fr/maison/rangement-et-entretien/nettoyage-et-entretien/produits-d-entretien/spray-nettoyant-multi-usage-cerise-750-ml/000000000000625527.html",
          "@type": "Offer",
          "priceCurrency": "EUR",
          "price": 1.55,
          "availability": "http://schema.org/InStock"
        }
      }
    </script>
    <div class="product-description">
      <h2>Description du produit</h2>
      Spray nettoyant pour toutes surfaces d'une contenance de 750 ml.
    </div>
    <span class="sr-only">1,55 â‚¬</span>
  </body>
</html>
`

test('parses GIFI category tiles with normalized absolute urls and prices', () => {
  const offers = extractGifiCategoryPageOffers(
    categoryTileHtml,
    'https://www.gifi.fr/maison/rangement-et-entretien/nettoyage-et-entretien/',
  )

  assert.equal(offers.length, 1)
  assert.equal(offers[0]?.retailer, 'gifi')
  assert.equal(offers[0]?.sourceProductId, '000000000000405281')
  assert.equal(
    offers[0]?.sourceUrl,
    'https://www.gifi.fr/maison/rangement-et-entretien/nettoyage-et-entretien/eponge-brosse-et-chiffon/bobine-essuie-tout-tenerella-xl-x2/000000000000405281.html',
  )
  assert.equal(
    offers[0]?.image,
    'https://www.gifi.fr/dw/image/v2/BJSK_PRD/on/demandware.static/-/Sites-master_GIFI/default/dw8a09a463/4/0/405281_F.jpg?sw=634&sh=634&sm=fit',
  )
  assert.equal(offers[0]?.price, 4.99)
  assert.equal(offers[0]?.category, 'menage')
})

test('parses GIFI product pages from json-ld and gtm metadata', () => {
  const offer = extractGifiProductPageOffer(
    productPageHtml,
    'https://www.gifi.fr/maison/rangement-et-entretien/nettoyage-et-entretien/produits-d-entretien/spray-nettoyant-multi-usage-cerise-750-ml/000000000000625527.html',
  )

  assert.ok(offer)
  assert.equal(offer?.retailer, 'gifi')
  assert.equal(offer?.sourceProductId, '000000000000625527')
  assert.equal(offer?.price, 1.55)
  assert.equal(
    offer?.image,
    'https://www.gifi.fr/dw/image/v2/BJSK_PRD/on/demandware.static/-/Sites-master_GIFI/default/dwa4af3a3f/6/2/625527_F.jpg?sw=634&sh=634&sm=fit',
  )
  assert.equal(offer?.category, 'menage')
  assert.equal(offer?.sourceCategoryPath?.includes('rangement et entretien'), true)
})

test('keeps non-GIFI image urls unchanged', () => {
  const image = 'https://cdn.example.com/image.jpg?sw=156&sh=156&sm=fit'
  assert.equal(normalizeGifiImageUrl(image), image)
})

test('parses GIFI price strings', () => {
  assert.equal(parseGifiPrice('4,99 â‚¬'), 4.99)
  assert.equal(parseGifiPrice('1.55 â‚¬'), 1.55)
})
