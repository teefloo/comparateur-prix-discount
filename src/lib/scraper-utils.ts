import { createHash } from 'node:crypto'

import {
  CATEGORY_LABELS,
  RETAILER_INFO,
  SUPPORTED_CATEGORIES,
  isSupportedCategory,
  type Retailer,
  type SupportedCategory,
} from './catalog'
import type {
  OfferValidationReport,
  RetailerOfferCard,
  ScrapePipelineResult,
  ScrapedOffer,
  ValidatedOffer,
} from './types'

export * from './types'

const CATEGORY_KEYWORDS: Record<SupportedCategory, string[]> = {
  hygiene: [
    'desodorisant',
    'deodorant',
    'parfum',
    'eau de toilette',
    'eau de parfum',
    'shampoing',
    'shampooing',
    'gel douche',
    'savon',
    'dentifrice',
    'brosse a dents',
    'maquillage',
    'lingette',
    'mouchoir',
    'coton tige',
    'serviette hygienique',
    'tampon',
    'protege slip',
    'beaute',
    'hygiene',
  ],
  alimentation: [
    'boisson',
    'soda',
    'eau minerale',
    'jus',
    'sirop',
    'cafe',
    'the',
    'biere',
    'vin',
    'biscuit',
    'gateau',
    'chocolat',
    'bonbon',
    'confiserie',
    'chips',
    'snack',
    'pates',
    'riz',
    'cereale',
    'farine',
    'huile',
    'vinaigre',
    'sauce',
    'epice',
    'lait',
    'yaourt',
    'fromage',
    'viande',
    'poisson',
    'legume',
    'fruit',
    'conserve',
    'aperitif',
    'cola',
    'coca',
    'fanta',
    'pepsi',
    'gouter',
    'alimentation',
  ],
  menage: [
    'lessive',
    'detergent',
    'assouplissant',
    'lave vaisselle',
    'adoucissant',
    'nettoyant',
    'vitre',
    'sol',
    'eponge',
    'balai',
    'serpillere',
    'brosse',
    'papier toilette',
    'essuie tout',
    'sac poubelle',
    'javel',
    'anti calcaire',
    'deboucheur',
    'entretien',
    'rangement',
    'menage',
  ],
  'maison-deco': [
    'decoration',
    'deco',
    'cadre',
    'vase',
    'bougie',
    'rideau',
    'voilage',
    'coussin',
    'plaid',
    'lampe',
    'miroir',
    'tapis',
    'panier',
    'vannerie',
    'statuette',
    'figurine',
    'horloge',
  ],
  jardin: [
    'jardin',
    'plage',
    'piscine',
    'balcon',
    'terrasse',
    'pot de fleurs',
    'pot de fleur',
    'semence',
    'graines',
    'plante',
    'fleurs',
    'rateau',
    'pelle',
    'beche',
    'arrosoir',
    'tuyau',
    'salon de jardin',
    'chaise longue',
    'parasol',
  ],
  bricolage: [
    'bricolage',
    'outillage',
    'tournevis',
    'cle',
    'marteau',
    'perceuse',
    'vis',
    'clou',
    'boulon',
    'ecrou',
    'adhesif',
    'colle',
    'peinture',
    'cheville',
    'ruban',
    'diy',
    'brico',
  ],
  loisirs: [
    'loisir',
    'loisirs',
    'jeu',
    'jeux',
    'puzzle',
    'cartes',
    'jouet',
    'jouets',
    'sport',
    'fitness',
    'yoga',
    'velo',
    'bicycle',
    'playmobil',
    'lego',
    'papeterie',
  ],
  animaux: [
    'animal',
    'animaux',
    'chat',
    'chien',
    'poisson',
    'oiseau',
    'rongeur',
    'niche',
    'litiere',
    'gamelle',
    'crocquettes',
    'patee',
    'collier',
    'laisse',
    'harnais',
    'aquarium',
    'animalerie',
  ],
  textile: [
    'textile',
    'vetement',
    'chaussette',
    'sous vetement',
    'culotte',
    't shirt',
    'pull',
    'gilet',
    'pantalon',
    'jupe',
    'robe',
    'manteau',
    'veste',
    'casquette',
    'bonnet',
    'echarpe',
    'gant',
    'lingerie',
    'pyjama',
    'chaussons',
    'linge de maison',
    'drap',
    'couette',
    'oreiller',
  ],
  mode: [
    'mode',
    'hauts',
    'bas',
    'chaussure',
    'sac',
    'bagagerie',
    'valise',
    'trousse',
    'ceinture',
    'montre',
    'bijoux',
    'bijouterie',
    ' bracelet',
    'collier',
    'boucle oreille',
    'anneau',
    'lili marelle',
    'sergio tacchini',
    'manoukian',
    'lee cooper',
    'la city',
    'la fabrique des garçons',
    'essentiel',
    'enfant mode',
    'mode femme',
    'mode homme',
    'mode enfant',
  ],
  'high-tech': [
    'high tech',
    'high-tech',
    'telephone',
    'smartphone',
    'tablette',
    'ordinateur',
    'portable',
    'chargeur',
    'casque',
    'audio',
    'haut parleur',
    'speaker',
    'bluetooth',
    'usb',
    'cable',
    'prise',
    'adaptateur',
    'multimedia',
    'multimédia',
    'electronique',
    'radio',
    'reveil',
  ],
bazar: [
    'bazar',
    'ustensile',
    'cuisine',
    'cuisson',
    'vaisselle',
    'casserolle',
    'poele',
    'casserole',
    'marmite',
    'faitout',
    'wok',
    'plat',
    'bol',
    'tasse',
    'verre',
    'tasse',
    'couvert',
    'couteau',
    'fourchette',
    'spoon',
    'etable',
    'planche',
    'moule',
    'baking',
    'pichet',
    'carafe',
    'bouteille',
    'conserving',
    'tupperware',
    'container',
    'range',
    'organizer',
    'poubelle',
    'seau',
    'bassine',
    'cuvette',
    'panier',
    'corbeille',
    'mobilier',
    'table',
    'chaise',
    'tabouret',
    'etagere',
    'rangement',
    'tiroir',
    'commode',
    'armoire',
    'paque',
    'pique nique',
    'camping',
    'barbecue',
    'plancha',
    'noel',
    'fetes',
    'ceremonie',
    'fête',
    'tous nos produits',
    'produit',
    '_ACCESSOIRE',
    '_ACCESSOIRES',
  ],
  jouets: [
    'jouet',
    'jouets',
    'playmobil',
    'lego',
    'poupee',
    'peluche',
    'voiture',
    'camion',
    'train',
    'avion',
    'helicoptere',
    'bateau',
    'figurine',
    'super heros',
    'barbie',
    'nerf',
    'ballon',
    'raquette',
    'balle',
    'but',
    'panier basket',
    'skate',
    'trottinette',
    'skateboard',
    'velo enfant',
    'puériculture',
    'bebe',
    'baby',
    'nounours',
    'doudou',
'puericulture',
  ],
}

