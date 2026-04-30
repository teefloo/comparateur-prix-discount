import assert from 'node:assert/strict'
import test from 'node:test'

import type { Retailer } from '../../src/lib/catalog'
import { isSupportedCategory } from '../../src/lib/catalog'
import { resolveScrapedOfferCategory, validateOffersForRetailer } from '../../src/lib/scraper-utils'
import type { ScrapedOffer } from '../../src/lib/types'

type OfferFixture = {
  retailer: Retailer
  sourceUrl: string
  sourceCategoryPath?: string
  nativeCategory?: string
  name: string
  description?: string
  availability?: string
}

function buildScrapedOffer(fixture: OfferFixture): ScrapedOffer {
  const categoryResolution = resolveScrapedOfferCategory({
    retailer: fixture.retailer,
    sourceUrl: fixture.sourceUrl,
    sourceCategoryPath: fixture.sourceCategoryPath,
    nativeCategory: fixture.nativeCategory,
    name: fixture.name,
    description: fixture.description,
    availability: fixture.availability,
  })

  return {
    retailer: fixture.retailer,
    sourceUrl: fixture.sourceUrl,
    sourceCategoryPath: fixture.sourceCategoryPath,
    sourceProductId: fixture.sourceUrl.split('/').filter(Boolean).at(-1) || fixture.name,
    category: categoryResolution.category,
    categoryResolution,
    name: fixture.name,
    price: 9.99,
    image: fixture.sourceUrl,
    description: fixture.description,
    availability: fixture.availability,
  }
}

const fixtures: OfferFixture[] = [
  {
    retailer: 'action',
    sourceUrl: 'https://www.action.com/fr-fr/p/3222877/casque-anc-sans-fil/',
    sourceCategoryPath: 'https://www.action.com/fr-fr/c/multimedia/ | audio',
    name: 'Casque ANC sans fil',
    description: 'Casque bluetooth',
  },
  {
    retailer: 'bm',
    sourceUrl: 'https://bmstores.fr/produits/2344-jeu-jouet/voiture-telecommandee',
    sourceCategoryPath: 'https://bmstores.fr/produits/2344-jeu-jouet',
    name: 'Voiture telecommandee enfant',
    description: 'Jouet radiocommande',
  },
  {
    retailer: 'stokomani',
    sourceUrl: 'https://www.stokomani.fr/products/tablette-chocolat-noir',
    sourceCategoryPath: 'epicerie | chocolat',
    nativeCategory: 'epicerie',
    name: 'Tablette chocolat noir',
    description: 'Chocolat noir dessert',
  },
  {
    retailer: 'centrakor',
    sourceUrl: 'https://www.centrakor.com/animalerie/litiere-chat.html',
    sourceCategoryPath: '/animalerie/litiere-chat.html',
    name: 'Litiere chat',
    description: 'Accessoire animalerie',
  },
  {
    retailer: 'aldi',
    sourceUrl: 'https://www.aldi.fr/produits/hygiene-beaute-bebe/dentifrice-fresh.html',
    sourceCategoryPath: 'https://www.aldi.fr/produits/hygiene-beaute-bebe/dentifrice-fresh.html',
    nativeCategory: 'hygiene-beaute-bebe',
    name: 'Dentifrice fresh',
    description: 'Hygiene dentaire',
  },
  {
    retailer: 'action',
    sourceUrl: 'https://www.action.com/fr-fr/p/9999999/support-pliable-universel/',
    name: 'Support pliable universel',
    description: 'Article polyvalent',
  },
  {
    retailer: 'gifi',
    sourceUrl: 'https://www.gifi.fr/maison/rangement-et-entretien/nettoyage-et-entretien/produits-d-entretien/spray-nettoyant-multi-usage-cerise-750-ml/000000000000625527.html',
    sourceCategoryPath: 'https://www.gifi.fr/maison/rangement-et-entretien/nettoyage-et-entretien/produits-d-entretien/',
    name: 'Spray nettoyant multi-usage cerise 750 ml',
    description: "Produits d'entretien",
  },
  {
    retailer: 'lidl',
    sourceUrl: 'https://www.lidl.fr/p/silvercrest-appareil-a-croque-monsieur/p10035199',
    sourceCategoryPath: 'Lidl | Cuisine & Ménage | Cuisine & pâtisserie',
    nativeCategory: 'Cuisine & pâtisserie',
    name: 'SILVERCREST Appareil à croque-monsieur',
    description: 'Appareil de cuisine',
  },
  {
    retailer: 'lidl',
    sourceUrl: 'https://www.lidl.fr/p/esmara-polo-cotele-femme/p100401234',
    sourceCategoryPath: 'Lidl | Mode & Accessoires | Mode pour femme',
    nativeCategory: 'Mode pour femme',
    name: 'esmara Polo côtelé femme',
    description: 'Vêtement pour femme',
  },
  {
    retailer: 'lafoirfouille',
    sourceUrl: 'https://www.lafoirfouille.fr/animalerie/chiens/p/Niche-pour-chien-84-5-x-79-x-80-5-cm-marron-03100601009.html',
    sourceCategoryPath: 'Tous nos produits | Animalerie | Accessoire pour chiens pas cher',
    nativeCategory: 'Animalerie',
    name: 'Niche pour chien 84,5 x 79 x 80,5 cm marron',
    description: 'Accessoire pour chien',
  },
  {
    retailer: 'maxibazar',
    sourceUrl: 'https://maxibazar.fr/chaise-jardin-acacia-40x52x85-5cm',
    sourceCategoryPath: 'Accueil | Amenagement exterieur | Mobilier de jardin | Assises pour exterieur',
    nativeCategory: 'Mobilier de jardin',
    name: 'Chaise jardin acacia 40x52x85.5cm',
    description: 'Chaise de jardin en acacia',
  },
  {
    retailer: 'maxibazar',
    sourceUrl: 'https://maxibazar.fr/plateau-de-service',
    sourceCategoryPath: 'Accueil | Utilitaire de la maison et bazar | Tout pour la cuisine',
    nativeCategory: 'Tout pour la cuisine',
    name: 'Plateau de service',
    description: 'Plateau polyvalent pour la cuisine',
  },
  {
    retailer: 'noz',
    sourceUrl: 'https://www.noz.fr/product/blocs-wc-avec-applicateur-parfume/',
    sourceCategoryPath: 'Hygiene / Beaute / Entretien',
    nativeCategory: 'Hygiene / Beaute / Entretien',
    name: 'BLOCS WC AVEC APPLICATEUR PARFUME',
    description: 'Arrivage Noz: surstocks',
  },
]

