import type { Retailer } from './catalog'

export const DEAL_SECTION_KEYWORDS = [
  'promo',
  'promotion',
  'promotions',
  'soldes',
  'offre',
  'offres',
  'bon plan',
  'bons plans',
  'catalogue',
  'catalogues',
  'arrivage',
  'arrivages',
  'flash',
  'destockage',
] as const

export const DEAL_ENTRYPOINTS: Record<Retailer, { label: string; url: string; keywords: string[] }> = {
  action: {
    label: 'Les affaires du moment',
    url: 'https://www.action.com/fr-fr/les-affaires-du-moment/',
    keywords: ['affaires du moment', 'promo', 'promotion', 'semaine d action'],
  },
  stokomani: {
    label: 'Offres promotionnelles',
    url: 'https://www.stokomani.fr/pages/conditions-et-offres-promotionnelles',
    keywords: ['offres promotionnelles', 'promo', 'reduction'],
  },
  bm: {
    label: 'Promotions',
    url: 'https://bmstores.fr/promotions',
    keywords: ['promotions', 'promo', 'bon plan'],
  },
  centrakor: {
    label: 'Nos catalogues du moment',
    url: 'https://www.centrakor.com/nos-catalogues-du-moment/',
    keywords: ['catalogue', 'catalogues', 'bon plan', 'promotion'],
  },
  aldi: {
    label: 'Offres et bons plans',
    url: 'https://www.aldi.fr/arrivages-semaine-actuelle.html',
    keywords: ['offres', 'bons plans', 'arrivages', 'promo', 'promotion'],
  },
  gifi: {
    label: 'Nos offres du moment',
    url: 'https://www.gifi.fr/nos-offres-du-moment/pepites-de-la-semaine/',
    keywords: ['offres du moment', 'pepites', 'promo', 'promotion'],
  },
  lafoirfouille: {
    label: 'Nos catalogues',
    url: 'https://www.lafoirfouille.fr/c/nos-catalogues.html',
    keywords: ['catalogue', 'catalogues', 'promo', 'promotion'],
  },
  lidl: {
    label: 'Promotions',
    url: 'https://www.lidl.fr/c/promotions/',
    keywords: ['promotions', 'promo', 'catalogue', 'offre'],
  },
  maxibazar: {
    label: 'Promotions',
    url: 'https://maxibazar.fr/promotions/',
    keywords: ['promotions', 'promo', 'offre'],
  },
  noz: {
    label: 'Nos arrivages',
    url: 'https://www.noz.fr/nos-arrivages/',
    keywords: ['arrivages', 'promo', 'promotion', 'offre'],
  },
}
