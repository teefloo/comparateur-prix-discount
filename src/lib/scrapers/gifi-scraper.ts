import { load, type CheerioAPI } from 'cheerio'

import {
  cleanDisplayText,
  filterOffersByQuery,
  extractQuantity,
  resolveScrapedOfferCategory,
  toAbsoluteUrl,
  toValidPrice,
} from '../scraper-utils'
import type { RetailerScrapeDetails, ScrapeIssue, ScrapedOffer } from '../types'

const GIFI_BASE_URL = 'https://www.gifi.fr'
const GIFI_SITEMAP_INDEX_URL = `${GIFI_BASE_URL}/sitemap_index.xml`
const GIFI_CATEGORY_SITEMAP_URL = `${GIFI_BASE_URL}/sitemap_5-category.xml`
const GIFI_PRODUCT_SITEMAP_URLS = [`${GIFI_BASE_URL}/sitemap_0-product.xml`, `${GIFI_BASE_URL}/sitemap_1-product.xml`]
const GIFI_MAX_SEARCH_RESULTS = 60
const GIFI_REQUEST_TIMEOUT_MS = 30000
const GIFI_MAX_RETRIES = 4
const GIFI_CATEGORY_CONCURRENCY = 6
const GIFI_SEARCH_CONCURRENCY = 8
const GIFI_MAX_CATEGORY_PAGES = 12

type GifiGtmData = {
  product_id?: string
  product_sku?: string
  product_name?: string
  product_brand?: string | null
  product_cat1?: string | null
  product_cat2?: string | null
  product_cat3?: string | null
  product_cat4?: string | null
  product_unitprice_ati?: number | string | null
  product_unitprice_tf?: number | string | null
  product_availability?: string | null
  product_price_type?: string | null
  product_discount_type?: string | null
  product_discount_amount?: number | string | null
  event?: string
  event_name?: string
}

type GifiJsonLdProduct = {
  '@type'?: string | string[]
  name?: string
  description?: string | null
  sku?: string
  image?: string | string[]
  offers?: {
    url?: string
    price?: number | string
    priceCurrency?: string
    availability?: string
  }
}

type GifiScrapeResult = {
  offers: ScrapedOffer[]
  issues: ScrapeIssue[]
  coverage: {
    discoveredListings: number
    completedListings: number
    collectionRate: number
    isComplete: boolean
  }
}

let cachedCategoryUrlsPromise: Promise<string[]> | null = null
let cachedProductUrlsPromise: Promise<string[]> | null = null

function createIssue(code: string, message: string, url?: string, page?: number): ScrapeIssue {
  return {
    retailer: 'gifi',
    code,
    message,
    url,
    page,
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseLocs(xml: string) {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((match) => match[1] || '').filter(Boolean)
}

function normalizeAvailability(value: string | null | undefined) {
  const text = cleanDisplayText(value)
  if (!text) return undefined

  const normalized = text.toLowerCase()
  if (normalized.includes('outofstock')) {
    return 'Rupture de stock'
  }

  if (normalized.includes('rupture') || normalized.includes('indispon')) {
    return 'Rupture de stock'
  }

  if (normalized.includes('stock') || normalized.includes('magasin')) {
    return 'En stock'
  }

  return text
}

function safeParseJson<T>(value: string | null | undefined): T | null {
  if (!value) return null

  try {
    return JSON.parse(value) as T
  } catch (_error) {
    return null
  }
}

function flattenJsonLd(value: unknown): unknown[] {
  if (!value) return []

  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenJsonLd(item))
  }

  if (typeof value === 'object') {
    const objectValue = value as Record<string, unknown>
    if (Array.isArray(objectValue['@graph'])) {
      return objectValue['@graph'].flatMap((item) => flattenJsonLd(item))
    }
    return [value]
  }

  return []
}

function isProductJsonLd(value: unknown): value is GifiJsonLdProduct {
  if (!value || typeof value !== 'object') return false

  const entry = value as GifiJsonLdProduct
  const typeValue = entry['@type']
  return (
    typeValue === 'Product' ||
    (Array.isArray(typeValue) && typeValue.includes('Product')) ||
    typeof entry.name === 'string'
  )
}

