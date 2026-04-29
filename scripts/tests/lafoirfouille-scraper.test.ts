import assert from 'node:assert/strict'
import test from 'node:test'

import {
  extractLafoirfouilleCategoryPage,
  extractLafoirfouilleCategoryPageOffers,
  extractLafoirfouilleProductPageOffer,
  parseLafoirfouillePrice,
} from '../../src/lib/scrapers/lafoirfouille-scraper'

function nextDataHtml(data: unknown) {
  return `<html><body><script id="__NEXT_DATA__" type="application/json">${JSON.stringify(data)}</script></body></html>`
}

const categoryPageHtml = nextDataHtml({
  props: {
    pageProps: {
      appData: {
        breadcrumbs: [
          { url: '/c/1.html', name: 'Tous nos produits', categoryCode: '1' },
          { url: '/c/animalerie.html', name: 'Animalerie', categoryCode: 'animalerie' },
        ],
        categoryInfos: {
          categoryName: 'Animalerie',
          path: '/FR/c/animalerie.html',
          searchPageData: {
            pagination: {
              pageSize: 42,
              currentPage: 0,
              numberOfPages: 104,
              totalNumberOfResults: 4350,
            },
            results: [
              {
                code: '03100601009',
                name: 'Niche pour chien - 84,5 x 79 x 80,5 cm - Marron',
                url: '/animalerie/chiens/p/Niche-pour-chien-84-5-x-79-x-80-5-cm-marron-03100601009.html',
                price: {
                  currencyIso: 'EUR',
                  value: 69.99,
                  formattedValue: '69,99 EUR',
                },
                images: [
                  {
                    imageType: 'PRIMARY',
                    format: 'product',
                    url: '/medias/03100601009-300Wx300H?context=test',
                  },
                ],
                hasStoreStock: true,
                breadcrumbs: [
                  { name: 'Tous nos produits', categoryCode: '1', url: '/c/1.html' },
                  { name: 'Animalerie', categoryCode: 'animalerie', url: '/c/animalerie.html' },
                  { name: 'Accessoire pour chiens pas cher', categoryCode: 'chiens', url: '/animalerie/c/chiens.html' },
                  {
                    name: 'Paniers pour chiens et corbeilles',
                    categoryCode: 'corbeilles-paniers-chiens',
                    url: '/animalerie/chiens/c/corbeilles-paniers-chiens.html',
                  },
                  {
                    name: 'Niche pour chien - 84,5 x 79 x 80,5 cm - Marron',
                    url: '/animalerie/chiens/p/Niche-pour-chien-84-5-x-79-x-80-5-cm-marron-03100601009.html',
                  },
                ],
              },
            ],
          },
        },
      },
    },
  },
})

const productPageHtml = nextDataHtml({
  props: {
    pageProps: {
      appData: {
        productInfos: {
          productWebCategoryCode: 'hifi-et-video',
          productWebCategoryName: 'Hifi, video et photo',
          categoryUrl: '/loisir-et-jeux/high-tech/c/hifi-et-video.html',
          breadcrumbs: [
            { url: '/c/1.html', name: 'Tous nos produits' },
            { url: '/c/loisir-et-jeux.html', name: 'Loisirs et jeux' },
            { url: '/loisir-et-jeux/c/high-tech.html', name: 'High Tech' },
            { url: '/loisir-et-jeux/high-tech/c/hifi-et-video.html', name: 'Hifi, video et photo' },
          ],
          product: {
            code: '02050405128',
            name: 'Support universel pour GPS ou portable - Plastique - 8 x 5 x H 10 cm - Noir',
            url: '/loisir-et-jeux/high-tech/p/Support-universel-pour-gps-ou-portable-plastique-8-x-5-x-h-10-cm-noir-02050405128.html',
            summary: 'SUPPORT UNIVERSEL GPS MOBILE',
            price: {
              currencyIso: 'EUR',
              value: 8.99,
              formattedValue: '8,99 EUR',
            },
            medias: ['https://prod-api.lafoirfouille.fr/medias/02050405128-300Wx300H?context=test'],
            marketingAccroche: 'Support universel pour smartphone avec fixation par ventouse.',
            acceptClickAndCollectExpressSelling: true,
            primaryCategoryCode: 'hifi-et-video',
          },
        },
      },
    },
  },
})

test("parses La Foir'Fouille category pages from Next data", () => {
  const extraction = extractLafoirfouilleCategoryPage(categoryPageHtml, 'https://www.lafoirfouille.fr/c/animalerie.html')

  assert.equal(extraction.pageCount, 104)
  assert.equal(extraction.totalResults, 4350)
  assert.equal(extraction.offers.length, 1)
  assert.equal(extraction.offers[0]?.retailer, 'lafoirfouille')
  assert.equal(extraction.offers[0]?.sourceProductId, '03100601009')
  assert.equal(
    extraction.offers[0]?.sourceUrl,
    'https://www.lafoirfouille.fr/animalerie/chiens/p/Niche-pour-chien-84-5-x-79-x-80-5-cm-marron-03100601009.html',
  )
  assert.equal(extraction.offers[0]?.image, 'https://prod-api.lafoirfouille.fr/medias/03100601009-300Wx300H?context=test')
  assert.equal(extraction.offers[0]?.price, 69.99)
  assert.equal(extraction.offers[0]?.category, 'animaux')
})

test("extracts La Foir'Fouille category offers convenience helper", () => {
  const offers = extractLafoirfouilleCategoryPageOffers(categoryPageHtml, 'https://www.lafoirfouille.fr/c/animalerie.html')
  assert.equal(offers.length, 1)
  assert.equal(offers[0]?.availability, 'Disponible en magasin')
})

test("parses La Foir'Fouille product pages from Next data", () => {
  const offer = extractLafoirfouilleProductPageOffer(
    productPageHtml,
    'https://www.lafoirfouille.fr/loisir-et-jeux/high-tech/p/Support-universel-pour-gps-ou-portable-plastique-8-x-5-x-h-10-cm-noir-02050405128.html',
  )

  assert.ok(offer)
  assert.equal(offer?.retailer, 'lafoirfouille')
  assert.equal(offer?.sourceProductId, '02050405128')
  assert.equal(offer?.price, 8.99)
  assert.equal(offer?.category, 'high-tech')
  assert.equal(
    offer?.image,
    'https://prod-api.lafoirfouille.fr/medias/02050405128-300Wx300H?context=test',
  )
})

test("parses La Foir'Fouille price values", () => {
  assert.equal(parseLafoirfouillePrice({ value: 4.99, formattedValue: '4,99 EUR' }), 4.99)
  assert.equal(parseLafoirfouillePrice({ formattedValue: '8,99 EUR' }), 8.99)
  assert.equal(parseLafoirfouillePrice('12,49 EUR'), 12.49)
})
