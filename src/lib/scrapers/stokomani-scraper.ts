import { load } from 'cheerio'

import {
  cleanDisplayText,
  ensureUnitPriceText,
  extractQuantity,
  filterOffersByQuery,
  normalizeRetailerBrand,
  normalizeRetailerProductName,
  resolveScrapedOfferCategory,
  toAbsoluteUrl,
  toValidPrice,
} from '../scraper-utils'
import { enrichOffersFromProductPages, isSpecificQuantity } from './product-page-details'
import type { RetailerScrapeDetails, ScrapeIssue, ScrapedOffer } from '../types'

const STOKOMANI_BASE_URL = 'https://www.stokomani.fr'
const STOKOMANI_PAGE_LIMIT = 250
const STOKOMANI_MAX_PAGES = 100
const STOKOMANI_RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504])
const STOKOMANI_MAX_HTTP_ATTEMPTS = 5
const STOKOMANI_BASE_RETRY_DELAY_MS = 1200
const STOKOMANI_DEFAULT_REQUEST_TIMEOUT_MS = 15000

type ShopifyVariant = {
  price?: unknown
  compare_at_price?: unknown
  unit_price?: unknown
  unit_price_measurement?: {
    reference_value?: number
    reference_unit?: string
  }
}

type ShopifyProduct = {
  id?: number | string
  title?: string
  vendor?: string
  handle?: string
  url?: string
  body_html?: string
  body?: string
  product_type?: string
  tags?: string[] | string
  image?: string
  featured_image?: string
  images?: Array<{ src?: string }>
  available?: boolean
  price?: unknown
  compare_at_price?: unknown
  variants?: ShopifyVariant[]
}

function normalizeShopifyMoney(value: unknown): number | null {
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value <= 0) return null
    return value > 999 ? Math.round(value) / 100 : Math.round(value * 100) / 100
  }

  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed) return null

  const parsed = Number.parseFloat(trimmed.replace(',', '.'))
  if (!Number.isFinite(parsed) || parsed <= 0) return null

  if (!/[.,]/.test(trimmed) && parsed > 999) {
    return Math.round(parsed) / 100
  }

  return Math.round(parsed * 100) / 100
}