function extractFirstText($: CheerioAPI, selectors: string[]) {
  for (const selector of selectors) {
    const element = $(selector).first()
    const text = cleanDisplayText(element.text() || element.attr('content'))
    if (text) return text
  }

  return ''
}

function extractSrcsetUrl(srcset: string | undefined | null) {
  const cleaned = cleanDisplayText(srcset)
  if (!cleaned) return ''

  const firstEntry = cleaned.split(',')[0]?.trim()
  if (!firstEntry) return ''

  return firstEntry.split(/\s+/)[0] || ''
}

function parseGifiPriceText(value: string | null | undefined): number | null {
  const cleaned = cleanDisplayText(value)
  if (!cleaned) return null

  const normalized = cleaned.replace(/\s/g, '').replace(',', '.')
  const match = normalized.match(/(\d+(?:\.\d{1,2})?)/)
  return match ? toValidPrice(match[1]) : null
}

function parsePriceFromTile($: CheerioAPI, tileSelector: string) {
  const tile = $(tileSelector)

  const srOnly = cleanDisplayText(tile.find('.price .sr-only').first().text())
  const parsedSrOnly = parseGifiPriceText(srOnly)
  if (parsedSrOnly !== null) {
    return parsedSrOnly
  }

  const integer =
    cleanDisplayText(tile.find('.formatted-price__before-decimal').first().attr('data-integer')) ||
    cleanDisplayText(tile.find('.formatted-price__before-decimal').first().text())
  const decimal =
    cleanDisplayText(tile.find('.formatted-price__after-decimal--value').first().attr('data-decimal')) ||
    cleanDisplayText(tile.find('.formatted-price__after-decimal--value').first().text())

  if (integer && decimal) {
    return parseGifiPriceText(`${integer},${decimal}`)
  }

  const priceBlock = cleanDisplayText(tile.find('.formatted-price').first().text())
  return parseGifiPriceText(priceBlock)
}

function parseDataGtm(value: string | null | undefined): GifiGtmData | null {
  const parsed = safeParseJson<GifiGtmData>(value)
  if (parsed) return parsed

  return null
}

function extractDataGtm($: CheerioAPI, selectors: string[]) {
  for (const selector of selectors) {
    const value = $(selector).attr('data-gtm')
    const parsed = parseDataGtm(value)
    if (parsed) return parsed
  }

  return null
}

function extractCategoryPathFromGtm(gtm: GifiGtmData | null) {
  return [gtm?.product_cat1, gtm?.product_cat2, gtm?.product_cat3, gtm?.product_cat4].filter(Boolean).join(' | ')
}

function buildNativeCategoryLabel($: CheerioAPI) {
  return (
    extractFirstText($, [
      'h1',
      '[data-testid="page-title"]',
      '.page-title',
      '.product-detail h1',
      'meta[property="og:title"]',
    ]) || ''
  )
}

function buildProductImage($: CheerioAPI, selectors: string[]) {
  for (const selector of selectors) {
    const element = $(selector).first()
    const src = cleanDisplayText(element.attr('src'))
    const dataSrc = cleanDisplayText(element.attr('data-src'))
    const srcset = extractSrcsetUrl(element.attr('srcset'))
    const candidate = src || dataSrc || srcset
    if (candidate) {
      return toAbsoluteUrl(candidate, GIFI_BASE_URL)
    }
  }

  return ''
}

function normalizeJsonLdImage(image: string | string[] | undefined) {
  if (!image) return ''
  return Array.isArray(image) ? cleanDisplayText(image[0]) : cleanDisplayText(image)
}

