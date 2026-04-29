import * as cheerio from 'cheerio'

import { cleanDisplayText, normalizeSearchQuery, resolveScrapedOfferCategory, toAbsoluteUrl, toValidPrice } from '../scraper-utils'
import type { RetailerCoverageReport, RetailerScrapeDetails, ScrapeIssue, ScrapedOffer } from '../types'
import type { SupportedCategory } from '../catalog'

const LIDL_BASE_URL = 'https://www.lidl.fr'
const LIDL_HOME_URL = `${LIDL_BASE_URL}/`
const LIDL_API_VERSION = 'v2.0.0'
const LIDL_ASSORTMENT = 'FR'
const LIDL_LOCALE = 'fr_FR'
const LIDL_PAGE_SIZE = 36
const LIDL_MAX_PAGES_PER_SOURCE = 9999
const LIDL_MAX_RETRIES = 3
const LIDL_BASE_RETRY_DELAY_MS = 900

type LidlNavigationLink = {
  text: string
  href: string
}

type LidlCategorySource = {
  category: SupportedCategory
  sourceUrl: string
  sourceCategoryPath: string
}

type LidlPrice = {
  price?: number | string
  currencyCode?: string
  basePrice?: {
    amount?: number
    text?: string
    unit?: string
  }
  discount?: {
    deletedPrice?: number
    recommendedPrice?: number
    percentageDiscount?: number
    showDiscount?: boolean
  }
  recommendedPrice?: number
  oldPrice?: number
  packaging?: {
    amount?: number
    text?: string
    unit?: string
  }
}

type LidlGridboxData = {
  productId?: number | string
  erpNumber?: number | string
  canonicalUrl?: string
  canonicalPath?: string
  category?: string
  keyfacts?: {
    analyticsCategory?: string
    supplementalDescription?: string
    title?: string
    fullTitle?: string
    wonCategoryPrimary?: string
    wonCategoryPrimaryPath?: string
  }
  brand?: {
    name?: string
  }
  fullTitle?: string
  title?: string
  image?: string
  image_V1?: {
    image?: string
  }
  imageList?: string[]
  imageList_V1?: Array<{ image?: string }>
  price?: LidlPrice
  stockAvailability?: {
    onlineAvailable?: boolean
    availabilityIndicator?: number
    badgeInfo?: {
      badges?: Array<{ text?: string; type?: string }>
    }
  }
  ratings?: {
    average?: number
    count?: number
  }
  overview?: string
}

type LidlSearchItem = {
  type?: string
  resultClass?: string
  code?: string
  gridbox?: {
    country?: string
    data?: LidlGridboxData
  }
  url?: string
}

type LidlApiResponse = {
  numFound?: number
  offset?: number
  fetchsize?: number
  items?: LidlSearchItem[]
}

const LIDL_CATEGORY_HINTS: Array<{ category: SupportedCategory; patterns: string[] }> = [
  { category: 'alimentation', patterns: ['fruits et legumes', 'pains et viennoiseries', 'oeufs et produits secs', 'fromages produits laitiers', 'viandes et charcuteries', 'poissons et crustaces', 'cafe the cacao', 'confitures pates a tartiner', 'huiles conserves', 'sauces epices', 'plats prepares', 'produits surgeles', 'epicerie et sucreries', 'vins et spiritueux', 'boissons'] },
  { category: 'hygiene', patterns: ['hygiene et beaute', 'beaute soins du corps'] },
  { category: 'menage', patterns: ['rangement et organisation', 'appareils de nettoyage', 'lavage sechage', 'couloir espace de stockage'] },
  { category: 'maison-deco', patterns: ['decoration', 'chambre a coucher', 'salle de bain', 'salon', 'bureau', 'cuisine salle a manger', 'luminaire eclairage', 'chambres de bebe d enfant'] },
  { category: 'jardin', patterns: ['jardin terrasse', 'fleurs plantes accessoires', 'mobilier de jardin', 'plantes fleurs'] },
  { category: 'bricolage', patterns: ['outils sans fil', 'outils electriques', 'outils de jardinage', 'atelier quincaillerie', 'construire renover', 'outils a main', 'voiture moto', 'abris de jardin'] },
  { category: 'loisirs', patterns: ['camping plein air', 'fitness', 'velo', 'sports nautiques', 'course a pied', 'loisirs sports d equipe', 'sports d hiver', 'vetements de sport', 'sante et bien etre'] },
  { category: 'animaux', patterns: ['animaux'] },
  { category: 'textile', patterns: ['linge de maison', 'linge de lit'] },
  { category: 'mode', patterns: ['mode pour femme', 'mode pour homme', 'chaussures accessoires', 'vetements pour enfants 9 15 ans', 'valises accessoires de voyage', 'vetements pour bebes', 'vetements pour enfants 2 8 ans'] },
  { category: 'high-tech', patterns: ['multimedia'] },
  { category: 'bazar', patterns: ['cuisine patisserie', 'l art de la table la vaisselle', 'barbecue accessoires', 'monsieur cuisine', 'appareils de cuisine'] },
  { category: 'jouets', patterns: ['jouets', 'education loisirs creatifs', 'equipement pour bebes et enfants', 'equipements bebe enfants', 'jeux de construction', 'jeux de societe'] },
]