const SHORT_KEYWORDS = new Set([
  'jeu',
  'riz',
  'the',
  'vin',
  'jus',
  'diy',
])

function hashToId(value: string): string {
  const hash = createHash('sha256').update(value).digest('hex')
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    `4${hash.slice(13, 16)}`,
    `${((Number.parseInt(hash.slice(16, 17), 16) & 0x3) | 0x8).toString(16)}${hash.slice(17, 20)}`,
    hash.slice(20, 32),
  ].join('-')
}

function incrementReason(map: Record<string, number>, reason: string) {
  map[reason] = (map[reason] || 0) + 1
}

function buildEmptyCategoryCounts(): Record<SupportedCategory, number> {
  return SUPPORTED_CATEGORIES.reduce(
    (acc, category) => {
      acc[category] = 0
      return acc
    },
    {} as Record<SupportedCategory, number>,
  )
}

function containsKeyword(text: string, keyword: string): boolean {
  if (!text || !keyword) return false

  if (keyword.includes(' ') || keyword.includes('-')) {
    return text.includes(keyword)
  }

  if (keyword.length <= 4 || SHORT_KEYWORDS.has(keyword)) {
    const regex = new RegExp(`(^|\\s)${keyword}s?($|\\s)`, 'i')
    return regex.test(text)
  }

  return text.includes(keyword)
}

