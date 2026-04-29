import {
  cleanDisplayText,
  ensureUnitPriceText,
  extractQuantity,
  filterOffersByQuery,
  normalizeSearchQuery,
  resolveScrapedOfferCategory,
  toAbsoluteUrl,
  toValidPrice,
} from '../scraper-utils'
import type { RetailerCoverageReport, RetailerScrapeDetails, ScrapeIssue, ScrapedOffer } from '../types'

const LAFOIRFOUILLE_BASE_URL = 'https://www.lafoirfouille.fr'
const LAFOIRFOUILLE_MEDIA_BASE_URL = 'https://prod-api.lafoirfouille.fr'
const LAFOIRFOUILLE_PRODUCT_SITEMAP_URLS = [
  `${LAFOIRFOUILLE_BASE_URL}/sitemapProducts_0.xml`,
  `${LAFOIRFOUILLE_BASE_URL}/sitemapProducts_1.xml`,
]
const LAFOIRFOUILLE_ROOT_CATEGORY_PATHS = [
  '/c/plein-air.html',
  '/c/decoration.html',
  '/c/linge-de-maison.html',
  '/maison/c/mobilier.html',
  '/c/cuisine.html',
  '/maison/c/salle-de-bain.html',
  '/c/rangement.html',
  '/c/animalerie.html',
  '/c/loisir-et-jeux.html',
  '/c/bien-etre-mobilite.html',
  '/c/festif.html',
]
const LAFOIRFOUILLE_DEFAULT_REQUEST_TIMEOUT_MS = 30000
const LAFOIRFOUILLE_DEFAULT_CRAWL_DELAY_MS = 5000
const LAFOIRFOUILLE_DEFAULT_SEARCH_PRODUCT_LIMIT = 4
const LAFOIRFOUILLE_MAX_HTTP_ATTEMPTS = 3
const LAFOIRFOUILLE_RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504])

type LffPrice = {
  value?: unknown
  formattedValue?: string
}

type LffImage = {
  format?: string
  url?: string
}

type LffBreadcrumb = {
  name?: string
  url?: string
  categoryCode?: string
}

type LffProduct = {
  code?: string | number
  name?: string
  title?: string
  url?: string
  summary?: string
  manufacturer?: string
  manufacturerName?: string
  price?: LffPrice | string | number
  oldPrice?: LffPrice | string | number
  originalPrice?: LffPrice | string | number
  crossedPrice?: LffPrice | string | number
  images?: LffImage[]
  medias?: string[]
  breadcrumbs?: LffBreadcrumb[]
  priceUnit?: {
    code?: string
    name?: string
  }
  hasStoreStock?: boolean
  acceptReservation?: boolean
  acceptClickAndCollectSelling?: boolean
  acceptClickAndCollectExpressSelling?: boolean
  acceptDropShippingSelling?: boolean
  dimension?: string
  oldDimension?: string
  weight?: string
  bullet1?: string
  bullet2?: string
  bullet3?: string
  marketingAccroche?: string
  primaryCategoryCode?: string
  productWebCategoryCode?: string
  webCategories?: Array<{ code?: string }>
}

type LffPagination = {
  pageSize?: number
  currentPage?: number
  numberOfPages?: number
  totalNumberOfResults?: number
}

type LffCategoryInfos = {
  categoryName?: string
  path?: string
  searchPageData?: {
    results?: LffProduct[]
    pagination?: LffPagination
    categoryCode?: string
  }
}

type LffProductInfos = {
  productWebCategoryCode?: string
  productWebCategoryName?: string
  categoryUrl?: string
  breadcrumbs?: LffBreadcrumb[]
  product?: LffProduct
}

type LffNextData = {
  props?: {
    pageProps?: {
      appData?: {
        breadcrumbs?: LffBreadcrumb[]
        categoryInfos?: LffCategoryInfos
        productInfos?: LffProductInfos
        pageTitle?: string
      }
    }
  }
}

type CategoryPageExtraction = {
  offers: ScrapedOffer[]
  pageCount: number
  totalResults: number
}

type LafoirfouilleScrapeResult = {
  offers: ScrapedOffer[]
  issues: ScrapeIssue[]
  coverage: RetailerCoverageReport
}

let lastRequestAt = 0
let cachedProductUrlsPromise: Promise<string[]> | null = null

