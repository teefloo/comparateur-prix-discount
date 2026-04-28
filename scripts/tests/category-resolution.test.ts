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