function buildOfferFromTile($: CheerioAPI, tileSelector: string, pageUrl: string): ScrapedOffer | null {
  const tile = $(tileSelector)
  const pid = cleanDisplayText(tile.attr('data-pid'))
  const gtm = extractDataGtm($, [
    `${tileSelector} .gtm-button[data-gtm]`,
    `${tileSelector} img[data-gtm]`,
    `${tileSelector} [data-gtm]`,
  ])
  const sourceUrl = toAbsoluteUrl(
    tile.find('a.link[href]').first().attr('href') || tile.find('a[href$=".html"]').first().attr('href'),
    GIFI_BASE_URL,
  )
  const name = cleanDisplayText(
    tile.find('.pdp-link a.link').first().text() ||
      tile.find('a.link').first().text() ||
      tile.find('img[alt]').first().attr('alt') ||
      gtm?.product_name,
  )
  const price = parsePriceFromTile($, tileSelector)

  if (!pid || !sourceUrl || !name || price === null) {
    return null
  }

  const sourceCategoryPath = extractCategoryPathFromGtm(gtm) || pageUrl
  const availability = normalizeAvailability(gtm?.product_availability)
  const brand = cleanDisplayText(gtm?.product_brand)
  const image = buildProductImage($, [
    `${tileSelector} img`,
    `${tileSelector} source`,
  ])
  const quantity =
    cleanDisplayText(
      tile
        .find('.price-per-unit, .product-unitprice, .product-quantity, .quantity')
        .first()
        .text(),
    ) || undefined

  const categoryResolution = resolveScrapedOfferCategory({
    retailer: 'gifi',
    sourceUrl,
    sourceCategoryPath,
    nativeCategory: extractCategoryPathFromGtm(gtm) || buildNativeCategoryLabel($),
    name,
    brand,
    availability,
    tags: [gtm?.product_cat1, gtm?.product_cat2, gtm?.product_cat3, gtm?.product_cat4, quantity],
  })

  return {
    retailer: 'gifi',
    sourceProductId: pid,
    sourceUrl,
    sourceCategoryPath,
    category: categoryResolution.category,
    categoryResolution,
    name,
    brand: brand || undefined,
    price,
    image,
    availability,
    quantity,
  }
}

function extractJsonLdProduct($: CheerioAPI, pageUrl: string): GifiJsonLdProduct | null {
  const scripts = $('script[type="application/ld+json"]').toArray()

  for (const script of scripts) {
    const raw = cleanDisplayText($(script).text())
    if (!raw) continue

    const parsed = safeParseJson<unknown>(raw)
    for (const candidate of flattenJsonLd(parsed)) {
      if (isProductJsonLd(candidate)) {
        return candidate
      }
    }
  }

  const fallback = extractDataGtm($, [
    '.add-to-cart-url[data-gtm]',
    'input.add-to-cart-url[data-gtm]',
    '[data-gtm*="product_id"]',
  ])

  if (fallback) {
    return {
      name: fallback.product_name,
      sku: fallback.product_sku || fallback.product_id,
      description: undefined,
      image: undefined,
      offers: {
        url: pageUrl,
        price: fallback.product_unitprice_ati ?? undefined,
        availability: fallback.product_availability ?? undefined,
      },
    }
  }

  return null
}