const LIDL_FALLBACK_SOURCES: LidlCategorySource[] = [
  { category: 'alimentation', sourceUrl: `${LIDL_BASE_URL}/h/fruits-et-legumes/h10071012`, sourceCategoryPath: 'Fruits et légumes' },
  { category: 'alimentation', sourceUrl: `${LIDL_BASE_URL}/h/pains-et-viennoiseries/h10071015`, sourceCategoryPath: 'Pains et viennoiseries' },
  { category: 'alimentation', sourceUrl: `${LIDL_BASE_URL}/h/fromages-produits-laitiers/h10071017`, sourceCategoryPath: 'Fromages, produits laitiers' },
  { category: 'alimentation', sourceUrl: `${LIDL_BASE_URL}/h/viandes-et-charcuteries/h10071016`, sourceCategoryPath: 'Viandes et charcuteries' },
  { category: 'alimentation', sourceUrl: `${LIDL_BASE_URL}/h/plats-prepares/h10071020`, sourceCategoryPath: 'Plats préparés' },
  { category: 'alimentation', sourceUrl: `${LIDL_BASE_URL}/h/produits-surgeles/h10071049`, sourceCategoryPath: 'Produits surgelés' },
  { category: 'alimentation', sourceUrl: `${LIDL_BASE_URL}/h/epicerie-et-sucreries/h10071044`, sourceCategoryPath: 'Épicerie et sucreries' },
  { category: 'alimentation', sourceUrl: `${LIDL_BASE_URL}/h/boissons/h10071022`, sourceCategoryPath: 'Boissons' },
  { category: 'alimentation', sourceUrl: `${LIDL_BASE_URL}/h/vins-et-spiritueux/h10071687`, sourceCategoryPath: 'Vins et spiritueux' },
  { category: 'hygiene', sourceUrl: `${LIDL_BASE_URL}/h/hygiene-et-beaute/h10071019`, sourceCategoryPath: 'Hygiène et beauté' },
  { category: 'hygiene', sourceUrl: `${LIDL_BASE_URL}/h/beaute-soins-du-corps/h10067563`, sourceCategoryPath: 'Beauté et soins du corps' },
  { category: 'menage', sourceUrl: `${LIDL_BASE_URL}/h/nettoyage-de-la-maison/h10067527`, sourceCategoryPath: 'Nettoyage de la maison' },
  { category: 'menage', sourceUrl: `${LIDL_BASE_URL}/h/rangement-et-organisation/h10067526`, sourceCategoryPath: 'Rangement et organisation' },
  { category: 'menage', sourceUrl: `${LIDL_BASE_URL}/h/lavage-sechage/h10067528`, sourceCategoryPath: 'Lavage et séchage' },
  { category: 'menage', sourceUrl: `${LIDL_BASE_URL}/h/couloir-espace-de-stockage/h10067560`, sourceCategoryPath: 'Couloir et espace de stockage' },
  { category: 'maison-deco', sourceUrl: `${LIDL_BASE_URL}/h/decoration/h10067559`, sourceCategoryPath: "Décorations d'intérieur" },
  { category: 'maison-deco', sourceUrl: `${LIDL_BASE_URL}/h/chambre-a-coucher/h10067552`, sourceCategoryPath: 'Chambre à coucher' },
  { category: 'maison-deco', sourceUrl: `${LIDL_BASE_URL}/h/salle-de-bain/h10067553`, sourceCategoryPath: 'Salle de bain' },
  { category: 'maison-deco', sourceUrl: `${LIDL_BASE_URL}/h/salon/h10067554`, sourceCategoryPath: 'Salon' },
  { category: 'maison-deco', sourceUrl: `${LIDL_BASE_URL}/h/bureau/h10067555`, sourceCategoryPath: 'Bureau' },
  { category: 'maison-deco', sourceUrl: `${LIDL_BASE_URL}/h/cuisine-salle-a-manger/h10067556`, sourceCategoryPath: 'Cuisine et salle à manger' },
  { category: 'maison-deco', sourceUrl: `${LIDL_BASE_URL}/h/luminaire-eclairage/h10067561`, sourceCategoryPath: 'Luminaire et éclairage' },
  { category: 'maison-deco', sourceUrl: `${LIDL_BASE_URL}/h/matelas/h10018716`, sourceCategoryPath: 'Matelas' },
  { category: 'maison-deco', sourceUrl: `${LIDL_BASE_URL}/h/linge-de-lit/h10018704`, sourceCategoryPath: 'Linge de lit' },
  { category: 'jardin', sourceUrl: `${LIDL_BASE_URL}/h/jardin-terrasse/h10067558`, sourceCategoryPath: 'Jardin et terrasse' },
  { category: 'jardin', sourceUrl: `${LIDL_BASE_URL}/h/fleurs-plantes-accessoires/h10067539`, sourceCategoryPath: 'Fleurs, plantes et accessoires' },
  { category: 'jardin', sourceUrl: `${LIDL_BASE_URL}/h/mobilier-de-jardin/h10018575`, sourceCategoryPath: 'Mobilier de jardin' },
  { category: 'bricolage', sourceUrl: `${LIDL_BASE_URL}/h/outils-electriques/h10067532`, sourceCategoryPath: 'Outils électriques' },
  { category: 'bricolage', sourceUrl: `${LIDL_BASE_URL}/h/outils-sans-fil/h10067531`, sourceCategoryPath: 'Outils sans fil' },
  { category: 'bricolage', sourceUrl: `${LIDL_BASE_URL}/h/outils-de-jardinage/h10067533`, sourceCategoryPath: 'Outils de jardinage' },
  { category: 'bricolage', sourceUrl: `${LIDL_BASE_URL}/h/atelier-quincaillerie/h10067534`, sourceCategoryPath: 'Atelier et quincaillerie' },
  { category: 'bricolage', sourceUrl: `${LIDL_BASE_URL}/h/construire-renover/h10067536`, sourceCategoryPath: 'Construire et rénover' },
  { category: 'bricolage', sourceUrl: `${LIDL_BASE_URL}/h/outils-a-main/h10067535`, sourceCategoryPath: 'Outils à main' },
  { category: 'bricolage', sourceUrl: `${LIDL_BASE_URL}/h/voiture-moto/h10067538`, sourceCategoryPath: 'Voiture et moto' },
  { category: 'bricolage', sourceUrl: `${LIDL_BASE_URL}/h/abris-de-jardin-toit/h10067540`, sourceCategoryPath: 'Abris de jardin et toit' },
  { category: 'bricolage', sourceUrl: `${LIDL_BASE_URL}/h/chauffage-et-climatisation/h10067566`, sourceCategoryPath: 'Chauffage et climatisation' },
  { category: 'loisirs', sourceUrl: `${LIDL_BASE_URL}/h/camping-plein-air/h10067542`, sourceCategoryPath: 'Camping et plein air' },
  { category: 'loisirs', sourceUrl: `${LIDL_BASE_URL}/h/fitness/h10067543`, sourceCategoryPath: 'Fitness' },
  { category: 'loisirs', sourceUrl: `${LIDL_BASE_URL}/h/velo/h10067544`, sourceCategoryPath: 'Vélo' },
  { category: 'loisirs', sourceUrl: `${LIDL_BASE_URL}/h/sports-nautiques/h10067545`, sourceCategoryPath: 'Sports nautiques' },
  { category: 'loisirs', sourceUrl: `${LIDL_BASE_URL}/h/course-a-pied/h10067547`, sourceCategoryPath: 'Course à pied' },
  { category: 'loisirs', sourceUrl: `${LIDL_BASE_URL}/h/sports-d-hiver/h10067546`, sourceCategoryPath: "Sports d'hiver" },
  { category: 'loisirs', sourceUrl: `${LIDL_BASE_URL}/h/vetements-de-sport/h10067541`, sourceCategoryPath: 'Vêtements de sport' },
  { category: 'loisirs', sourceUrl: `${LIDL_BASE_URL}/h/sante-et-bien-etre/h10067549`, sourceCategoryPath: 'Santé et bien-être' },
  { category: 'animaux', sourceUrl: `${LIDL_BASE_URL}/h/animaux/h10067551`, sourceCategoryPath: 'Articles pour animaux' },
  { category: 'textile', sourceUrl: `${LIDL_BASE_URL}/h/linge-de-maison/h10067565`, sourceCategoryPath: 'Linge de maison' },
  { category: 'mode', sourceUrl: `${LIDL_BASE_URL}/h/mode-femme/h10067567`, sourceCategoryPath: 'Mode pour femme' },
  { category: 'mode', sourceUrl: `${LIDL_BASE_URL}/h/mode-homme/h10067568`, sourceCategoryPath: 'Mode pour homme' },
  { category: 'mode', sourceUrl: `${LIDL_BASE_URL}/h/chaussures-accessoires/h10067569`, sourceCategoryPath: 'Chaussures et accessoires' },
  { category: 'mode', sourceUrl: `${LIDL_BASE_URL}/h/vetements-pour-enfants-9-15-ans/h10067570`, sourceCategoryPath: 'Vêtements enfants 9-15 ans' },
  { category: 'mode', sourceUrl: `${LIDL_BASE_URL}/h/valises-accessoires-de-voyage/h10067572`, sourceCategoryPath: 'Valises et accessoires de voyage' },
  { category: 'mode', sourceUrl: `${LIDL_BASE_URL}/h/vetements-pour-bebes/h10067574`, sourceCategoryPath: 'Vêtements pour bébés' },
  { category: 'mode', sourceUrl: `${LIDL_BASE_URL}/h/vetements-pour-enfants-2-8-ans/h10067575`, sourceCategoryPath: 'Vêtements enfants 2-8 ans' },
  { category: 'high-tech', sourceUrl: `${LIDL_BASE_URL}/h/multimedia/h10067564`, sourceCategoryPath: 'Multimédia' },
  { category: 'bazar', sourceUrl: `${LIDL_BASE_URL}/h/cuisine-patisserie/h10067523`, sourceCategoryPath: 'Cuisine et pâtisserie' },
  { category: 'bazar', sourceUrl: `${LIDL_BASE_URL}/h/l-art-de-la-table-la-vaisselle/h10067524`, sourceCategoryPath: "L'art de la table et la vaisselle" },
  { category: 'bazar', sourceUrl: `${LIDL_BASE_URL}/h/barbecue-accessoires/h10067525`, sourceCategoryPath: 'Barbecue et accessoires' },
  { category: 'bazar', sourceUrl: `${LIDL_BASE_URL}/h/monsieur-cuisine/h10067521`, sourceCategoryPath: 'Monsieur Cuisine' },
  { category: 'bazar', sourceUrl: `${LIDL_BASE_URL}/h/appareils-de-cuisine/h10067522`, sourceCategoryPath: 'Appareils de cuisine' },
  { category: 'jouets', sourceUrl: `${LIDL_BASE_URL}/h/jouets/h10067573`, sourceCategoryPath: 'Jouets' },
  { category: 'jouets', sourceUrl: `${LIDL_BASE_URL}/h/education-loisirs-creatifs/h10067577`, sourceCategoryPath: 'Éducation et loisirs créatifs' },
  { category: 'jouets', sourceUrl: `${LIDL_BASE_URL}/h/equipements-bebe-enfants/h10067576`, sourceCategoryPath: 'Équipements bébé et enfants' },
  { category: 'jouets', sourceUrl: `${LIDL_BASE_URL}/h/jeux-de-construction/h10018921`, sourceCategoryPath: 'Jeux de construction' },
]