function cleanNullableText(value: string | null | undefined): string | undefined {
  if (typeof value !== 'string') return undefined

  const cleaned = value
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return cleaned || undefined
}

function normalizeQuantityUnit(value: number, unit: string): { baseValue: number; label: string } | null {
  if (!Number.isFinite(value) || value <= 0) return null

  const normalizedUnit = normalizeSearchQuery(unit)

  if (normalizedUnit === 'ml') return { baseValue: value / 1000, label: '/l' }
  if (normalizedUnit === 'cl') return { baseValue: value / 100, label: '/l' }
  if (normalizedUnit === 'l' || normalizedUnit === 'litre' || normalizedUnit === 'litres') {
    return { baseValue: value, label: '/l' }
  }
  if (normalizedUnit === 'g') return { baseValue: value / 1000, label: '/kg' }
  if (normalizedUnit === 'kg' || normalizedUnit === 'kilogramme' || normalizedUnit === 'kilogrammes') {
    return { baseValue: value, label: '/kg' }
  }
  if (
    normalizedUnit === 'pc' ||
    normalizedUnit === 'pcs' ||
    normalizedUnit === 'piece' ||
    normalizedUnit === 'pieces' ||
    normalizedUnit === 'unite' ||
    normalizedUnit === 'unites'
  ) {
    return { baseValue: value, label: '/pcs' }
  }

  return null
}

function parseQuantityToBaseUnit(quantity: string | null | undefined) {
  const normalized = cleanNullableText(quantity)?.replace(/,/g, '.').toLowerCase() || ''
  if (!normalized) return null

  const packMatch = normalized.match(/\b(\d+)\s*[x*]\s*(\d+(?:\.\d+)?)\s*(kg|g|l|ml|cl)\b/)
  if (packMatch) {
    const count = Number.parseFloat(packMatch[1])
    const value = Number.parseFloat(packMatch[2])
    const parsed = normalizeQuantityUnit(count * value, packMatch[3])
    if (parsed) {
      return parsed
    }
  }

  const standardMatch = normalized.match(
    /\b(\d+(?:\.\d+)?)\s*(kg|g|l|ml|cl|pc|pcs|piece|pieces|unite|unites)\b/,
  )
  if (standardMatch) {
    return normalizeQuantityUnit(Number.parseFloat(standardMatch[1]), standardMatch[2])
  }

  const lotMatch =
    normalized.match(/\b(?:lot de|x)\s*(\d+)\b/) || normalized.match(/\b(\d+)\s*(?:pcs?|pieces?|pc)\b/)
  if (lotMatch) {
    return normalizeQuantityUnit(Number.parseFloat(lotMatch[1]), 'pcs')
  }

  return null
}

export function cleanDisplayText(value: string | null | undefined): string {
  return cleanNullableText(value) || ''
}

export function normalizeSearchQuery(query: string): string {
  return String(query || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s/-]/g, ' ')
    .replace(/[/-]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

export function toValidPrice(value: unknown): number | null {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return null
    return Math.round(value * 100) / 100
  }

  if (typeof value !== 'string') return null

  const normalized = value
    .replace(/\u00a0/g, ' ')
    .replace(/[^\d,.-]/g, '')
    .replace(',', '.')
    .trim()

  if (!normalized) return null

  const parsed = Number.parseFloat(normalized)
  if (!Number.isFinite(parsed) || parsed <= 0) return null

  return Math.round(parsed * 100) / 100
}

export function extractPrice(priceStr: string): number | null {
  const match = cleanDisplayText(priceStr).replace(',', '.').match(/(\d+[.,]?\d{0,2})/)
  return match ? toValidPrice(match[1]) : null
}