function buildOfferFromProductPage($: CheerioAPI, pageUrl: string): ScrapedOffer | null {
  const jsonLd = extractJsonLdProduct($, pageUrl)
  const gtm = extractDataGtm($, [
    '.add-to-cart-url[data-gtm]',
    'input.add-to-cart-url[data-gtm]',
    '.gtm-button[data-gtm]',
    '[data-gtm*="product_id"]',
  ])
  const productName =
    cleanDisplayText(jsonLd?.name) ||
    cleanDisplayText(gtm?.product_name) ||
    extractFirstText($, ['h1', '.product-name', '[itemprop="name"]'])
  const sourceProductId =
    cleanDisplayText(jsonLd?.sku) ||
    cleanDisplayText(gtm?.product_sku) ||
    cleanDisplayText(gtm?.product_id) ||
    cleanDisplayText(new URL(pageUrl).pathname.split('/').filter(Boolean).at(-1))
  const price =
    parseGifiPriceText(String(jsonLd?.offers?.price || '')) ||
    parseGifiPriceText(cleanDisplayText($('[data-decimal]').first().closest('.formatted-price').text())) ||
    parseGifiPriceText(cleanDisplayText($('.price .sr-only').first().text()))
  const sourceUrl = toAbsoluteUrl(jsonLd?.offers?.url || pageUrl) || pageUrl

  if (!productName || !sourceProductId || !sourceUrl || price === null) {
    return null
  }

  const description =
    cleanDisplayText(jsonLd?.description || '') ||
    cleanDisplayText(
      $('.product-description')
        .text()
        .replace(/\s+/g, ' ')
        .trim(),
    ) ||
    undefined
  const image =
    toAbsoluteUrl(normalizeJsonLdImage(jsonLd?.image), GIFI_BASE_URL) ||
    buildProductImage($, ['.c-pdp__main-image__main--img', '.product-detail img', 'img'])
  const availability = normalizeAvailability(
    cleanDisplayText(jsonLd?.offers?.availability) || gtm?.product_availability || undefined,
  )
  const sourceCategoryPath = extractCategoryPathFromGtm(gtm) || pageUrl
  const categoryResolution = resolveScrapedOfferCategory({
    retailer: 'gifi',
    sourceUrl,
    sourceCategoryPath,
    nativeCategory: extractCategoryPathFromGtm(gtm) || buildNativeCategoryLabel($),
    name: productName,
    description,
    availability,
    tags: [gtm?.product_cat1, gtm?.product_cat2, gtm?.product_cat3, gtm?.product_cat4],
  })

  return {
    retailer: 'gifi',
    sourceProductId,
    sourceUrl,
    sourceCategoryPath,
    category: categoryResolution.category,
    categoryResolution,
    name: productName,
    brand: cleanDisplayText(gtm?.product_brand) || undefined,
    price,
    image,
    description,
    availability,
    quantity: extractQuantity(description || productName) || undefined,
  }
}

function dedupeBySourceProductId(offers: ScrapedOffer[]) {
  const seen = new Set<string>()
  const deduped: ScrapedOffer[] = []

  for (const offer of offers) {
    const key = offer.sourceProductId || offer.sourceUrl
    if (seen.has(key)) continue
    seen.add(key)
    deduped.push(offer)
  }

  return deduped
}

async function fetchTextWithRetry(url: string, attempts = GIFI_MAX_RETRIES) {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), GIFI_REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          accept: 'text/html,application/xml;q=0.9,*/*;q=0.8',
          'user-agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        },
      })

      const text = await response.text()
      clearTimeout(timeoutId)

      if (response.ok) {
        return text
      }

      const retryable = response.status === 429 || response.status >= 500
      lastError = new Error(`GIFI responded with ${response.status} for ${url}`)

      if (!retryable || attempt >= attempts) {
        throw lastError
      }

      const retryAfter = response.headers.get('retry-after')
      const retryAfterMs = retryAfter ? Number.parseInt(retryAfter, 10) * 1000 : null
      await sleep(Math.min(retryAfterMs || 1000 * 2 ** (attempt - 1), 30000))
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt >= attempts) {
        throw lastError
      }

      await sleep(Math.min(1000 * 2 ** (attempt - 1), 30000))
    }
  }

  throw lastError || new Error(`Unable to fetch ${url}`)
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<R>,
) {
  const results: R[] = new Array(items.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      results[currentIndex] = await mapper(items[currentIndex], currentIndex)
    }
  }

  const workerCount = Math.max(1, Math.min(limit, items.length))
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
  return results
}

async function fetchCategoryUrls() {
  if (!cachedCategoryUrlsPromise) {
    cachedCategoryUrlsPromise = (async () => {
      const indexXml = await fetchTextWithRetry(GIFI_SITEMAP_INDEX_URL)
      const categorySitemapUrl = parseLocs(indexXml).find((url) => url.endsWith('sitemap_5-category.xml'))

      if (!categorySitemapUrl) {
        return []
      }

      const categoryXml = await fetchTextWithRetry(categorySitemapUrl)
      return Array.from(new Set(parseLocs(categoryXml))).filter((url) => url.startsWith(GIFI_BASE_URL))
    })()
  }

  return cachedCategoryUrlsPromise
}