function createIssue(code: string, message: string, url?: string, page?: number): ScrapeIssue {
  return {
    retailer: 'lidl',
    code,
    message,
    severity: code === 'scraper_error' ? 'error' : 'warning',
    url,
    page,
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeUnitLabel(unit: string | null | undefined) {
  const normalized = normalizeSearchQuery(unit || '')
  if (!normalized) return ''
  if (normalized.includes('kg')) return '/kg'
  if (normalized.includes('l')) return '/l'
  if (normalized.includes('m2') || normalized.includes('m 2') || normalized.includes('m²')) return '/m²'
  if (normalized.includes('piece') || normalized.includes('unite') || normalized.includes('unite') || normalized.includes('pc')) return '/pcs'
  return `/${normalized}`
}

function formatQuantityAmount(amount: number) {
  return Number.isInteger(amount) ? String(amount) : String(Math.round(amount * 100) / 100)
}

function parseLidlUnitPrice(price: LidlPrice | undefined) {
  const text = cleanDisplayText(price?.basePrice?.text)
  if (!text) {
    return null
  }

  const valueMatch = text.match(/=\s*([0-9]+(?:[.,][0-9]+)?)/)
  if (!valueMatch) {
    return null
  }

  const value = toValidPrice(valueMatch[1])
  if (value === null) {
    return null
  }

  const unitMatch = text.match(/1\s*([a-zA-Z0-9²³°%µ]+)\s*=/)
  const label = normalizeUnitLabel(unitMatch?.[1])
  if (!label) {
    return null
  }

  return `${value.toFixed(2).replace('.', ',')}€${label}`
}

function buildLidlQuantity(price: LidlPrice | undefined) {
  const packaging = price?.packaging
  if (packaging?.amount && packaging.unit) {
    return `${formatQuantityAmount(packaging.amount)}${normalizeUnitLabel(packaging.unit).replace(/^\//, '')}`
  }

  const packagingText = cleanDisplayText(packaging?.text)
  if (packagingText) {
    return packagingText
  }

  const base = price?.basePrice
  if (base?.amount && base.unit) {
    return `${formatQuantityAmount(base.amount)}${normalizeUnitLabel(base.unit).replace(/^\//, '')}`
  }

  return undefined
}

function extractLidlDescription(data: LidlGridboxData) {
  const raw = data.keyfacts?.supplementalDescription || data.overview || ''
  if (!raw) return undefined

  return cheerio.load(`<div>${raw}</div>`).text().replace(/\s+/g, ' ').trim() || undefined
}

function extractLidlAvailability(data: LidlGridboxData) {
  const badges = data.stockAvailability?.badgeInfo?.badges || []
  const badgeText = badges.map((badge) => cleanDisplayText(badge.text)).find(Boolean)
  if (badgeText) {
    return badgeText
  }

  if (data.stockAvailability?.onlineAvailable) {
    return 'Disponible en ligne'
  }

  return undefined
}

function extractLidlImage(data: LidlGridboxData) {
  return (
    toAbsoluteUrl(data.image, LIDL_BASE_URL) ||
    toAbsoluteUrl(data.image_V1?.image, LIDL_BASE_URL) ||
    toAbsoluteUrl(data.imageList?.[0], LIDL_BASE_URL) ||
    toAbsoluteUrl(data.imageList_V1?.[0]?.image, LIDL_BASE_URL) ||
    ''
  )
}

function buildLidlSourceCategoryPath(source: LidlCategorySource, data: LidlGridboxData) {
  return (
    cleanDisplayText([source.sourceCategoryPath, data.keyfacts?.wonCategoryPrimary || data.category].filter(Boolean).join(' | ')) ||
    source.sourceCategoryPath
  )
}

function buildLidlSourceUrl(data: LidlGridboxData, fallbackUrl: string) {
  return (
    toAbsoluteUrl(data.canonicalUrl, LIDL_BASE_URL) ||
    toAbsoluteUrl(data.canonicalPath, LIDL_BASE_URL) ||
    fallbackUrl
  )
}

function buildLidlOffer(item: LidlSearchItem, source: LidlCategorySource, pageUrl: string): ScrapedOffer | null {
  const data = item.gridbox?.data
  if (!data) {
    return null
  }

  const sourceUrl = buildLidlSourceUrl(data, pageUrl)
  const name = cleanDisplayText(data.fullTitle || data.keyfacts?.fullTitle || data.keyfacts?.title || data.title)
  const price = toValidPrice(data.price?.price)
  const sourceProductId = cleanDisplayText(String(data.productId ?? data.erpNumber ?? item.code ?? ''))

  if (!sourceUrl || !name || price === null || !sourceProductId) {
    return null
  }

  const sourceCategoryPath = buildLidlSourceCategoryPath(source, data)
  const description = extractLidlDescription(data)
  const availability = extractLidlAvailability(data)
  const quantity = buildLidlQuantity(data.price)
  const unitPrice = parseLidlUnitPrice(data.price) || undefined
  const originalPrice = toValidPrice(
    data.price?.discount?.deletedPrice ?? data.price?.discount?.recommendedPrice ?? data.price?.recommendedPrice ?? data.price?.oldPrice,
  )
  const discount = data.price?.discount?.percentageDiscount
  const isOnPromotion = Boolean(data.price?.discount?.showDiscount || (originalPrice && originalPrice > price))
  const categoryResolution = resolveScrapedOfferCategory({
    retailer: 'lidl',
    sourceUrl,
    sourceCategoryPath,
    nativeCategory: data.keyfacts?.wonCategoryPrimary || data.keyfacts?.analyticsCategory || data.category,
    name,
    brand: data.brand?.name,
    description,
    availability,
    tags: [data.brand?.name, data.keyfacts?.wonCategoryPrimary, data.keyfacts?.analyticsCategory, data.category],
  })

  return {
    retailer: 'lidl',
    sourceProductId,
    sourceUrl,
    sourceCategoryPath,
    category: categoryResolution.category,
    categoryResolution,
    name,
    brand: cleanDisplayText(data.brand?.name),
    price,
    image: extractLidlImage(data),
    description,
    availability,
    quantity,
    unitPrice,
    originalPrice: originalPrice ?? undefined,
    isOnPromotion: isOnPromotion || undefined,
    discount: typeof discount === 'number' ? Math.round(discount) : undefined,
  }
}

function dedupeBySourceProductId(offers: ScrapedOffer[]) {
  const deduped = new Map<string, ScrapedOffer>()
  for (const offer of offers) {
    deduped.set(offer.sourceProductId || `${offer.retailer}:${offer.sourceUrl}`, offer)
  }
  return Array.from(deduped.values())
}

export function extractLidlOffersFromApiResponse(
  response: LidlApiResponse,
  source: LidlCategorySource,
  pageUrl: string,
): ScrapedOffer[] {
  return (response.items || [])
    .map((item) => buildLidlOffer(item, source, pageUrl))
    .filter((offer): offer is ScrapedOffer => Boolean(offer))
}

export function extractLidlNavigationLinks(html: string): LidlNavigationLink[] {
  const $ = cheerio.load(html)
  const links: LidlNavigationLink[] = []
  const seen = new Set<string>()

  $('a[href]').each((_, el) => {
    const href = cleanDisplayText($(el).attr('href'))
    const text = cleanDisplayText($(el).text())
    if (!href || !text || (!href.startsWith('/c/') && !href.startsWith('/h/'))) {
      return
    }

    const key = `${href}|${text}`
    if (seen.has(key)) {
      return
    }

    seen.add(key)
    links.push({ href, text })
  })

  return links
}

export function selectAllLidlCategorySources(links: LidlNavigationLink[]): LidlCategorySource[] {
  const seen = new Set<string>()

  return links.flatMap((link) => {
    const normalizedText = normalizeSearchQuery(link.text)
    const normalizedHref = normalizeSearchQuery(link.href)

    return LIDL_CATEGORY_HINTS.filter((hint) =>
      hint.patterns.some((pattern) => normalizedText.includes(pattern) || normalizedHref.includes(pattern)),
    ).map((hint) => {
      const sourceUrl = toAbsoluteUrl(link.href, LIDL_BASE_URL) || `${LIDL_BASE_URL}${link.href}`
      const key = `${hint.category}:${sourceUrl}`
      if (seen.has(key)) return null
      seen.add(key)
      return { category: hint.category, sourceUrl, sourceCategoryPath: link.text }
    }).filter((s): s is LidlCategorySource => s !== null)
  })
}

async function fetchTextWithRetry(url: string, referer: string, attempts = LIDL_MAX_RETRIES) {
  let lastError: unknown = null

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000)

    try {
      const response = await fetch(url, {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          accept: 'application/json, text/plain, */*',
          'accept-language': 'fr-FR,fr;q=0.9,en;q=0.8',
          referer,
          'x-requested-with': 'XMLHttpRequest',
        },
        signal: controller.signal,
      })

      if (!response.ok) {
        const body = await response.text().catch(() => '')
        throw new Error(`Lidl responded with ${response.status} for ${url}${body ? `: ${body.slice(0, 180)}` : ''}`)
      }

      return await response.text()
    } catch (error) {
      lastError = error
      if (attempt >= attempts) {
        break
      }
      await sleep(Math.min(LIDL_BASE_RETRY_DELAY_MS * 2 ** (attempt - 1), 8000))
    } finally {
      clearTimeout(timeout)
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Unable to fetch Lidl endpoint: ${url}`)
}

async function fetchLidlJson<T>(url: string, referer: string): Promise<T> {
  const text = await fetchTextWithRetry(url, referer)
  return JSON.parse(text) as T
}

function buildCategoryApiUrl(sourceUrl: string, offset = 0) {
  const parsed = new URL(sourceUrl)
  const apiUrl = new URL(`${LIDL_BASE_URL}/q/api/category${parsed.pathname}`)
  apiUrl.searchParams.set('assortment', LIDL_ASSORTMENT)
  apiUrl.searchParams.set('locale', LIDL_LOCALE)
  apiUrl.searchParams.set('version', LIDL_API_VERSION)
  if (offset > 0) {
    apiUrl.searchParams.set('offset', String(offset))
  }
  return apiUrl.toString()
}

function buildSearchApiUrl(query: string, offset = 0) {
  const apiUrl = new URL(`${LIDL_BASE_URL}/q/api/search`)
  apiUrl.searchParams.set('assortment', LIDL_ASSORTMENT)
  apiUrl.searchParams.set('locale', LIDL_LOCALE)
  apiUrl.searchParams.set('version', LIDL_API_VERSION)
  apiUrl.searchParams.set('q', query)
  apiUrl.searchParams.set('store', '1')
  if (offset > 0) {
    apiUrl.searchParams.set('offset', String(offset))
  }
  return apiUrl.toString()
}

async function scrapeSourcePages(
  source: LidlCategorySource,
  pageBuilder: (offset: number) => string,
): Promise<{ offers: ScrapedOffer[]; issues: ScrapeIssue[]; discoveredListings: number }> {
  const offers: ScrapedOffer[] = []
  const issues: ScrapeIssue[] = []
  let discoveredListings = 0
  let offset = 0
  let page = 0
  let totalAvailable = Number.POSITIVE_INFINITY

  while (page < LIDL_MAX_PAGES_PER_SOURCE && offset < totalAvailable) {
    page += 1
    const pageUrl = pageBuilder(offset)

    try {
      const result = await fetchLidlJson<LidlApiResponse>(pageUrl, source.sourceUrl)
      if (page === 1 && (result.items?.length ?? 0) === 0) {
        break
      }
      totalAvailable = typeof result.numFound === 'number' ? result.numFound : Number.MAX_SAFE_INTEGER
      discoveredListings = Math.max(discoveredListings, totalAvailable)

      const pageOffers = extractLidlOffersFromApiResponse(result, source, source.sourceUrl)

      offers.push(...pageOffers)

      const itemsLength = result.items?.length || 0
      if (itemsLength === 0 || itemsLength < (result.fetchsize || LIDL_PAGE_SIZE)) {
        break
      }

      offset += itemsLength || LIDL_PAGE_SIZE
    } catch (error) {
      issues.push(
        createIssue(
          'page_fetch_failed',
          `Lidl page fetch failed for ${pageUrl}: ${error instanceof Error ? error.message : String(error)}`,
          pageUrl,
          page,
        ),
      )
      break
    }
  }

  return { offers, issues, discoveredListings }
}

async function discoverLidlCategorySources(): Promise<LidlCategorySource[]> {
  try {
    const html = await fetchTextWithRetry(LIDL_HOME_URL, LIDL_HOME_URL)
    const discovered = selectAllLidlCategorySources(extractLidlNavigationLinks(html))
    if (discovered.length > 0) {
      const seenUrls = new Set(discovered.map((s) => s.sourceUrl))
      for (const fallback of LIDL_FALLBACK_SOURCES) {
        if (!seenUrls.has(fallback.sourceUrl)) {
          discovered.push(fallback)
        }
      }
      return discovered
    }
  } catch (error) {
    console.warn('Failed to discover Lidl categories from homepage:', error)
  }

  return LIDL_FALLBACK_SOURCES
}

function buildCoverage(discoveredListings: number, completedListings: number): RetailerCoverageReport {
  const safeDiscovered = Number.isFinite(discoveredListings) ? Math.max(discoveredListings, completedListings) : completedListings
  return {
    discoveredListings: safeDiscovered,
    completedListings,
    collectionRate: safeDiscovered > 0 ? Math.round((completedListings / safeDiscovered) * 100) : 0,
    isComplete: completedListings > 0,
  }
}

export async function scrapeLidlProductsDetailed(searchQuery?: string): Promise<RetailerScrapeDetails> {
  const normalizedQuery = cleanDisplayText(searchQuery)
  const allIssues: ScrapeIssue[] = []
  const allOffers: ScrapedOffer[] = []
  let discoveredListings = 0

  try {
    if (normalizedQuery) {
      const searchSource: LidlCategorySource = {
        category: 'bazar',
        sourceUrl: `${LIDL_BASE_URL}/q/search?q=${encodeURIComponent(normalizedQuery)}`,
        sourceCategoryPath: 'Recherche Lidl',
      }

      const { offers, issues, discoveredListings: searchDiscovered } = await scrapeSourcePages(searchSource, (offset) =>
        buildSearchApiUrl(normalizedQuery, offset),
      )
      allOffers.push(...offers)
      allIssues.push(...issues)
      discoveredListings = searchDiscovered
    } else {
      const sources = await discoverLidlCategorySources()
      const results = await Promise.allSettled(
        sources.map((source) =>
          scrapeSourcePages(source, (offset) => buildCategoryApiUrl(source.sourceUrl, offset)),
        ),
      )

      for (const result of results) {
        if (result.status === 'fulfilled') {
          allOffers.push(...result.value.offers)
          allIssues.push(...result.value.issues)
          discoveredListings += result.value.discoveredListings
        } else {
          allIssues.push(
            createIssue('page_fetch_failed', `Lidl category scrape failed: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`),
          )
        }
      }
    }
  } catch (error) {
    allIssues.push(
      createIssue('scraper_error', `Lidl scraper failed: ${error instanceof Error ? error.message : String(error)}`),
    )
  }

  const dedupedOffers = dedupeBySourceProductId(allOffers)
  const coverage = buildCoverage(discoveredListings, dedupedOffers.length)

  if (dedupedOffers.length === 0) {
    allIssues.push(createIssue('scraper_error', 'Lidl scraper returned no validated offers'))
  }

  return {
    retailer: 'lidl',
    offers: dedupedOffers,
    issues: allIssues,
    coverage,
  }
}

export async function scrapeLidlProducts(searchQuery?: string): Promise<ScrapedOffer[]> {
  const result = await scrapeLidlProductsDetailed(searchQuery)
  return result.offers
}
