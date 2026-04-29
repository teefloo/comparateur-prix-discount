import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveScrapedOfferCategory } from '../../src/lib/scraper-utils'

test('maps native retailer paths before text heuristics', () => {
  const actionHighTech = resolveScrapedOfferCategory({
    retailer: 'action',
    sourceUrl: 'https://www.action.com/fr-fr/c/multimedia/',
    sourceCategoryPath: 'https://www.action.com/fr-fr/c/multimedia/ | Casque ANC sans fil',
    name: 'Casque ANC sans fil Philips',
    description: 'Audio bluetooth',
  })

  assert.equal(actionHighTech.category, 'high-tech')
  assert.equal(actionHighTech.source, 'native_mapping')
  assert.equal(actionHighTech.confidence, 'high')

  const aldiHygiene = resolveScrapedOfferCategory({
    retailer: 'aldi',
    sourceUrl: 'https://www.aldi.fr/produits/hygiene-beaute-bebe/dentaire.html',
    sourceCategoryPath: 'https://www.aldi.fr/produits/hygiene-beaute-bebe/dentaire.html',
    nativeCategory: 'hygiene-beaute-bebe',
    name: 'Dentifrice blancheur',
    description: 'Soin dentaire',
  })

  assert.equal(aldiHygiene.category, 'hygiene')
  assert.equal(aldiHygiene.source, 'native_mapping')
})

test('uses weighted signals for ambiguous keywords', () => {
  const petFish = resolveScrapedOfferCategory({
    retailer: 'centrakor',
    sourceUrl: 'https://www.centrakor.com/animalerie/friandise-chat-poisson.html',
    sourceCategoryPath: '/animalerie/friandise-chat-poisson.html',
    name: 'Friandises chat au poisson',
    description: 'Crocquettes et patee pour chat',
  })

  assert.equal(petFish.category, 'animaux')

  const foodFish = resolveScrapedOfferCategory({
    retailer: 'aldi',
    sourceUrl: 'https://www.aldi.fr/produits/viande-poisson/filet-colin.html',
    sourceCategoryPath: '/produits/viande-poisson/filet-colin.html',
    nativeCategory: 'viande-poisson',
    name: 'Filet de poisson pane',
    description: 'Produit surgele',
  })

  assert.equal(foodFish.category, 'alimentation')

  const toothbrush = resolveScrapedOfferCategory({
    retailer: 'bm',
    sourceUrl: 'https://bmstores.fr/produits/hygiene-soin/brosse-a-dents-souple',
    sourceCategoryPath: '/produits/2628-hygiene-soin',
    name: 'Brosse a dents souple',
    description: 'Hygiene dentaire',
  })

  assert.equal(toothbrush.category, 'hygiene')

  const gifiCleaner = resolveScrapedOfferCategory({
    retailer: 'gifi',
    sourceUrl: 'https://www.gifi.fr/maison/rangement-et-entretien/nettoyage-et-entretien/produits-d-entretien/spray-nettoyant-multi-usage-cerise-750-ml/000000000000625527.html',
    sourceCategoryPath: 'https://www.gifi.fr/maison/rangement-et-entretien/nettoyage-et-entretien/produits-d-entretien/',
    nativeCategory: 'Rangement et entretien',
    name: 'Spray nettoyant multi-usage cerise 750 ml',
    description: "Produits d'entretien",
  })

  assert.equal(gifiCleaner.category, 'menage')
})

test("maps La Foir'Fouille native paths across key categories", () => {
  const cases = [
    {
      sourceUrl: 'https://www.lafoirfouille.fr/c/animalerie.html',
      sourceCategoryPath: 'Tous nos produits | Animalerie | Chiens',
      name: 'Niche pour chien',
      expected: 'animaux',
    },
    {
      sourceUrl: 'https://www.lafoirfouille.fr/loisir-et-jeux/high-tech/c/hifi-et-video.html',
      sourceCategoryPath: 'Tous nos produits | Loisirs et jeux | High Tech | Hifi video et photo',
      name: 'Support universel pour GPS ou portable',
      expected: 'high-tech',
    },
    {
      sourceUrl: 'https://www.lafoirfouille.fr/c/rangement.html',
      sourceCategoryPath: 'Tous nos produits | Rangement et entretien | Buanderie',
      name: 'Panier a linge',
      expected: 'menage',
    },
    {
      sourceUrl: 'https://www.lafoirfouille.fr/c/decoration.html',
      sourceCategoryPath: 'Tous nos produits | Decoration | Objets decoration',
      name: 'Vase decoratif',
      expected: 'maison-deco',
    },
    {
      sourceUrl: 'https://www.lafoirfouille.fr/c/cuisine.html',
      sourceCategoryPath: 'Tous nos produits | Cuisine | Art de la table | Vaisselle',
      name: 'Assiette plate',
      expected: 'bazar',
    },
    {
      sourceUrl: 'https://www.lafoirfouille.fr/c/plein-air.html',
      sourceCategoryPath: 'Tous nos produits | Jardin et plein air | Amenagement du jardin',
      name: 'Arrosoir de jardin',
      expected: 'jardin',
    },
  ] as const

  for (const fixture of cases) {
    const resolution = resolveScrapedOfferCategory({
      retailer: 'lafoirfouille',
      sourceUrl: fixture.sourceUrl,
      sourceCategoryPath: fixture.sourceCategoryPath,
      nativeCategory: fixture.sourceCategoryPath,
      name: fixture.name,
    })

    assert.equal(resolution.category, fixture.expected)
  }
})

test('maps Lidl native paths across key categories', () => {
  const cases = [
    {
      sourceUrl: 'https://www.lidl.fr/h/fruits-et-legumes/h10071012',
      sourceCategoryPath: 'Fruits et légumes',
      name: 'Pommes Gala',
      expected: 'alimentation',
    },
    {
      sourceUrl: 'https://www.lidl.fr/h/hygiene-et-beaute/h10071019',
      sourceCategoryPath: 'Hygiène et beauté',
      name: 'Dentifrice fraîcheur',
      expected: 'hygiene',
    },
    {
      sourceUrl: 'https://www.lidl.fr/h/nettoyage-de-la-maison/h10067527',
      sourceCategoryPath: 'Nettoyage de la maison',
      name: 'Spray nettoyant multi-usage',
      expected: 'menage',
    },
    {
      sourceUrl: 'https://www.lidl.fr/h/mode-femme/h10067567',
      sourceCategoryPath: 'Mode pour femme',
      name: 'Polo côtelé femme',
      expected: 'mode',
    },
    {
      sourceUrl: 'https://www.lidl.fr/h/jouets/h10067573',
      sourceCategoryPath: 'Jouets',
      name: 'Jeu de société',
      expected: 'jouets',
    },
  ] as const

  for (const fixture of cases) {
    const resolution = resolveScrapedOfferCategory({
      retailer: 'lidl',
      sourceUrl: fixture.sourceUrl,
      sourceCategoryPath: fixture.sourceCategoryPath,
      nativeCategory: fixture.sourceCategoryPath,
      name: fixture.name,
    })

    assert.equal(resolution.category, fixture.expected)
  }
})

test('falls back to bazar when no reliable signal exists', () => {
  const fallback = resolveScrapedOfferCategory({
    retailer: 'action',
    sourceUrl: 'https://www.action.com/fr-fr/p/9999999/support-pliable-universel/',
    name: 'Support pliable universel',
    description: 'Article polyvalent',
  })

  assert.equal(fallback.category, 'bazar')
  assert.equal(fallback.source, 'fallback')
  assert.equal(fallback.confidence, 'fallback')
  assert.equal(fallback.fallbackUsed, true)
})