function readPositiveIntegerEnv(name: string): number | null {
  const value = process.env[name]
  if (!value) return null

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function readNonNegativeIntegerEnv(name: string): number | null {
  const value = process.env[name]
  if (!value) return null

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function getRequestTimeoutMs() {
  return readPositiveIntegerEnv('LAFOIRFOUILLE_REQUEST_TIMEOUT_MS') || LAFOIRFOUILLE_DEFAULT_REQUEST_TIMEOUT_MS
}

function getCrawlDelayMs() {
  const configured = readNonNegativeIntegerEnv('LAFOIRFOUILLE_CRAWL_DELAY_MS')
  return configured === null ? LAFOIRFOUILLE_DEFAULT_CRAWL_DELAY_MS : configured
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForCrawlDelay() {
  const crawlDelayMs = getCrawlDelayMs()
  if (crawlDelayMs <= 0) {
    lastRequestAt = Date.now()
    return
  }

  const elapsed = lastRequestAt ? Date.now() - lastRequestAt : crawlDelayMs
  const waitMs = Math.max(0, crawlDelayMs - elapsed)
  if (waitMs > 0) {
    await sleep(waitMs)
  }

  lastRequestAt = Date.now()
}

function createIssue(
  code: string,
  message: string,
  url?: string,
  page?: number,
  severity?: ScrapeIssue['severity'],
): ScrapeIssue {
  return {
    retailer: 'lafoirfouille',
    code,
    message,
    url,
    page,
    severity,
  }
}

function parseLocs(xml: string) {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((match) => match[1] || '').filter(Boolean)
}

async function fetchTextWithRetry(url: string): Promise<string> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= LAFOIRFOUILLE_MAX_HTTP_ATTEMPTS; attempt += 1) {
    await waitForCrawlDelay()

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), getRequestTimeoutMs())

    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        },
        signal: controller.signal,
      })
      const text = await response.text()

      if (response.ok) {
        return text
      }

      lastError = new Error(`HTTP ${response.status} while fetching ${url}`)
      if (!LAFOIRFOUILLE_RETRYABLE_STATUSES.has(response.status)) {
        throw lastError
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      if (attempt === LAFOIRFOUILLE_MAX_HTTP_ATTEMPTS) {
        throw lastError
      }
    } finally {
      clearTimeout(timeout)
    }

    await sleep(1000 * attempt)
  }

  throw lastError || new Error(`Failed to fetch ${url}`)
}

export function extractLafoirfouilleNextData(html: string): LffNextData | null {
  const match = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/)
  if (!match?.[1]) return null

  try {
    return JSON.parse(match[1]) as LffNextData
  } catch (_error) {
    return null
  }
}

export function parseLafoirfouillePrice(value: unknown): number | null {
  if (value && typeof value === 'object') {
    const price = value as LffPrice
    return toValidPrice(price.value) ?? toValidPrice(price.formattedValue)
  }

  return toValidPrice(value)
}

function normalizeImageUrl(value: string | null | undefined) {
  const raw = cleanDisplayText(value)
  if (!raw) return ''

  if (raw.startsWith('/medias/')) {
    return toAbsoluteUrl(raw, LAFOIRFOUILLE_MEDIA_BASE_URL)
  }

  return toAbsoluteUrl(raw, LAFOIRFOUILLE_BASE_URL) || toAbsoluteUrl(raw, LAFOIRFOUILLE_MEDIA_BASE_URL)
}

function getImageFormatScore(format: string | undefined) {
  const normalized = normalizeSearchQuery(format || '')
  if (normalized.includes('superzoom')) return 50
  if (normalized.includes('zoom')) return 40
  if (normalized.includes('product')) return 30
  if (normalized.includes('thumbnail')) return 20
  return 0
}

function buildImageUrl(product: LffProduct) {
  const media = product.medias?.map(normalizeImageUrl).find(Boolean)
  if (media) return media

  const image = [...(product.images || [])]
    .filter((candidate) => cleanDisplayText(candidate.url))
    .sort((left, right) => getImageFormatScore(right.format) - getImageFormatScore(left.format))[0]

  return normalizeImageUrl(image?.url)
}

function cleanBrand(product: LffProduct) {
  const manufacturerName = cleanDisplayText(product.manufacturerName)
  if (manufacturerName && !normalizeSearchQuery(manufacturerName).includes('inconnu')) {
    return manufacturerName
  }

  const manufacturer = cleanDisplayText(product.manufacturer)
  return /\D/.test(manufacturer) ? manufacturer : undefined
}