export function inferCategoryFromText(...values: Array<string | null | undefined>): SupportedCategory | null {
  const normalizedText = normalizeSearchQuery(values.filter(Boolean).join(' '))
  if (!normalizedText) return null

  for (const category of SUPPORTED_CATEGORIES) {
    const keywords = CATEGORY_KEYWORDS[category]
    if (keywords.some((keyword) => containsKeyword(normalizedText, keyword))) {
      return category
    }
  }

  return null
}

export function resolveOfferCategory(options: {
  explicitCategory?: string | null
  sourceCategoryPath?: string | null
  textValues?: Array<string | null | undefined>
}): SupportedCategory | null {
  if (isSupportedCategory(options.explicitCategory)) {
    return options.explicitCategory
  }

  const fromSourcePath = inferCategoryFromText(options.sourceCategoryPath)
  if (fromSourcePath) {
    return fromSourcePath
  }

  return inferCategoryFromText(...(options.textValues || []))
}

export function extractQuantity(value: string): string | null {
  const normalized = cleanDisplayText(value)
  if (!normalized) return null

  const packMatch = normalized.match(/\b(\d+)\s*[xX*]\s*(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|cl)\b/i)
  if (packMatch) {
    const quantity = `${packMatch[1]}x${packMatch[2].replace(',', '.')}${packMatch[3].toLowerCase()}`
    return quantity
  }

  const singleMatch = normalized.match(
    /\b(\d+(?:[.,]\d+)?)\s*(kg|g|l|ml|cl|pc|pcs|piece|pieces|unite|unites)\b/i,
  )
  if (singleMatch) {
    return `${singleMatch[1].replace(',', '.')}${singleMatch[2].toLowerCase()}`
  }

  const lotMatch =
    normalized.match(/\b(?:lot de|x)\s*(\d+)\b/i) || normalized.match(/\b(\d+)\s*(?:pcs?|pieces?|pc)\b/i)
  if (lotMatch) {
    return `${lotMatch[1]}pcs`
  }

  return null
}

export function calculatePricePerUnit(price: number, quantity: string | null | undefined) {
  const parsedPrice = toValidPrice(price)
  if (parsedPrice === null) {
    return { value: null, label: '' }
  }

  const parsedQuantity = parseQuantityToBaseUnit(quantity)
  if (!parsedQuantity || parsedQuantity.baseValue <= 0) {
    return { value: null, label: '' }
  }

  const value = Math.round((parsedPrice / parsedQuantity.baseValue) * 100) / 100
  return {
    value,
    label: parsedQuantity.label,
  }
}

export function formatUnitPriceText(value: number, label: string): string {
  return `${value.toFixed(2).replace('.', ',')}€${label}`
}

export function parseUnitPriceText(value: string | null | undefined) {
  const normalized = cleanDisplayText(value)
  if (!normalized) {
    return { value: null, label: '' }
  }

  const match = normalized.match(/(\d+[.,]?\d*)\s*€?\s*\/\s*([a-zA-Z]+)/)
  if (!match) {
    return { value: null, label: '' }
  }

  const parsedValue = toValidPrice(match[1])
  if (parsedValue === null) {
    return { value: null, label: '' }
  }

  const unit = normalizeSearchQuery(match[2])
  const label = unit === 'piece' || unit === 'pieces' || unit === 'pc' || unit === 'pcs' ? '/pcs' : `/${unit}`
  return {
    value: parsedValue,
    label,
  }
}

export function ensureUnitPriceText(
  unitPrice: string | null | undefined,
  price: number,
  quantity: string | null | undefined,
): string | undefined {
  const parsed = parseUnitPriceText(unitPrice)
  if (parsed.value !== null) {
    return formatUnitPriceText(parsed.value, parsed.label)
  }

  const calculated = calculatePricePerUnit(price, quantity)
  if (calculated.value === null) {
    return undefined
  }

  return formatUnitPriceText(calculated.value, calculated.label)
}

export function toAbsoluteUrl(value: string | null | undefined, baseUrl?: string): string {
  const raw = cleanDisplayText(value)
  if (!raw) return ''

  try {
    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return new URL(raw).toString()
    }

    if (baseUrl) {
      return new URL(raw, baseUrl).toString()
    }
  } catch (_error) {
    return ''
  }

  return ''
}