function stripHtml(value: string | null | undefined): string {
  return cleanDisplayText(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function getTagsText(tags: ShopifyProduct['tags']) {
  if (Array.isArray(tags)) return tags.join(' ')
  return cleanDisplayText(tags)
}

function buildCanonicalUrl(product: ShopifyProduct) {
  if (product.url) {
    return toAbsoluteUrl(product.url, STOKOMANI_BASE_URL)
  }

  if (product.handle) {
    return `${STOKOMANI_BASE_URL}/products/${product.handle}`
  }

  return ''
}

function buildImageUrl(product: ShopifyProduct) {
  return (
    toAbsoluteUrl(product.images?.[0]?.src, STOKOMANI_BASE_URL) ||
    toAbsoluteUrl(product.image, STOKOMANI_BASE_URL) ||
    toAbsoluteUrl(product.featured_image, STOKOMANI_BASE_URL) ||
    ''
  )
}

function buildCollectionProductsUrl(collectionUrl: string, pageNumber: number) {
  const parsed = new URL(collectionUrl)
  parsed.search = ''
  parsed.hash = ''
  const baseUrl = parsed.toString().replace(/\/+$/, '')
  return `${baseUrl}/products.json?limit=${STOKOMANI_PAGE_LIMIT}&page=${pageNumber}`
}

function buildUnitPriceText(variant: ShopifyVariant | undefined, fallbackPrice: number, quantity: string | undefined) {
  const unitPrice = normalizeShopifyMoney(variant?.unit_price)
  const referenceValue = variant?.unit_price_measurement?.reference_value
  const referenceUnit = cleanDisplayText(variant?.unit_price_measurement?.reference_unit).toLowerCase()

  if (unitPrice !== null && referenceUnit) {
    const label = referenceValue && referenceValue !== 1 ? `/${referenceValue}${referenceUnit}` : `/${referenceUnit}`
    return `${unitPrice.toFixed(2).replace('.', ',')}€${label}`
  }

  return ensureUnitPriceText(undefined, fallbackPrice, quantity)
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function readPositiveIntegerEnv(name: string) {
  const value = process.env[name]
  if (!value) return null

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function getRequestTimeoutMs() {
  return readPositiveIntegerEnv('STOKOMANI_REQUEST_TIMEOUT_MS') || STOKOMANI_DEFAULT_REQUEST_TIMEOUT_MS
}

function getFullEnrichmentLimit() {
  return readPositiveIntegerEnv('STOKOMANI_FULL_ENRICHMENT_LIMIT') || 0
}

function createIssue(code: string, message: string, url?: string, page?: number): ScrapeIssue {
  return {
    retailer: 'stokomani',
    code,
    message,
    url,
    page,
  }
}

function parseRetryAfterMs(headerValue: string | null) {
  if (!headerValue) return null

  const numeric = Number.parseInt(headerValue, 10)
  if (Number.isFinite(numeric) && numeric >= 0) {
    return numeric * 1000
  }

  const retryDateMs = Date.parse(headerValue)
  if (Number.isFinite(retryDateMs)) {
    const delta = retryDateMs - Date.now()
    return delta > 0 ? delta : 0
  }

  return null
}

async function fetchTextWithRetry(url: string, acceptHeader: string): Promise<string> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= STOKOMANI_MAX_HTTP_ATTEMPTS; attempt += 1) {
    await sleep(250)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), getRequestTimeoutMs())

    try {
      const response = await fetch(url, {
        headers: {
          Accept: acceptHeader,
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
        signal: controller.signal,
      })
      const text = await response.text()

      if (response.ok) {
        return text
      }

      const retryable = STOKOMANI_RETRYABLE_STATUSES.has(response.status)
      lastError = new Error(`Stokomani responded with ${response.status} for ${url}`)

      if (!retryable || attempt >= STOKOMANI_MAX_HTTP_ATTEMPTS) {
        throw lastError
      }

      const retryAfterMs = parseRetryAfterMs(response.headers.get('retry-after'))
      const backoffMs = retryAfterMs ?? STOKOMANI_BASE_RETRY_DELAY_MS * 2 ** (attempt - 1)
      await sleep(Math.min(backoffMs, 30000))
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt >= STOKOMANI_MAX_HTTP_ATTEMPTS) {
        throw lastError
      }

      await sleep(Math.min(STOKOMANI_BASE_RETRY_DELAY_MS * 2 ** (attempt - 1), 30000))
    } finally {
      clearTimeout(timeout)
    }
  }

  throw lastError || new Error(`Unable to fetch Stokomani endpoint: ${url}`)
}

async function fetchJson<T>(url: string): Promise<T> {
  const text = await fetchTextWithRetry(url, 'application/json, text/plain, */*')
  return JSON.parse(text) as T
}