function uniqueCleanValues(values: Array<string | null | undefined>) {
  const seen = new Set<string>()
  const output: string[] = []

  for (const value of values) {
    const cleaned = cleanDisplayText(value)
    if (!cleaned || seen.has(cleaned)) continue
    seen.add(cleaned)
    output.push(cleaned)
  }

  return output
}

function buildDescription(product: LffProduct) {
  return uniqueCleanValues([
    product.summary,
    product.marketingAccroche,
    product.bullet1,
    product.bullet2,
    product.bullet3,
  ]).join(' | ')
}

function buildSourceCategoryPath(product: LffProduct, fallbackBreadcrumbs: LffBreadcrumb[] = [], fallbackCategoryName = '') {
  const breadcrumbs = product.breadcrumbs?.length ? product.breadcrumbs : fallbackBreadcrumbs
  const breadcrumbNames = (breadcrumbs || []).map((breadcrumb) => breadcrumb.name)
  const categoryCodes = uniqueCleanValues([
    product.primaryCategoryCode,
    product.productWebCategoryCode,
    ...(product.webCategories || []).map((category) => category.code),
  ])
  return uniqueCleanValues([...breadcrumbNames, fallbackCategoryName, ...categoryCodes]).join(' | ')
}

function getNativeCategory(product: LffProduct, fallbackCategoryName: string) {
  const breadcrumbs = product.breadcrumbs || []
  const productName = cleanDisplayText(product.name || product.title)
  const categoryBreadcrumb = [...breadcrumbs]
    .reverse()
    .map((breadcrumb) => cleanDisplayText(breadcrumb.name))
    .find((name) => name && name !== productName && normalizeSearchQuery(name) !== 'tous nos produits')

  return categoryBreadcrumb || cleanDisplayText(fallbackCategoryName)
}

function normalizeAvailability(product: LffProduct) {
  if (product.hasStoreStock) {
    return 'Disponible en magasin'
  }

  if (
    product.acceptReservation ||
    product.acceptClickAndCollectSelling ||
    product.acceptClickAndCollectExpressSelling ||
    product.acceptDropShippingSelling
  ) {
    return 'Disponible'
  }

  return undefined
}

function buildPageUrl(categoryUrl: string, pageNumber: number) {
  const url = new URL(categoryUrl, LAFOIRFOUILLE_BASE_URL)
  if (pageNumber <= 0) {
    return url.toString()
  }

  url.pathname = url.pathname.replace(/\.html$/, `--page-${pageNumber}.html`)
  url.search = ''
  return url.toString()
}

function buildOfferFromProduct(
  product: LffProduct,
  context: {
    categoryName?: string
    breadcrumbs?: LffBreadcrumb[]
  },
): ScrapedOffer | null {
  const name = cleanDisplayText(product.name || product.title)
  const sourceProductId = cleanDisplayText(String(product.code || ''))
  const sourceUrl = toAbsoluteUrl(product.url, LAFOIRFOUILLE_BASE_URL)
  const price = parseLafoirfouillePrice(product.price)

  if (!name || !sourceProductId || !sourceUrl || price === null) {
    return null
  }

  const brand = cleanBrand(product)
  const description = buildDescription(product)
  const availability = normalizeAvailability(product)
  const sourceCategoryPath = buildSourceCategoryPath(product, context.breadcrumbs, context.categoryName)
  const nativeCategory = getNativeCategory(product, context.categoryName || '')
  const categoryResolution = resolveScrapedOfferCategory({
    retailer: 'lafoirfouille',
    sourceUrl,
    sourceCategoryPath,
    nativeCategory,
    name,
    brand,
    description,
    availability,
    tags: [
      product.primaryCategoryCode,
      product.productWebCategoryCode,
      ...(product.webCategories || []).map((category) => category.code),
    ],
  })
  const originalPrice =
    parseLafoirfouillePrice(product.originalPrice) ??
    parseLafoirfouillePrice(product.oldPrice) ??
    parseLafoirfouillePrice(product.crossedPrice)
  const discount =
    originalPrice !== null && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : undefined
  const quantity =
    extractQuantity(
      [
        name,
        product.dimension,
        product.oldDimension,
        product.weight,
        description,
        product.priceUnit?.name,
        product.priceUnit?.code,
      ].join(' '),
    ) || undefined
  const unitPrice = ensureUnitPriceText(undefined, price, quantity)

  return {
    retailer: 'lafoirfouille',
    sourceProductId,
    sourceUrl,
    sourceCategoryPath,
    category: categoryResolution.category,
    categoryResolution,
    name,
    brand,
    price,
    image: buildImageUrl(product),
    description: description || undefined,
    availability,
    quantity,
    unitPrice,
    originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
    isOnPromotion: discount !== undefined ? true : undefined,
    discount,
  }
}