export function isAbsoluteHttpUrl(value: string | null | undefined): boolean {
  const url = cleanDisplayText(value)
  return /^https?:\/\//i.test(url)
}

export function matchesRetailerDomain(retailer: Retailer, value: string | null | undefined): boolean {
  if (!isAbsoluteHttpUrl(value)) return false

  try {
    const hostname = new URL(String(value)).hostname.toLowerCase()
    return RETAILER_INFO[retailer].domains.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    )
  } catch (_error) {
    return false
  }
}

export function deriveSourceProductIdFromUrl(value: string): string {
  try {
    const url = new URL(value)
    const pathname = url.pathname.replace(/\/+$/, '')
    if (!pathname) return ''

    const actionMatch = pathname.match(/\/p\/(\d+)/)
    if (actionMatch) return actionMatch[1]

    const segments = pathname.split('/').filter(Boolean)
    return segments.join(':')
  } catch (_error) {
    return ''
  }
}

export function buildStableSourceProductId(
  retailer: Retailer,
  sourceProductId: string | null | undefined,
  sourceUrl: string,
): string {
  const cleanedSourceId = cleanDisplayText(sourceProductId)
  if (cleanedSourceId) {
    return cleanedSourceId
  }

  const derived = deriveSourceProductIdFromUrl(sourceUrl)
  if (derived) {
    return `${retailer}:${derived}`
  }

  return createHash('sha256').update(sourceUrl).digest('hex').slice(0, 24)
}

export function buildOfferId(retailer: Retailer, sourceProductId: string, sourceUrl: string): string {
  return hashToId(`${retailer}:${sourceProductId}:${sourceUrl}`)
}

export function filterOffersByQuery<T extends { name: string; brand?: string; description?: string; category?: string }>(
  offers: T[],
  query: string,
): T[] {
  const normalizedQuery = normalizeSearchQuery(query)
  if (!normalizedQuery) return offers

  return offers.filter((offer) => {
    const haystack = normalizeSearchQuery(
      [offer.name, offer.brand, offer.description, offer.category].filter(Boolean).join(' '),
    )
    return haystack.includes(normalizedQuery)
  })
}

export function toRetailerOfferCard(input: {
  id: string
  retailer: Retailer
  name: string
  category: SupportedCategory
  brand?: string | null
  price: number
  image?: string | null
  description?: string | null
  availability?: string | null
  quantity?: string | null
  unitPrice?: string | null
  originalPrice?: number | null
  isOnPromotion?: boolean | null
  discount?: number | null
  lastUpdated?: string | null
  sourceUrl?: string | null
  url?: string | null
}): RetailerOfferCard {
  const parsedUnitPrice = parseUnitPriceText(input.unitPrice)

  return {
    id: input.id,
    productId: input.id,
    retailer: input.retailer,
    name: cleanDisplayText(input.name),
    category: input.category,
    brand: cleanNullableText(input.brand),
    price: toValidPrice(input.price) || 0,
    url: toAbsoluteUrl(input.url || input.sourceUrl) || '',
    image: toAbsoluteUrl(input.image, input.url || input.sourceUrl || undefined),
    description: cleanNullableText(input.description),
    availability: cleanNullableText(input.availability),
    quantity: cleanNullableText(input.quantity),
    unitPrice: parsedUnitPrice.value === null ? undefined : parsedUnitPrice.value,
    unitPriceLabel: parsedUnitPrice.value === null ? undefined : parsedUnitPrice.label,
    originalPrice: toValidPrice(input.originalPrice) ?? undefined,
    isOnPromotion: input.isOnPromotion ? true : undefined,
    discount:
      typeof input.discount === 'number' && Number.isFinite(input.discount) ? Math.round(input.discount) : undefined,
    lastUpdated: input.lastUpdated || null,
  }
}

export function sortRetailerOfferCards(offers: RetailerOfferCard[]): RetailerOfferCard[] {
  return [...offers].sort((left, right) => {
    const leftComparable = left.unitPrice ?? left.price
    const rightComparable = right.unitPrice ?? right.price

    if (leftComparable !== rightComparable) {
      return leftComparable - rightComparable
    }

    return left.price - right.price
  })
}