async function fetchHtml(url: string): Promise<string> {
  return fetchTextWithRetry(url, 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8')
}

function buildOfferFromProduct(product: ShopifyProduct): ScrapedOffer | null {
  const brand = normalizeRetailerBrand('stokomani', product.vendor)
  const title = normalizeRetailerProductName('stokomani', product.title)
  const description = stripHtml(product.body_html || product.body)
  const finalName =
    brand && title && !title.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${title}` : title || brand || ''
  const sourceUrl = buildCanonicalUrl(product)
  const sourceProductId = product.id ? String(product.id) : cleanDisplayText(product.handle)
  const variant = product.variants?.[0]
  const price = normalizeShopifyMoney(variant?.price ?? product.price)

  if (!finalName || !sourceUrl || !sourceProductId || price === null) {
    return null
  }

  const sourceCategoryPath = [product.product_type, getTagsText(product.tags), product.handle].filter(Boolean).join(' | ')
  const categoryResolution = resolveScrapedOfferCategory({
    retailer: 'stokomani',
    sourceUrl,
    sourceCategoryPath,
    nativeCategory: cleanDisplayText(product.product_type),
    name: finalName,
    brand,
    description,
    availability: product.available === false ? 'Rupture de stock' : 'En stock',
    tags: Array.isArray(product.tags) ? product.tags : [getTagsText(product.tags), product.handle],
  })
  const category = categoryResolution.category

  const originalPrice = normalizeShopifyMoney(variant?.compare_at_price ?? product.compare_at_price)
  const quantity = extractQuantity(`${finalName} ${description}`) || undefined
  const unitPrice = buildUnitPriceText(variant, price, quantity)
  const discount =
    originalPrice !== null && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : undefined

  return {
    retailer: 'stokomani',
    sourceProductId,
    sourceUrl,
    sourceCategoryPath,
    category,
    categoryResolution,
    name: finalName,
    brand: brand || undefined,
    price,
    image: buildImageUrl(product),
    description: description || undefined,
    availability: product.available === false ? 'Rupture de stock' : 'En stock',
    quantity,
    unitPrice,
    originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
    isOnPromotion: originalPrice !== null && originalPrice > price ? true : undefined,
    discount,
  }
}

function extractStokomaniCollectionUrls(html: string) {
  const $ = load(html)
  const urls = new Set<string>()

  $('a[href*="/collections/"]').each((_, element) => {
    const href = cleanDisplayText($(element).attr('href'))
    if (!href) return

    const absolute = toAbsoluteUrl(href, STOKOMANI_BASE_URL)
    if (absolute) {
      urls.add(absolute.replace(/\/+$/, ''))
    }
  })

  return Array.from(urls)
}

async function scrapeStokomaniCollection(collectionUrl: string) {
  const offers: ScrapedOffer[] = []
  const catalogUrl = buildCollectionProductsUrl(collectionUrl, 1)

  try {
    const data = await fetchJson<{ products?: ShopifyProduct[] }>(catalogUrl)
    const products = data.products || []

    for (const product of products) {
      const offer = buildOfferFromProduct(product)
      if (offer) {
        offers.push({
          ...offer,
          isOnPromotion: true,
        })
      }
    }
  } catch (error) {
    return {
      offers,
      discoveredListings: 1,
      completedListings: 0,
      issue: createIssue(
        'api_error',
        `Failed to fetch Stokomani collection page 1: ${error instanceof Error ? error.message : String(error)}`,
        catalogUrl,
        1,
      ),
    }
  }

  return {
    offers,
    discoveredListings: 1,
    completedListings: 1,
    issue: undefined,
  }
}

async function enrichStokomaniOffers(offers: ScrapedOffer[]) {
  const limit = getFullEnrichmentLimit()
  if (limit <= 0) {
    return offers
  }

  const candidateCount = Math.min(limit, offers.length)
  const enriched = await enrichOffersFromProductPages(
    offers.slice(0, candidateCount),
    (offer) => !isSpecificQuantity(offer.quantity),
    2,
  )

  return [...enriched, ...offers.slice(candidateCount)]
}

export async function scrapeStokomaniProductsDetailed(searchQuery?: string): Promise<RetailerScrapeDetails> {
  const offers: ScrapedOffer[] = []
  const issues: ScrapeIssue[] = []
  let discoveredListings = 0
  let completedListings = 0

  try {
    try {
      await fetchHtml(STOKOMANI_BASE_URL)
    } catch (error) {
      issues.push(
        createIssue(
          'navigation_error',
          `Failed to open Stokomani homepage: ${error instanceof Error ? error.message : String(error)}`,
          STOKOMANI_BASE_URL,
        ),
      )
    }

    if (searchQuery) {
      discoveredListings = 1
      const searchUrl = `${STOKOMANI_BASE_URL}/search/suggest.json?q=${encodeURIComponent(searchQuery)}&resources[type]=product`

      try {
        const data = await fetchJson<{ resources?: { results?: { products?: ShopifyProduct[] } } }>(searchUrl)
        const searchResults = data.resources?.results?.products || []

        for (const product of searchResults) {
          const offer = buildOfferFromProduct(product)
          if (offer) {
            offers.push(offer)
          }
        }

        completedListings = 1
      } catch (error) {
        issues.push(
          createIssue(
            'api_error',
            `Failed to fetch Stokomani search results: ${error instanceof Error ? error.message : String(error)}`,
            searchUrl,
          ),
        )
      }

      const filteredOffers = filterOffersByQuery(offers, searchQuery)
      const enrichedOffers = await enrichOffersFromProductPages(filteredOffers, (offer) => !isSpecificQuantity(offer.quantity), 2)

      return {
        retailer: 'stokomani',
        offers: enrichedOffers,
        issues,
        coverage: {
          discoveredListings,
          completedListings,
          collectionRate: discoveredListings === 0 ? 0 : Math.round((completedListings / discoveredListings) * 100),
          isComplete: issues.length === 0 && discoveredListings > 0 && completedListings === discoveredListings,
        },
      }
    }

    let pageNumber = 1
    let safetyLimitReached = false

    while (pageNumber <= STOKOMANI_MAX_PAGES) {
      const catalogUrl = `${STOKOMANI_BASE_URL}/products.json?limit=${STOKOMANI_PAGE_LIMIT}&page=${pageNumber}`
      discoveredListings += 1

      try {
        const data = await fetchJson<{ products?: ShopifyProduct[] }>(catalogUrl)
        const products = data.products || []

        completedListings += 1

        if (products.length === 0) {
          break
        }

        for (const product of products) {
          const offer = buildOfferFromProduct(product)
          if (offer) {
            offers.push(offer)
          }
        }

        if (pageNumber === STOKOMANI_MAX_PAGES) {
          safetyLimitReached = true
        }
      } catch (error) {
        issues.push(
          createIssue(
            'api_error',
            `Failed to fetch Stokomani catalog page ${pageNumber}: ${error instanceof Error ? error.message : String(error)}`,
            catalogUrl,
            pageNumber,
          ),
        )
        break
      }

      pageNumber += 1
      await sleep(800)
    }

    if (safetyLimitReached) {
      issues.push(
        createIssue(
          'max_pages_reached',
          `Reached safety page limit while scraping Stokomani catalog`,
          `${STOKOMANI_BASE_URL}/products.json`,
          pageNumber,
        ),
      )
    }

    const enrichedOffers = await enrichStokomaniOffers(offers)

    return {
      retailer: 'stokomani',
      offers: enrichedOffers,
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
        `Stokomani scraper failed: ${error instanceof Error ? error.message : String(error)}`,
      ),
    )

    return {
      retailer: 'stokomani',
      offers,
      issues,
      coverage: {
        discoveredListings,
        completedListings,
        collectionRate: discoveredListings === 0 ? 0 : Math.round((completedListings / discoveredListings) * 100),
        isComplete: false,
      },
    }
  }
}

export async function scrapeStokomaniProducts(searchQuery?: string): Promise<ScrapedOffer[]> {
  const result = await scrapeStokomaniProductsDetailed(searchQuery)
  return result.offers
}

export async function scrapeStokomaniCategory(category: string) {
  const products = await scrapeStokomaniProducts()
  return products.filter((product) => product.category === category)
}

export async function scrapeStokomaniDealsDetailed(): Promise<RetailerScrapeDetails> {
  const offers: ScrapedOffer[] = []
  const issues: ScrapeIssue[] = []
  let discoveredListings = 0
  let completedListings = 0

  try {
    const dealsUrl = 'https://www.stokomani.fr/pages/conditions-et-offres-promotionnelles'
    const html = await fetchHtml(dealsUrl)
    const collectionUrls = extractStokomaniCollectionUrls(html)
    discoveredListings = collectionUrls.length

    for (const collectionUrl of collectionUrls) {
      const result = await scrapeStokomaniCollection(collectionUrl)
      if (result.issue) {
        issues.push(result.issue)
      }

      completedListings += result.completedListings
      offers.push(...result.offers)
    }
  } catch (error) {
    issues.push(
      createIssue(
        'scraper_error',
        `Stokomani deals scraper failed: ${error instanceof Error ? error.message : String(error)}`,
        'https://www.stokomani.fr/pages/conditions-et-offres-promotionnelles',
      ),
    )
  }

  return {
    retailer: 'stokomani',
    offers,
    issues,
    coverage: {
      discoveredListings,
      completedListings,
      collectionRate: discoveredListings === 0 ? 0 : Math.round((completedListings / discoveredListings) * 100),
      isComplete: issues.length === 0 && discoveredListings > 0 && completedListings > 0,
    },
  }
}