function dedupeBySourceProductId(offers: ScrapedOffer[]) {
  const deduped = new Map<string, ScrapedOffer>()

  for (const offer of offers) {
    const key = cleanDisplayText(offer.sourceProductId) || offer.sourceUrl
    if (!key || deduped.has(key)) continue
    deduped.set(key, offer)
  }

  return Array.from(deduped.values())
}

export function extractLafoirfouilleCategoryPage(html: string, _pageUrl: string): CategoryPageExtraction {
  void _pageUrl
  const nextData = extractLafoirfouilleNextData(html)
  const appData = nextData?.props?.pageProps?.appData
  const categoryInfos = appData?.categoryInfos
  const searchPageData = categoryInfos?.searchPageData
  const products = searchPageData?.results || []
  const pagination = searchPageData?.pagination
  const pageCount = Math.max(1, pagination?.numberOfPages || 1)
  const totalResults = pagination?.totalNumberOfResults || products.length

  const offers = products
    .map((product) =>
      buildOfferFromProduct(product, {
        categoryName: categoryInfos?.categoryName,
        breadcrumbs: appData?.breadcrumbs,
      }),
    )
    .filter((offer): offer is ScrapedOffer => offer !== null)

  return {
    offers,
    pageCount,
    totalResults,
  }
}

export function extractLafoirfouilleCategoryPageOffers(html: string, pageUrl: string): ScrapedOffer[] {
  return extractLafoirfouilleCategoryPage(html, pageUrl).offers
}

export function extractLafoirfouilleProductPageOffer(html: string, pageUrl: string): ScrapedOffer | null {
  const nextData = extractLafoirfouilleNextData(html)
  const productInfos = nextData?.props?.pageProps?.appData?.productInfos
  const product = productInfos?.product
  if (!product) {
    return null
  }

  return buildOfferFromProduct(
    {
      ...product,
      productWebCategoryCode: productInfos.productWebCategoryCode,
      breadcrumbs: product.breadcrumbs?.length ? product.breadcrumbs : productInfos.breadcrumbs,
      url: product.url || pageUrl,
    },
    {
      categoryName: productInfos.productWebCategoryName,
      breadcrumbs: productInfos.breadcrumbs,
    },
  )
}

async function fetchProductSitemapUrls() {
  if (!cachedProductUrlsPromise) {
    cachedProductUrlsPromise = (async () => {
      const productUrls: string[] = []

      for (const sitemapUrl of LAFOIRFOUILLE_PRODUCT_SITEMAP_URLS) {
        const xml = await fetchTextWithRetry(sitemapUrl)
        productUrls.push(...parseLocs(xml).filter((url) => url.includes('/p/')))
      }

      return Array.from(new Set(productUrls))
    })()
  }

  return cachedProductUrlsPromise
}

function filterProductUrlsBySearchQuery(urls: string[], searchQuery: string) {
  const normalizedTokens = normalizeSearchQuery(searchQuery)
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length > 1)

  if (normalizedTokens.length === 0) return []

  return urls.filter((url) => {
    const normalizedUrl = normalizeSearchQuery(decodeURIComponent(url))
    return normalizedTokens.every((token) => normalizedUrl.includes(token))
  })
}

async function scrapeSearchProducts(searchQuery: string): Promise<LafoirfouilleScrapeResult> {
  const issues: ScrapeIssue[] = []
  const allProductUrls = await fetchProductSitemapUrls()
  const maxProducts =
    readPositiveIntegerEnv('LAFOIRFOUILLE_MAX_PRODUCTS') ||
    readPositiveIntegerEnv('LAFOIRFOUILLE_SEARCH_LIMIT') ||
    LAFOIRFOUILLE_DEFAULT_SEARCH_PRODUCT_LIMIT
  const candidateUrls = filterProductUrlsBySearchQuery(allProductUrls, searchQuery).slice(0, maxProducts)
  const offers: ScrapedOffer[] = []
  let completedListings = 0

  for (const url of candidateUrls) {
    try {
      const html = await fetchTextWithRetry(url)
      completedListings += 1
      const offer = extractLafoirfouilleProductPageOffer(html, url)
      if (offer) {
        offers.push(offer)
      } else {
        issues.push(createIssue('product_parse_empty', `No product data found on La Foir'Fouille page ${url}`, url, undefined, 'warning'))
      }
    } catch (error) {
      issues.push(
        createIssue(
          'product_page_error',
          `Failed to scrape La Foir'Fouille product page ${url}: ${error instanceof Error ? error.message : String(error)}`,
          url,
        ),
      )
    }
  }

  const filteredOffers = dedupeBySourceProductId(filterOffersByQuery(offers, searchQuery))
  const isComplete = issues.every((issue) => issue.severity === 'warning') && completedListings === candidateUrls.length

  return {
    offers: filteredOffers,
    issues,
    coverage: {
      discoveredListings: candidateUrls.length,
      completedListings,
      collectionRate: candidateUrls.length === 0 ? 100 : Math.round((completedListings / candidateUrls.length) * 100),
      isComplete,
    },
  }
}

