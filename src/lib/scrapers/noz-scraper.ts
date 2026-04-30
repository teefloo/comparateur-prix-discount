import { load } from 'cheerio'

import {
  cleanDisplayText,
  extractQuantity,
  filterOffersByQuery,
  resolveScrapedOfferCategory,
  toAbsoluteUrl,
  toValidPrice,
} from '../scraper-utils'
import type { RetailerScrapeDetails, ScrapeIssue, ScrapedOffer } from '../types'

const NOZ_BASE_URL = 'https://www.noz.fr'
const NOZ_PRODUCTS_API_URL = `${NOZ_BASE_URL}/wp-json/wc/store/v1/products`
const NOZ_SHOP_URL = `${NOZ_BASE_URL}/shop/`
const NOZ_PRODUCTS_PER_PAGE = 100
const NOZ_REQUEST_TIMEOUT_MS = 30000
const NOZ_MAX_RETRIES = 3
const NOZ_SHOP_CONCURRENCY = 4

export type NozStoreProduct = {
  id?: number
  name?: string
  sku?: string
  permalink?: string
  short_description?: string
  description?: string
  prices?: {
    price?: string
    regular_price?: string
    sale_price?: string
    currency_minor_unit?: number
  }
  images?: Array<{
    src?: string
    thumbnail?: string
    alt?: string
  }>
  categories?: Array<{
    id?: number
    name?: string
    slug?: string
    link?: string
  }>
  tags?: Array<{
    id?: number
    name?: string
    slug?: string
    link?: string
  }>
  is_in_stock?: boolean
  stock_availability?: {
    text?: string
    class?: string
  }
}

export type NozListingEnhancement = {
  sourceUrl: string
  status?: string
  subtitle1?: string
  subtitle2?: string
  priceUnitText?: string
}

type NozApiProductsResult = {
  products: NozStoreProduct[]
  totalProducts: number
  completedProducts: number
}

