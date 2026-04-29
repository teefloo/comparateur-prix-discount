export const SUPPORTED_CATEGORIES = [
  'hygiene',
  'alimentation',
  'menage',
  'maison-deco',
  'jardin',
  'bricolage',
  'loisirs',
  'animaux',
  'textile',
  'mode',
  'high-tech',
  'bazar',
  'jouets',
] as const

export type SupportedCategory = (typeof SUPPORTED_CATEGORIES)[number]

export const RETAILERS = ['action', 'stokomani', 'bm', 'centrakor', 'aldi', 'gifi', 'lafoirfouille', 'lidl'] as const

export type Retailer = (typeof RETAILERS)[number]

export const SUPPORTED_CATEGORY_SET = new Set<string>(SUPPORTED_CATEGORIES)
export const RETAILER_SET = new Set<string>(RETAILERS)

export const CATEGORY_LABELS: Record<SupportedCategory, string> = {
  hygiene: 'Hygiène',
  alimentation: 'Alimentation',
  menage: 'Ménage',
  'maison-deco': 'Maison & Déco',
  jardin: 'Jardin',
  bricolage: 'Bricolage',
  loisirs: 'Loisirs',
  animaux: 'Animaux',
  textile: 'Textile',
  mode: 'Mode',
  'high-tech': 'High-Tech',
  bazar: 'Bazar',
  jouets: 'Jouets',
}

export const RETAILER_INFO: Record<
  Retailer,
  { name: string; color: string; logo: string; domains: string[] }
> = {
  action: {
    name: 'Action',
    color: '#0066CC',
    logo: '/logos/action.svg',
    domains: ['action.com'],
  },
  stokomani: {
    name: 'Stokomani',
    color: '#E63946',
    logo: '/logos/stokomani.svg',
    domains: ['stokomani.fr'],
  },
  bm: {
    name: 'B&M',
    color: '#2D3436',
    logo: '/logos/bm.svg',
    domains: ['bmstores.fr'],
  },
  centrakor: {
    name: 'Centrakor',
    color: '#00B894',
    logo: '/logos/centrakor.svg',
    domains: ['centrakor.com'],
  },
  aldi: {
    name: 'Aldi',
    color: '#004b90',
    logo: '/logos/aldi.svg',
    domains: ['aldi.fr'],
  },
  gifi: {
    name: 'GiFi',
    color: '#d71920',
    logo: '/logos/gifi.svg',
    domains: ['gifi.fr'],
  },
  lafoirfouille: {
    name: "La Foir'Fouille",
    color: '#E30613',
    logo: '/logos/lafoirfouille.svg',
    domains: ['lafoirfouille.fr'],
  },
  lidl: {
    name: 'Lidl',
    color: '#0050AA',
    logo: '/logos/lidl.svg',
    domains: ['lidl.fr'],
  },
}

export function isSupportedCategory(value: string | null | undefined): value is SupportedCategory {
  return typeof value === 'string' && SUPPORTED_CATEGORY_SET.has(value)
}

export function isRetailer(value: string | null | undefined): value is Retailer {
  return typeof value === 'string' && RETAILER_SET.has(value)
}