test('validated scraper offers always keep a supported category and retain fallbacks', () => {
  for (const retailer of new Set(fixtures.map((fixture) => fixture.retailer))) {
    const rawOffers = fixtures.filter((fixture) => fixture.retailer === retailer).map(buildScrapedOffer)
    const result = validateOffersForRetailer(retailer, rawOffers)

    assert.equal(result.report.validatedCount, rawOffers.length)
    assert.equal(result.report.rejectedCount, 0)
    assert.equal(result.report.categoryResolvedCount, rawOffers.length)

    for (const offer of result.offers) {
      assert.equal(isSupportedCategory(offer.category), true)
      assert.ok(offer.categoryResolution)
    }
  }

  const actionOffers = fixtures.filter((fixture) => fixture.retailer === 'action').map(buildScrapedOffer)
  const actionResult = validateOffersForRetailer('action', actionOffers)

  assert.equal(actionResult.report.categoryFallbackCount, 1)
  assert.equal(actionResult.report.categoryFallbackExamples.length, 1)
  assert.equal(actionResult.report.categoryFallbackExamples[0]?.name, 'Support pliable universel')

  const gifiOffers = fixtures.filter((fixture) => fixture.retailer === 'gifi').map(buildScrapedOffer)
  const gifiResult = validateOffersForRetailer('gifi', gifiOffers)

  assert.equal(gifiResult.report.validatedCount, 1)
  assert.equal(gifiResult.report.rejectedCount, 0)
  assert.equal(gifiResult.offers[0]?.category, 'menage')

  const lafoirfouilleOffers = fixtures.filter((fixture) => fixture.retailer === 'lafoirfouille').map(buildScrapedOffer)
  const lafoirfouilleResult = validateOffersForRetailer('lafoirfouille', lafoirfouilleOffers)

  assert.equal(lafoirfouilleResult.report.validatedCount, 1)
  assert.equal(lafoirfouilleResult.report.rejectedCount, 0)
  assert.equal(lafoirfouilleResult.offers[0]?.category, 'animaux')

  const nozOffers = fixtures.filter((fixture) => fixture.retailer === 'noz').map(buildScrapedOffer)
  const nozResult = validateOffersForRetailer('noz', nozOffers)

  assert.equal(nozResult.report.validatedCount, 1)
  assert.equal(nozResult.report.rejectedCount, 0)
  assert.equal(nozResult.offers[0]?.category, 'menage')
})