function createIssue(
  code: string,
  message: string,
  url?: string,
  severity: 'error' | 'warning' = 'warning',
): ScrapeIssue {
  return {
    retailer: 'noz',
    code,
    message,
    severity,
    url,
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeNozText(value: string | null | undefined) {
  const cleaned = cleanDisplayText(value)
  if (!cleaned) return ''

  const decoded = load(`<span>${cleaned}</span>`)('span').text()
  return cleanDisplayText(decoded)
    .replace(/[\u2018\u2019\u0092]/g, "'")
    .replace(/[\u0080]/g, 'EUR')
}

function stripHtmlText(value: string | null | undefined) {
  const cleaned = cleanDisplayText(value)
  if (!cleaned) return ''

  return normalizeNozText(load(`<div>${cleaned}</div>`).text())
}

function normalizeNozProductUrl(value: string | null | undefined) {
  const absolute = toAbsoluteUrl(value, NOZ_BASE_URL)
  if (!absolute) return ''

  try {
    const url = new URL(absolute)
    url.hash = ''
    url.search = ''
    return url.toString()
  } catch (_error) {
    return absolute
  }
}

function parsePositiveInt(value: string | null | undefined) {
  const parsed = Number.parseInt(value || '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function appendSearchParam(url: string, key: string, value: string | number) {
  const parsed = new URL(url)
  parsed.searchParams.set(key, String(value))
  return parsed.toString()
}

function parseNozAvailability(product: NozStoreProduct) {
  const statusClass = normalizeNozText(product.stock_availability?.class).toLowerCase()
  const statusText = normalizeNozText(product.stock_availability?.text).toLowerCase()

  if (product.is_in_stock === false || statusClass.includes('out-of-stock') || statusText.includes('rupture')) {
    return 'Indisponible'
  }

  return 'Disponible en magasin'
}

function firstImage(product: NozStoreProduct) {
  const image = product.images?.[0]
  return toAbsoluteUrl(image?.src || image?.thumbnail, NOZ_BASE_URL)
}

function buildSourceCategoryPath(product: NozStoreProduct) {
  return (product.categories || [])
    .map((category) => normalizeNozText(category.name || category.slug))
    .filter(Boolean)
    .join(' | ')
}

function buildNozDescription(product: NozStoreProduct, enhancement?: NozListingEnhancement) {
  const parts = [
    enhancement?.status ? `Arrivage Noz: ${enhancement.status}` : '',
    enhancement?.subtitle1,
    enhancement?.subtitle2,
    enhancement?.priceUnitText,
    stripHtmlText(product.short_description),
    stripHtmlText(product.description),
  ]
    .map((part) => normalizeNozText(part))
    .filter(Boolean)

  return Array.from(new Set(parts)).join(' | ') || undefined
}

function parseNozPriceFromStoreValue(value: string | number | null | undefined, minorUnit = 2) {
  if (value === null || value === undefined || value === '') return null

  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value))
  if (!Number.isFinite(parsed) || parsed <= 0) return null

  return toValidPrice(parsed / 10 ** minorUnit)
}

function parseNozPriceUnitText(value: string | null | undefined) {
  const text = normalizeNozText(value)
    .replace(/[\u20ac]/g, 'EUR')
    .replace(/\s+/g, ' ')
    .trim()

  if (!text) return undefined

  const match = text.match(/(\d+(?:[,.]\d+)?)\s*(?:EUR)?\s*(?:\/|le)\s*(kg|kilogramme|kilo|l|litre|piece|pieces|pc|pcs)/i)
  if (!match) return text

  const price = toValidPrice(match[1])
  if (price === null) return text

  const rawUnit = (match[2] || '').toLowerCase()
  const unit = rawUnit === 'kilogramme' || rawUnit === 'kilo' ? 'kg' : rawUnit === 'litre' ? 'l' : rawUnit
  return `${price.toFixed(2).replace('.', ',')} EUR/${unit}`
}

export function parseNozPrice(product: Pick<NozStoreProduct, 'prices'> | string | number | null | undefined) {
  if (typeof product === 'string' || typeof product === 'number' || product === null || product === undefined) {
    return parseNozPriceFromStoreValue(product)
  }

  const minorUnit = product.prices?.currency_minor_unit ?? 2
  return (
    parseNozPriceFromStoreValue(product.prices?.price, minorUnit) ??
    parseNozPriceFromStoreValue(product.prices?.sale_price, minorUnit) ??
    parseNozPriceFromStoreValue(product.prices?.regular_price, minorUnit)
  )
}

export function extractNozListingEnhancements(html: string) {
  const $ = load(html)
  const enhancements = new Map<string, NozListingEnhancement>()

  $('li.product').each((_, element) => {
    const tile = $(element)
    const sourceUrl = normalizeNozProductUrl(
      tile.find('a.woocommerce-LoopProduct-link[href]').first().attr('href') ||
        tile.find('a[href]').first().attr('href'),
    )

    if (!sourceUrl) return

    const status = normalizeNozText(tile.find('.statutprod').first().text())
    const subtitle1 = normalizeNozText(tile.find('.subtitle1').first().text())
    const subtitle2 = normalizeNozText(tile.find('.subtitle2').first().text())
    const priceUnitText = parseNozPriceUnitText(tile.find('.priceunite').first().text())

    enhancements.set(sourceUrl, {
      sourceUrl,
      status: status || undefined,
      subtitle1: subtitle1 || undefined,
      subtitle2: subtitle2 || undefined,
      priceUnitText,
    })
  })

  return enhancements
}

export function extractNozShopPageCount(html: string) {
  const $ = load(html)
  const pageNumbers = $('a[href*="/shop/page/"]')
    .map((_, element) => {
      const href = $(element).attr('href') || ''
      const match = href.match(/\/shop\/page\/(\d+)\/?/)
      return match ? Number.parseInt(match[1], 10) : 0
    })
    .get()
    .filter((pageNumber) => Number.isFinite(pageNumber) && pageNumber > 0)

  return pageNumbers.length > 0 ? Math.max(...pageNumbers) : 1
}

export function extractNozApiProductOffer(
  product: NozStoreProduct,
  enhancement?: NozListingEnhancement,
): ScrapedOffer | null {
  const name = normalizeNozText(product.name)
  const price = parseNozPrice(product)
  const sourceUrl = normalizeNozProductUrl(product.permalink)

  if (!name || !sourceUrl || price === null) {
    return null
  }

  const sourceProductId = normalizeNozText(product.sku) || (typeof product.id === 'number' ? String(product.id) : '')
  const sourceCategoryPath = buildSourceCategoryPath(product)
  const description = buildNozDescription(product, enhancement)
  const tags = [
    ...(product.tags || []).flatMap((tag) => [tag.name, tag.slug]),
    enhancement?.status,
    enhancement?.subtitle1,
    enhancement?.subtitle2,
  ]

  const categoryResolution = resolveScrapedOfferCategory({
    retailer: 'noz',
    sourceUrl,
    sourceCategoryPath,
    nativeCategory: sourceCategoryPath,
    name,
    description,
    availability: parseNozAvailability(product),
    tags,
  })

  const quantity =
    extractQuantity(enhancement?.subtitle1 || '') ||
    extractQuantity(enhancement?.subtitle2 || '') ||
    extractQuantity(name) ||
    undefined

  return {
    retailer: 'noz',
    sourceProductId,
    sourceUrl,
    sourceCategoryPath,
    category: categoryResolution.category,
    categoryResolution,
    name,
    price,
    image: firstImage(product),
    description,
    availability: parseNozAvailability(product),
    quantity,
    unitPrice: enhancement?.priceUnitText,
  }
}

export function dedupeNozOffers(offers: ScrapedOffer[]) {
  const seen = new Set<string>()
  return offers.filter((offer) => {
    const key = normalizeNozText(offer.sourceProductId) || normalizeNozProductUrl(offer.sourceUrl)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function fetchTextWithRetry(url: string, retries = NOZ_MAX_RETRIES) {
  let lastError: unknown = null

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), NOZ_REQUEST_TIMEOUT_MS)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; ComparateurPrixDiscountBot/1.0)',
          accept: 'text/html,application/json,application/xml;q=0.9,*/*;q=0.8',
        },
      })
      const text = await response.text()
      clearTimeout(timeout)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`)
      }

      return {
        text,
        headers: response.headers,
      }
    } catch (error) {
      clearTimeout(timeout)
      lastError = error

      if (attempt < retries) {
        await sleep(500 * (attempt + 1))
        continue
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Failed to fetch ${url}`)
}