async function fetchProductUrls() {
  if (!cachedProductUrlsPromise) {
    cachedProductUrlsPromise = (async () => {
      const urls = await Promise.all(
        GIFI_PRODUCT_SITEMAP_URLS.map(async (sitemapUrl) => {
          const xml = await fetchTextWithRetry(sitemapUrl)
          return parseLocs(xml)
        }),
      )

      return Array.from(new Set(urls.flat())).filter((url) => url.startsWith(GIFI_BASE_URL))
    })()
  }

  return cachedProductUrlsPromise
}

function pageCountFromCategoryHtml(html: string) {
  const $ = load(html)
  const lastPageLink = $('ul.product-grid-pagination--desktop li.pagination-item--last a[data-page]').attr('data-page')
    || $('ul.product-grid-pagination--mobile li.pagination-item--last a[data-page]').attr('data-page')
  const parsed = Number.parseInt(lastPageLink || '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1
}

export function extractGifiCategoryPageOffers(html: string, pageUrl: string) {
  const $ = load(html)
  const offers: ScrapedOffer[] = []

  for (const tile of $('div.product[data-pid]').toArray()) {
    const offer = buildOfferFromTile($, `[data-pid="${cleanDisplayText($(tile).attr('data-pid'))}"]`, pageUrl)
    if (offer) {
      offers.push(offer)
    }
  }

  return dedupeBySourceProductId(offers)
}

export function extractGifiProductPageOffer(html: string, pageUrl: string) {
  const $ = load(html)
  return buildOfferFromProductPage($, pageUrl)
}

export function parseGifiPrice(value: string) {
  return parseGifiPriceText(value)
}

async function scrapeCategoryPage(pageUrl: string, pageNumber: number) {
  const targetUrl = pageNumber > 1 ? `${pageUrl}${pageUrl.includes('?') ? '&' : '?'}page=${pageNumber}` : pageUrl
  const html = await fetchTextWithRetry(targetUrl)
  const offers = extractGifiCategoryPageOffers(html, targetUrl)

  return {
    offers,
    completed: offers.length > 0,
    pageCount: pageCountFromCategoryHtml(html),
    pageUrl: targetUrl,
  }
}

async function scrapeSearchProducts(searchQuery: string) {
  const normalizedQuery = cleanDisplayText(searchQuery)
  const normalizedTokens = normalizedQuery
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s/-]/g, ' ')
    .replace(/[/-]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 1)

  const productUrls = await fetchProductUrls()
  const candidateUrls = productUrls
    .filter((url) => {
      const slug = cleanDisplayText(new URL(url).pathname)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s/-]/g, ' ')
        .replace(/[/-]/g, ' ')
        .trim()

      if (!slug) return false
      if (normalizedTokens.length === 0) return true
      return normalizedTokens.every((token) => slug.includes(token))
    })
    .slice(0, GIFI_MAX_SEARCH_RESULTS)

  const results = await mapWithConcurrency(candidateUrls, GIFI_SEARCH_CONCURRENCY, async (url) => {
    try {
      const html = await fetchTextWithRetry(url)
      return {
        offer: extractGifiProductPageOffer(html, url),
        issue: null as ScrapeIssue | null,
      }
    } catch (error) {
      return {
        offer: null as ScrapedOffer | null,
        issue: createIssue(
          'product_page_error',
          `Failed to scrape GIFI product page ${url}: ${error instanceof Error ? error.message : String(error)}`,
          url,
        ),
      }
    }
  })

  const offers: ScrapedOffer[] = []
  const issues: ScrapeIssue[] = []
  let completedListings = 0

  for (const result of results) {
    completedListings += 1
    if (result.offer) {
      offers.push(result.offer)
    }
    if (result.issue) {
      issues.push(result.issue)
    }
  }

  const filteredOffers = dedupeBySourceProductId(filterOffersByQuery(offers, normalizedQuery))

  return {
    offers: filteredOffers,
    issues,
    coverage: {
      discoveredListings: candidateUrls.length,
      completedListings,
      collectionRate: candidateUrls.length === 0 ? 0 : Math.round((completedListings / candidateUrls.length) * 100),
      isComplete: issues.length === 0 && candidateUrls.length > 0 && completedListings === candidateUrls.length,
    },
  }
}