export function validateOffersForRetailer(retailer: Retailer, rawOffers: ScrapedOffer[]): ScrapePipelineResult {
  const rejectionReasons: Record<string, number> = {}
  const categoryCounts = buildEmptyCategoryCounts()
  const validatedOffers: ValidatedOffer[] = []
  const seenIds = new Set<string>()

  for (const rawOffer of rawOffers) {
    const name = cleanDisplayText(rawOffer.name)
    if (!name) {
      incrementReason(rejectionReasons, 'missing_name')
      continue
    }

    const sourceUrl = toAbsoluteUrl(rawOffer.sourceUrl)
    if (!sourceUrl) {
      incrementReason(rejectionReasons, 'invalid_source_url')
      continue
    }

    if (!matchesRetailerDomain(retailer, sourceUrl)) {
      incrementReason(rejectionReasons, 'wrong_domain')
      continue
    }

    const price = toValidPrice(rawOffer.price)
    if (price === null) {
      incrementReason(rejectionReasons, 'invalid_price')
      continue
    }

    const category = resolveOfferCategory({
      explicitCategory: rawOffer.category,
      sourceCategoryPath: rawOffer.sourceCategoryPath,
      textValues: [name, rawOffer.brand, rawOffer.description, rawOffer.availability],
    })
    if (!category) {
      incrementReason(rejectionReasons, 'unsupported_category')
      continue
    }

    const sourceProductId = buildStableSourceProductId(retailer, rawOffer.sourceProductId, sourceUrl)
    if (!sourceProductId) {
      incrementReason(rejectionReasons, 'missing_source_identity')
      continue
    }

    const id = buildOfferId(retailer, sourceProductId, sourceUrl)
    if (seenIds.has(id)) {
      incrementReason(rejectionReasons, 'duplicate_offer')
      continue
    }

    seenIds.add(id)

    const quantity =
      cleanNullableText(rawOffer.quantity) ||
      cleanNullableText(extractQuantity(name)) ||
      cleanNullableText(extractQuantity(rawOffer.description || ''))

    const unitPrice = ensureUnitPriceText(rawOffer.unitPrice, price, quantity)
    const originalPrice = toValidPrice(rawOffer.originalPrice)
    const computedDiscount =
      originalPrice !== null && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : undefined

    const validatedOffer: ValidatedOffer = {
      id,
      retailer,
      sourceProductId,
      sourceUrl,
      sourceCategoryPath: cleanNullableText(rawOffer.sourceCategoryPath),
      category,
      name,
      brand: cleanNullableText(rawOffer.brand),
      price,
      image: toAbsoluteUrl(rawOffer.image, sourceUrl),
      description: cleanNullableText(rawOffer.description),
      availability: cleanNullableText(rawOffer.availability),
      quantity,
      unitPrice,
      originalPrice: originalPrice ?? undefined,
      isOnPromotion: rawOffer.isOnPromotion || computedDiscount !== undefined ? true : undefined,
      discount:
        typeof rawOffer.discount === 'number' && Number.isFinite(rawOffer.discount)
          ? Math.round(rawOffer.discount)
          : computedDiscount,
    }

    validatedOffers.push(validatedOffer)
    categoryCounts[category] += 1
  }

  const report: OfferValidationReport = {
    retailer,
    rawCount: rawOffers.length,
    validatedCount: validatedOffers.length,
    rejectedCount: rawOffers.length - validatedOffers.length,
    rejectedReasons: rejectionReasons,
    categoryCounts,
  }

  return {
    offers: validatedOffers,
    report,
  }
}

export function summarizeCategoryCounts(offers: Array<{ category: SupportedCategory }>) {
  return offers.reduce(
    (acc, offer) => {
      acc[offer.category] += 1
      return acc
    },
    buildEmptyCategoryCounts(),
  )
}

export function categoryDisplayName(category: SupportedCategory): string {
  return CATEGORY_LABELS[category]
}
