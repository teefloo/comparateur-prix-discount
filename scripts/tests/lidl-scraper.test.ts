import assert from 'node:assert/strict'
import test from 'node:test'

import {
  extractLidlNavigationLinks,
  extractLidlOffersFromApiResponse,
  selectAllLidlCategorySources,
} from '../../src/lib/scrapers/lidl-scraper'

const navigationHtml = `
<html>
  <body>
    <a href="/h/fruits-et-legumes/h10071012">Fruits et légumes</a>
    <a href="/h/hygiene-et-beaute/h10071019">Hygiène et beauté</a>
    <a href="/h/nettoyage-de-la-maison/h10067527">Appareils de nettoyage</a>
    <a href="/h/mode-femme/h10067567">Mode pour femme</a>
    <a href="/h/jouets/h10067573">Jouets</a>
  </body>
</html>
`

const categoryApiResponse = {
  numFound: 2,
  offset: 0,
  fetchsize: 36,
  items: [
    {
      gridbox: {
        data: {
          productId: '10035199',
          canonicalUrl: '/p/silvercrest-appareil-a-croque-monsieur/p10035199',
          fullTitle: 'SILVERCREST Appareil à croque-monsieur',
          brand: { name: 'SILVERCREST' },
          category: 'Cuisine & Ménage / Cuisine & pâtisserie',
          keyfacts: {
            supplementalDescription: '<p>Appareil de cuisine compact.</p>',
            analyticsCategory: 'Cuisine & Ménage / Cuisine & pâtisserie',
            wonCategoryPrimary: 'Cuisine & pâtisserie',
          },
          image: 'https://www.lidl.fr/assets/example-croque.jpg',
          price: {
            price: 12.99,
            basePrice: {
              text: '1 pcs = 12.99',
              unit: 'pcs',
            },
            discount: {
              deletedPrice: 19.99,
              percentageDiscount: 35,
              showDiscount: true,
            },
            packaging: {
              amount: 1,
              unit: 'pcs',
              text: "L'unité",
            },
          },
          stockAvailability: {
            onlineAvailable: true,
            badgeInfo: {
              badges: [{ text: 'Disponible à la livraison' }],
            },
          },
        },
      },
    },
    {
      gridbox: {
        data: {
          productId: '10071012001',
          canonicalUrl: '/p/pommes-gala/p10071012001',
          fullTitle: 'Pommes Gala',
          brand: { name: 'LIDL' },
          category: 'Alimentation & Boissons / Fruits et légumes',
          keyfacts: {
            supplementalDescription: '<p>Pommes françaises en sachet.</p>',
            analyticsCategory: 'Alimentation & Boissons / Fruits et légumes',
            wonCategoryPrimary: 'Fruits et légumes',
          },
          image_V1: {
            image: 'https://www.lidl.fr/assets/example-pommes.jpg',
          },
          price: {
            price: 2.49,
            packaging: {
              amount: 1,
              unit: 'kg',
              text: '1 kg',
            },
          },
          stockAvailability: {
            onlineAvailable: true,
          },
        },
      },
    },
  ],
}

test('extracts Lidl navigation links and category sources', () => {
  const links = extractLidlNavigationLinks(navigationHtml)

  assert.equal(links.length, 5)
  assert.equal(links[0]?.href, '/h/fruits-et-legumes/h10071012')

  const sources = selectAllLidlCategorySources(links)
  const categories = sources.map((source) => source.category).sort()

  assert.deepEqual(categories, ['alimentation', 'hygiene', 'jouets', 'menage', 'mode'])
})

test('parses Lidl API gridboxes into validated scraper offers', () => {
  const source = {
    category: 'bazar',
    sourceUrl: 'https://www.lidl.fr/h/cuisine-patisserie/h10067523',
    sourceCategoryPath: 'Cuisine & pâtisserie',
  } as const

  const offers = extractLidlOffersFromApiResponse(categoryApiResponse, source, source.sourceUrl)

  assert.equal(offers.length, 2)

  const croqueMonsieur = offers[0]
  assert.ok(croqueMonsieur)
  assert.equal(croqueMonsieur?.retailer, 'lidl')
  assert.equal(croqueMonsieur?.sourceProductId, '10035199')
  assert.equal(croqueMonsieur?.sourceUrl, 'https://www.lidl.fr/p/silvercrest-appareil-a-croque-monsieur/p10035199')
  assert.equal(croqueMonsieur?.image, 'https://www.lidl.fr/assets/example-croque.jpg')
  assert.equal(croqueMonsieur?.price, 12.99)
  assert.equal(croqueMonsieur?.originalPrice, 19.99)
  assert.equal(croqueMonsieur?.isOnPromotion, true)
  assert.equal(croqueMonsieur?.availability, 'Disponible à la livraison')
  assert.equal(croqueMonsieur?.quantity, '1pcs')
  assert.equal(croqueMonsieur?.unitPrice, '12,99€/pcs')
  assert.equal(croqueMonsieur?.category, 'bazar')

  const apples = offers[1]
  assert.ok(apples)
  assert.equal(apples?.category, 'alimentation')
  assert.equal(apples?.image, 'https://www.lidl.fr/assets/example-pommes.jpg')
  assert.equal(apples?.quantity, '1kg')
})