export async function scrapeGifiProductsDetailed(searchQuery?: string): Promise<RetailerScrapeDetails> {
  const issues: ScrapeIssue[] = []

  try {
    if (searchQuery) {
      const result = await scrapeSearchProducts(searchQuery)
      return {
        retailer: 'gifi',
        offers: result.offers,
        issues: result.issues,
        coverage: result.coverage,
      }
    }

    const allCategoryUrls = await fetchCategoryUrls()
    const discoveredCategoryUrls = allCategoryUrls.filter((url) => {
      const resolution = resolveScrapedOfferCategory({
        retailer: 'gifi',
        sourceUrl: url,
        sourceCategoryPath: url,
        name: url,
      })

      return resolution.source !== 'fallback' || resolution.confidence !== 'fallback'
    })

    const categoryResults = await mapWithConcurrency(discoveredCategoryUrls, GIFI_CATEGORY_CONCURRENCY, async (categoryUrl) => {
      try {
        const offers: ScrapedOffer[] = []
        const firstPage = await scrapeCategoryPage(categoryUrl, 1)
        offers.push(...firstPage.offers)

        const totalPages = Math.min(firstPage.pageCount, GIFI_MAX_CATEGORY_PAGES)
        let discoveredListings = 1
        let completedListings = 1

        for (let pageNumber = 2; pageNumber <= totalPages; pageNumber += 1) {
          discoveredListings += 1
          const pageResult = await scrapeCategoryPage(categoryUrl, pageNumber)
          completedListings += 1
          offers.push(...pageResult.offers)
        }

        return {
          categoryUrl,
          offers: dedupeBySourceProductId(offers),
          issues: [] as ScrapeIssue[],
          discoveredListings,
          completedListings,
        }
      } catch (error) {
        return {
          categoryUrl,
          offers: [] as ScrapedOffer[],
          issues: [
            createIssue(
              'category_page_error',
              `Failed to scrape GIFI category ${categoryUrl}: ${error instanceof Error ? error.message : String(error)}`,
              categoryUrl,
            ),
          ],
          discoveredListings: 1,
          completedListings: 0,
        }
      }
    })

    const offers: ScrapedOffer[] = []
    const seenUrls = new Set<string>()
    let completedListings = 0
    let discoveredListings = 0

    for (const categoryResult of categoryResults) {
      discoveredListings += categoryResult.discoveredListings
      completedListings += categoryResult.completedListings
      issues.push(...categoryResult.issues)

      for (const offer of categoryResult.offers) {
        if (seenUrls.has(offer.sourceUrl)) continue
        seenUrls.add(offer.sourceUrl)
        offers.push(offer)
      }
    }

    return {
      retailer: 'gifi',
      offers: dedupeBySourceProductId(offers),
      issues,
      coverage: {
        discoveredListings,
        completedListings,
        collectionRate: discoveredListings === 0 ? 0 : Math.round((completedListings / discoveredListings) * 100),
        isComplete: issues.length === 0 && discoveredListings > 0 && completedListings === discoveredListings,
      },
    }
  } catch (error) {
    issues.push(
      createIssue(
        'scraper_error',
        `GIFI scraper failed: ${error instanceof Error ? error.message : String(error)}`,
      ),
    )

    return {
      retailer: 'gifi',
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

export async function scrapeGifiProducts(searchQuery?: string): Promise<ScrapedOffer[]> {
  const result = await scrapeGifiProductsDetailed(searchQuery)
  return result.offers
}