function shouldStopScraping(offers: ScrapedOffer[]) {
  const maxProducts = readPositiveIntegerEnv('LAFOIRFOUILLE_MAX_PRODUCTS')
  return maxProducts !== null && offers.length >= maxProducts
}

async function scrapeCategoryCatalog(): Promise<LafoirfouilleScrapeResult> {
  const issues: ScrapeIssue[] = []
  const offers: ScrapedOffer[] = []
  const seenSourceIds = new Set<string>()
  const maxPagesPerCategory = readPositiveIntegerEnv('LAFOIRFOUILLE_MAX_PAGES')
  let discoveredListings = 0
  let completedListings = 0

  for (const categoryPath of LAFOIRFOUILLE_ROOT_CATEGORY_PATHS) {
    if (shouldStopScraping(offers)) break

    const categoryUrl = toAbsoluteUrl(categoryPath, LAFOIRFOUILLE_BASE_URL)
    if (!categoryUrl) continue

    let pageLimit = 1

    for (let pageNumber = 0; pageNumber < pageLimit; pageNumber += 1) {
      if (shouldStopScraping(offers)) break

      const pageUrl = buildPageUrl(categoryUrl, pageNumber)
      discoveredListings += 1

      try {
        const html = await fetchTextWithRetry(pageUrl)
        const extraction = extractLafoirfouilleCategoryPage(html, pageUrl)
        completedListings += 1

        if (pageNumber === 0) {
          pageLimit = Math.max(1, extraction.pageCount)
          if (maxPagesPerCategory !== null) {
            pageLimit = Math.min(pageLimit, maxPagesPerCategory)
          }
        }

        for (const offer of extraction.offers) {
          const sourceId = cleanDisplayText(offer.sourceProductId)
          if (!sourceId || seenSourceIds.has(sourceId)) continue
          seenSourceIds.add(sourceId)
          offers.push(offer)
          if (shouldStopScraping(offers)) break
        }
      } catch (error) {
        issues.push(
          createIssue(
            'category_page_error',
            `Failed to scrape La Foir'Fouille category page ${pageUrl}: ${
              error instanceof Error ? error.message : String(error)
            }`,
            pageUrl,
            pageNumber,
          ),
        )
      }
    }
  }

  const blockingIssueCount = issues.filter((issue) => issue.severity !== 'warning').length

  return {
    offers: dedupeBySourceProductId(offers),
    issues,
    coverage: {
      discoveredListings,
      completedListings,
      collectionRate: discoveredListings === 0 ? 0 : Math.round((completedListings / discoveredListings) * 100),
      isComplete: blockingIssueCount === 0 && completedListings > 0 && offers.length > 0,
    },
  }
}

export async function scrapeLafoirfouilleProductsDetailed(searchQuery?: string): Promise<RetailerScrapeDetails> {
  const issues: ScrapeIssue[] = []

  try {
    const result = searchQuery ? await scrapeSearchProducts(searchQuery) : await scrapeCategoryCatalog()

    return {
      retailer: 'lafoirfouille',
      offers: result.offers,
      issues: result.issues,
      coverage: result.coverage,
    }
  } catch (error) {
    issues.push(
      createIssue(
        'scraper_error',
        `La Foir'Fouille scraper failed: ${error instanceof Error ? error.message : String(error)}`,
      ),
    )

    return {
      retailer: 'lafoirfouille',
      offers: [],
      issues,
      coverage: {
        discoveredListings: 0,
        completedListings: 0,
        collectionRate: 0,
        isComplete: false,
      },
    }
  }
}

export async function scrapeLafoirfouilleProducts(searchQuery?: string): Promise<ScrapedOffer[]> {
  const result = await scrapeLafoirfouilleProductsDetailed(searchQuery)
  return result.offers
}