async function fetchJsonWithRetry<T>(url: string) {
  const { text, headers } = await fetchTextWithRetry(url)

  try {
    return {
      data: JSON.parse(text) as T,
      headers,
    }
  } catch (error) {
    throw new Error(`Invalid JSON from ${url}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
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

  const workerCount = Math.max(1, Math.min(concurrency, items.length))
  await Promise.all(Array.from({ length: workerCount }, () => worker()))
  return results
}

async function fetchNozApiProducts(searchQuery?: string): Promise<NozApiProductsResult> {
  const products: NozStoreProduct[] = []
  let page = 1
  let totalPages = 1
  let totalProducts = 0

  do {
    const url = new URL(NOZ_PRODUCTS_API_URL)
    url.searchParams.set('per_page', String(NOZ_PRODUCTS_PER_PAGE))
    url.searchParams.set('page', String(page))
    url.searchParams.set('orderby', 'date')
    url.searchParams.set('order', 'desc')

    if (searchQuery) {
      url.searchParams.set('search', searchQuery)
    }

    const { data, headers } = await fetchJsonWithRetry<NozStoreProduct[]>(url.toString())
    if (!Array.isArray(data)) {
      throw new Error(`Unexpected Noz API response for page ${page}`)
    }

    products.push(...data)
    totalPages = parsePositiveInt(headers.get('x-wp-totalpages')) || totalPages
    totalProducts = parsePositiveInt(headers.get('x-wp-total')) || Math.max(totalProducts, products.length)
    page += 1
  } while (page <= totalPages)

  return {
    products,
    totalProducts,
    completedProducts: products.length,
  }
}

async function fetchNozListingEnhancements(totalProducts: number, issues: ScrapeIssue[]) {
  const enhancements = new Map<string, NozListingEnhancement>()

  try {
    const firstPage = await fetchTextWithRetry(NOZ_SHOP_URL)
    for (const [url, enhancement] of extractNozListingEnhancements(firstPage.text)) {
      enhancements.set(url, enhancement)
    }

    const parsedPageCount = extractNozShopPageCount(firstPage.text)
    const fallbackPageCount = totalProducts > 0 ? Math.ceil(totalProducts / 15) : 1
    const pageCount = Math.max(parsedPageCount, fallbackPageCount)
    const remainingPages = Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) => index + 2)

    await mapWithConcurrency(remainingPages, NOZ_SHOP_CONCURRENCY, async (pageNumber) => {
      const pageUrl = appendSearchParam(`${NOZ_BASE_URL}/shop/page/${pageNumber}/`, 'orderby', 'date')

      try {
        const page = await fetchTextWithRetry(pageUrl)
        for (const [url, enhancement] of extractNozListingEnhancements(page.text)) {
          enhancements.set(url, enhancement)
        }
      } catch (error) {
        issues.push(
          createIssue(
            'listing_enrichment_failed',
            `Noz listing enrichment failed for page ${pageNumber}: ${error instanceof Error ? error.message : String(error)}`,
            pageUrl,
            'warning',
          ),
        )
      }
    })
  } catch (error) {
    issues.push(
      createIssue(
        'listing_enrichment_failed',
        `Noz listing enrichment failed: ${error instanceof Error ? error.message : String(error)}`,
        NOZ_SHOP_URL,
        'warning',
      ),
    )
  }

  return enhancements
}

export async function scrapeNozProductsDetailed(searchQuery?: string): Promise<RetailerScrapeDetails> {
  const issues: ScrapeIssue[] = []

  try {
    const apiResult = await fetchNozApiProducts(searchQuery)
    const enhancements = searchQuery ? new Map<string, NozListingEnhancement>() : await fetchNozListingEnhancements(apiResult.totalProducts, issues)
    const offers = dedupeNozOffers(
      apiResult.products
        .map((product) => {
          const sourceUrl = normalizeNozProductUrl(product.permalink)
          return extractNozApiProductOffer(product, enhancements.get(sourceUrl))
        })
        .filter((offer): offer is ScrapedOffer => offer !== null),
    )
    const filteredOffers = searchQuery ? filterOffersByQuery(offers, searchQuery) : offers
    const discoveredListings = apiResult.totalProducts || apiResult.completedProducts
    const completedListings = apiResult.completedProducts

    return {
      retailer: 'noz',
      offers: filteredOffers,
      issues,
      coverage: {
        discoveredListings,
        completedListings,
        collectionRate: discoveredListings === 0 ? (searchQuery ? 100 : 0) : Math.round((completedListings / discoveredListings) * 100),
        isComplete: discoveredListings === 0 ? Boolean(searchQuery) : completedListings >= discoveredListings,
      },
    }
  } catch (error) {
    issues.push(
      createIssue(
        'scraper_error',
        `Noz scraper failed: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        'error',
      ),
    )

    return {
      retailer: 'noz',
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

export async function scrapeNozProducts(searchQuery?: string): Promise<ScrapedOffer[]> {
  const result = await scrapeNozProductsDetailed(searchQuery)
  return result.offers
}
