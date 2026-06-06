export const LEGAL_INFO = {
  serviceName: 'ComparPrix',
  serviceTagline: 'Le Bulletin des Prix Discount',
  serviceUrl: 'https://comparprix.vercel.app',
  repositoryUrl: 'https://github.com/teefloo/comparateur-prix-discount',
  publisher: {
    name: 'ComparPrix',
    status: 'Particulier — éditeur à titre personnel',
    headquarters: 'France',
    director: 'ComparPrix',
    contactEmail: 'estdel3012@gmail.com',
    privacyEmail: 'estdel3012@gmail.com',
  },
  host: {
    name: 'Vercel Inc.',
    address: '340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis',
    website: 'https://vercel.com',
  },
  jurisdiction: 'France',
  applicableLaws: [
    'Loi n° 2004-575 du 21 juin 2004 pour la confiance dans l’économie numérique (LCEN)',
    'Règlement (UE) 2016/679 du 27 avril 2016 (RGPD)',
    'Loi n° 78-17 du 6 janvier 1978 modifiée (Informatique et Libertés)',
    'Code de la consommation',
  ],
  lastUpdated: '1er juin 2026',
  effectiveDate: '1er juin 2026',
} as const

export const LEGAL_PAGES = [
  {
    slug: 'mentions-legales',
    title: 'Mentions légales',
    short: 'Identité de l’éditeur et de l’hébergeur',
  },
  {
    slug: 'politique-confidentialite',
    title: 'Politique de confidentialité',
    short: 'Données personnelles et RGPD',
  },
  {
    slug: 'cookies',
    title: 'Politique de cookies',
    short: 'Traceurs et consentement',
  },
  {
    slug: 'cgu',
    title: 'Conditions Générales d’Utilisation',
    short: 'Règles d’usage du service',
  },
] as const

export type LegalPageSlug = (typeof LEGAL_PAGES)[number]['slug']

