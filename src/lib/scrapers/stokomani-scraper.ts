import { chromium, type Page } from 'playwright'

import {
  cleanDisplayText,
  ensureUnitPriceText,
  extractQuantity,
  filterOffersByQuery,
  resolveOfferCategory,
  toAbsoluteUrl,
  toValidPrice,
} from '../scraper-utils'
import { enrichOffersFromProductPages, isSpecificQuantity } from './product-page-details'
import type { ScrapedOffer } from '../types'

const STOKOMANI_BASE_URL = 'https://www.stokomani.fr'
const STOKOMANI_PAGE_LIMIT = 250
const STOKOMANI_MAX_PAGES = 100
const STOKOMANI_RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504])
const STOKOMANI_MAX_HTTP_ATTEMPTS = 5
const STOKOMANI_BASE_RETRY_DELAY_MS = 1200

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

function resolveStokomaniCategory(product: ShopifyProduct, finalName: string, description: string) {
  return resolveOfferCategory({
    sourceCategoryPath: [product.product_type, getTagsText(product.tags), product.handle].filter(Boolean).join(' '),
    textValues: [finalName, description],
  })
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
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

function buildOfferFromProduct(product: ShopifyProduct): ScrapedOffer | null {
  const brand = cleanDisplayText(product.vendor)
  const title = cleanDisplayText(product.title)
  const description = stripHtml(product.body_html || product.body)
  const finalName = brand && !title.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${title}` : title
  const sourceUrl = buildCanonicalUrl(product)
  const sourceProductId = product.id ? String(product.id) : cleanDisplayText(product.handle)
  const variant = product.variants?.[0]
  const price = normalizeShopifyMoney(variant?.price ?? product.price)

  if (!finalName || !sourceUrl || !sourceProductId || price === null) {
    return null
  }

  const category = resolveStokomaniCategory(product, finalName, description)
  if (!category) {
    return null
  }

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
    sourceCategoryPath: [product.product_type, getTagsText(product.tags)].filter(Boolean).join(' | '),
    category,
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

async function fetchJson<T>(page: Page, url: string): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= STOKOMANI_MAX_HTTP_ATTEMPTS; attempt += 1) {
    try {
      await sleep(250)

      const result = await page.evaluate(async (requestUrl) => {
        const response = await fetch(requestUrl, {
          headers: {
            Accept: 'application/json',
          },
        })

        const text = await response.text()
        return {
          status: response.status,
          ok: response.ok,
          retryAfter: response.headers.get('retry-after'),
          text,
        }
      }, url)

      if (result.ok) {
        return JSON.parse(result.text) as T
      }

      const retryable = STOKOMANI_RETRYABLE_STATUSES.has(result.status)
      lastError = new Error(`Stokomani responded with ${result.status} for ${url}`)

      if (!retryable || attempt >= STOKOMANI_MAX_HTTP_ATTEMPTS) {
        throw lastError
      }

      const retryAfterMs = parseRetryAfterMs(result.retryAfter)
      const backoffMs = retryAfterMs ?? STOKOMANI_BASE_RETRY_DELAY_MS * 2 ** (attempt - 1)
      await sleep(Math.min(backoffMs, 30000))
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt >= STOKOMANI_MAX_HTTP_ATTEMPTS) {
        throw lastError
      }

      await sleep(Math.min(STOKOMANI_BASE_RETRY_DELAY_MS * 2 ** (attempt - 1), 30000))
    }
  }

  throw lastError || new Error(`Unable to fetch Stokomani endpoint: ${url}`)
}

export async function scrapeStokomaniProducts(searchQuery?: string): Promise<ScrapedOffer[]> {
  const offers: ScrapedOffer[] = []
  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled', '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      locale: 'fr-FR',
      viewport: { width: 1920, height: 1080 },
    })

    const page = await context.newPage()
    await page.goto(STOKOMANI_BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })

    if (searchQuery) {
      const searchUrl = `${STOKOMANI_BASE_URL}/search/suggest.json?q=${encodeURIComponent(searchQuery)}&resources[type]=product`
      const data = await fetchJson<{ resources?: { results?: { products?: ShopifyProduct[] } } }>(page, searchUrl)
      const searchResults = data.resources?.results?.products || []

      for (const product of searchResults) {
        const offer = buildOfferFromProduct(product)
        if (offer) {
          offers.push(offer)
        }
      }

      const filteredOffers = filterOffersByQuery(offers, searchQuery)
      return enrichOffersFromProductPages(filteredOffers, (offer) => !isSpecificQuantity(offer.quantity), 4)
    }

    let pageNumber = 1
    let hasMore = true

    while (hasMore && pageNumber <= STOKOMANI_MAX_PAGES) {
      const catalogUrl = `${STOKOMANI_BASE_URL}/products.json?limit=${STOKOMANI_PAGE_LIMIT}&page=${pageNumber}`
      const data = await fetchJson<{ products?: ShopifyProduct[] }>(page, catalogUrl)
      const products = data.products || []

      if (products.length === 0) {
        hasMore = false
        break
      }

      for (const product of products) {
        const offer = buildOfferFromProduct(product)
        if (offer) {
          offers.push(offer)
        }
      }

      pageNumber += 1
      await sleep(800)
    }

    return enrichOffersFromProductPages(offers, (offer) => !isSpecificQuantity(offer.quantity), 4)
  } finally {
    await browser.close()
  }
}

export async function scrapeStokomaniCategory(category: string) {
  const products = await scrapeStokomaniProducts()
  return products.filter((product) => product.category === category)
}
