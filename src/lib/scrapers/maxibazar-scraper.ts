import { load, type CheerioAPI } from 'cheerio'

import {
  cleanDisplayText,
  filterOffersByQuery,
  normalizeSearchQuery,
  resolveScrapedOfferCategory,
  toAbsoluteUrl,
  toValidPrice,
} from '../scraper-utils'
import type { RetailerScrapeDetails, ScrapeIssue, ScrapedOffer } from '../types'

const MAXIBAZAR_BASE_URL = 'https://maxibazar.fr'
const MAXIBAZAR_SITEMAP_INDEX_URL = `${MAXIBAZAR_BASE_URL}/Assets/Rbs/Seo/sitemap-index.xml`
const MAXIBAZAR_PRODUCT_SITEMAP_PATTERN = /Rbs_Catalog_Product\.\d+\.xml$/i
const MAXIBAZAR_DEFAULT_CONCURRENCY = 6
const MAXIBAZAR_DEFAULT_TIMEOUT_MS = 30000
const MAXIBAZAR_DEFAULT_RETRIES = 3

type JsonLdBreadcrumbList = {
  '@type'?: string | string[]
  itemListElement?: Array<{
    position?: number
    name?: string
    item?: string | { '@id'?: string; name?: string }
  }>
}

type JsonLdProduct = {
  '@type'?: string | string[]
  name?: string
  sku?: string
  description?: string
  image?: string | string[]
  brand?: string | { name?: string }
  offers?: {
    url?: string
    price?: number | string
    priceCurrency?: string
    availability?: string
  }
}

type MaxibazarChangeData = {
  common?: Record<string, unknown> & {
    id?: string
    reference?: string
    brand?: string
    description?: string
    availability?: string
    URL?: {
      canonical?: string
    }
  }
  rootProduct?: Record<string, unknown> & {
    id?: string
    sku?: string
    name?: string
    brand?: string
    description?: string
    web_category_label?: string
    category?: {
      label?: string
      path?: string
    }
  }
  price?: Record<string, unknown> & {
    current?: number | string
    price?: number | string
    original?: number | string
    strikeThrough?: number | string
    compareAt?: number | string
  }
  visuals?: Array<
    string | {
      url?: string
      src?: string
      image?: string
      detail?: string
      original?: string
      large?: string
      medium?: string
      small?: string
    }
  >
  stock?: Record<string, unknown> & {
    available?: boolean
    inStock?: boolean
    message?: string
    label?: string
    status?: string
  }
  typology?: {
    attributes?: Record<string, unknown>
  }
}

let cachedProductUrlsPromise: Promise<string[]> | null = null

function createIssue(code: string, message: string, url?: string, severity: 'error' | 'warning' = 'warning'): ScrapeIssue {
  return {
    retailer: 'maxibazar',
    code,
    message,
    severity,
    url,
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function parseLocs(xml: string) {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((match) => cleanDisplayText(match[1]))
}

async function fetchTextWithRetry(url: string, retries = MAXIBAZAR_DEFAULT_RETRIES, timeoutMs = MAXIBAZAR_DEFAULT_TIMEOUT_MS) {
  let lastError: unknown = null

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; ComparateurPrixDiscountBot/1.0)',
          accept: 'text/html,application/xml;q=0.9,*/*;q=0.8',
        },
      })
      clearTimeout(timeout)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} for ${url}`)
      }

      return await response.text()
    } catch (error) {
      clearTimeout(timeout)
      lastError = error

      if (attempt < retries) {
        await sleep(400 * (attempt + 1))
        continue
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`Failed to fetch ${url}`)
}

async function mapWithConcurrency<T, U>(items: T[], concurrency: number, mapper: (item: T, index: number) => Promise<U>) {
  const results: U[] = []
  const queue = [...items.entries()]
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (queue.length > 0) {
      const entry = queue.shift()
      if (!entry) break
      const [index, item] = entry
      results[index] = await mapper(item, index)
    }
  })

  await Promise.all(workers)
  return results
}

function safeParseJson<T>(value: string | null | undefined): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch (_error) {
    return null
  }
}

function parseObjectLiteral<T>(value: string | null | undefined): T | null {
  const parsedJson = safeParseJson<T>(value)
  if (parsedJson) {
    return parsedJson
  }

  if (!value) return null

  try {
    const parsed = Function(`"use strict"; return (${value});`)() as T
    return parsed || null
  } catch (_error) {
    return null
  }
}

function flattenJsonLd(value: unknown): unknown[] {
  if (!value) return []
  if (Array.isArray(value)) return value.flatMap((item) => flattenJsonLd(item))
  if (typeof value === 'object') {
    const objectValue = value as Record<string, unknown>
    if (Array.isArray(objectValue['@graph'])) {
      return objectValue['@graph'].flatMap((item) => flattenJsonLd(item))
    }
    return [value]
  }
  return []
}

function isJsonLdProduct(candidate: unknown): candidate is JsonLdProduct {
  if (!candidate || typeof candidate !== 'object') return false
  const typeValue = (candidate as { '@type'?: unknown })['@type']
  const types = Array.isArray(typeValue) ? typeValue : [typeValue]
  return types.some((entry) => cleanDisplayText(String(entry || '')).toLowerCase() === 'product')
}

function isJsonLdBreadcrumbList(candidate: unknown): candidate is JsonLdBreadcrumbList {
  if (!candidate || typeof candidate !== 'object') return false
  const typeValue = (candidate as { '@type'?: unknown })['@type']
  const types = Array.isArray(typeValue) ? typeValue : [typeValue]
  return types.some((entry) => cleanDisplayText(String(entry || '')).toLowerCase() === 'breadcrumblist')
}

function extractJsonLdDocuments($: CheerioAPI) {
  const productCandidates: JsonLdProduct[] = []
  const breadcrumbCandidates: JsonLdBreadcrumbList[] = []

  $('script[type="application/ld+json"]').each((_, script) => {
    const raw = cleanDisplayText($(script).text())
    if (!raw) return

    const parsed = safeParseJson<unknown>(raw)
    for (const candidate of flattenJsonLd(parsed)) {
      if (isJsonLdProduct(candidate)) {
        productCandidates.push(candidate)
      } else if (isJsonLdBreadcrumbList(candidate)) {
        breadcrumbCandidates.push(candidate)
      }
    }
  })

  return {
    product: productCandidates[0] || null,
    breadcrumb: breadcrumbCandidates[0] || null,
  }
}

function extractBalancedObjectLiteral(source: string, marker: string) {
  const markerIndex = source.indexOf(marker)
  if (markerIndex < 0) return null

  const braceIndex = source.indexOf('{', markerIndex)
  if (braceIndex < 0) return null

  let depth = 0
  let inString = false
  let stringDelimiter = ''
  let escaped = false

  for (let index = braceIndex; index < source.length; index += 1) {
    const char = source[index]

    if (inString) {
      if (escaped) {
        escaped = false
        continue
      }

      if (char === '\\') {
        escaped = true
        continue
      }

      if (char === stringDelimiter) {
        inString = false
        stringDelimiter = ''
      }

      continue
    }

    if (char === '"' || char === "'" || char === '`') {
      inString = true
      stringDelimiter = char
      continue
    }

    if (char === '{') {
      depth += 1
      continue
    }

    if (char === '}') {
      depth -= 1
      if (depth === 0) {
        return source.slice(braceIndex, index + 1)
      }
    }
  }

  return null
}

function extractWindowChange10(html: string): MaxibazarChangeData | null {
  const markers = [
    "window.__change['10']",
    'window.__change["10"]',
    'window.__change[\'10\']',
  ]

  for (const marker of markers) {
    const objectLiteral = extractBalancedObjectLiteral(html, marker)
    if (!objectLiteral) continue

    const parsed = parseObjectLiteral<MaxibazarChangeData>(objectLiteral)
    if (parsed) {
      return parsed
    }
  }

  return null
}

function cleanHtmlText(value: string | null | undefined) {
  const cleaned = cleanDisplayText(value)
  if (!cleaned) return ''
  return load(`<div>${cleaned}</div>`).text().replace(/\s+/g, ' ').trim()
}

function firstString(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const cleaned = cleanDisplayText(value)
    if (cleaned) return cleaned
  }
  return ''
}

function normalizeAvailability(value: string | null | undefined) {
  const text = cleanDisplayText(value)
  if (!text) return undefined

  const normalized = normalizeSearchQuery(text)
  if (
    normalized.includes('out of stock') ||
    normalized.includes('rupture') ||
    normalized.includes('indisponible')
  ) {
    return 'Rupture de stock'
  }

  if (
    normalized.includes('in stock') ||
    normalized.includes('en stock') ||
    normalized.includes('disponible') ||
    normalized.includes('stock')
  ) {
    return 'En stock'
  }

  return text
}

function normalizePriceValue(value: unknown) {
  const price = toValidPrice(value)
  return price === null ? null : price
}

function normalizeImageUrl(value: string | null | undefined) {
  return toAbsoluteUrl(value, MAXIBAZAR_BASE_URL)
}

function collectImageCandidates(value: unknown): string[] {
  if (!value) return []

  if (typeof value === 'string') {
    return [value]
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectImageCandidates(item))
  }

  if (typeof value === 'object') {
    const objectValue = value as Record<string, unknown>
    const candidates: string[] = []
    for (const key of ['original', 'detail', 'large', 'medium', 'small', 'url', 'src', 'image']) {
      candidates.push(...collectImageCandidates(objectValue[key]))
    }
    return candidates
  }

  return []
}

function extractBreadcrumbPath(breadcrumb: JsonLdBreadcrumbList | null, productName: string) {
  const items = breadcrumb?.itemListElement || []
  const names = items
    .map((item) => cleanDisplayText(item.name || (typeof item.item === 'object' ? item.item?.name : undefined)))
    .filter(Boolean)
    .filter((name, index, array) => {
      const normalized = normalizeSearchQuery(name)
      if (!normalized) return false
      if (normalized === 'accueil' || normalized === 'home') return false
      if (index === array.length - 1 && normalizeSearchQuery(productName) === normalized) return false
      return true
    })

  return names.join(' | ')
}

function extractChangePath(change: MaxibazarChangeData | null) {
  const segments = [
    change?.rootProduct?.category?.path,
    change?.rootProduct?.category?.label,
    change?.rootProduct?.web_category_label,
    change?.common?.category_path as string | undefined,
    change?.common?.categoryPath as string | undefined,
  ]
    .map((segment) => cleanDisplayText(segment))
    .filter(Boolean)

  return segments.join(' | ')
}

function extractSourceProductId(
  product: JsonLdProduct | null,
  change: MaxibazarChangeData | null,
  pageUrl: string,
) {
  return firstString(
    product?.sku,
    change?.common?.id,
    change?.common?.reference,
    change?.rootProduct?.id,
    change?.rootProduct?.sku,
  ) || deriveSourceProductIdFromUrl(pageUrl)
}

function deriveSourceProductIdFromUrl(value: string) {
  try {
    const url = new URL(value)
    const pathname = url.pathname.replace(/\/+$/, '')
    if (!pathname) return ''
    const segments = pathname.split('/').filter(Boolean)
    return segments.at(-1) || segments.join(':')
  } catch (_error) {
    return ''
  }
}

function extractName(product: JsonLdProduct | null, change: MaxibazarChangeData | null, $: CheerioAPI) {
  return firstString(
    product?.name,
    change?.rootProduct?.name,
    change?.common?.name as string | undefined,
    $('h1').first().text(),
    $('meta[property="og:title"]').attr('content'),
    $('title').text(),
  )
}

function extractDescription(product: JsonLdProduct | null, change: MaxibazarChangeData | null) {
  return firstString(
    cleanHtmlText(product?.description),
    cleanHtmlText(change?.common?.description as string | undefined),
    cleanHtmlText(change?.rootProduct?.description),
    cleanHtmlText((change?.typology?.attributes?.['p_description_long_web'] as string | undefined) || ''),
    cleanHtmlText((change?.typology?.attributes?.['description'] as string | undefined) || ''),
  )
}

function extractBrand(product: JsonLdProduct | null, change: MaxibazarChangeData | null) {
  const jsonLdBrand = typeof product?.brand === 'string' ? product.brand : product?.brand?.name
  return firstString(jsonLdBrand, change?.common?.brand as string | undefined, change?.rootProduct?.brand)
}

function extractAvailability(product: JsonLdProduct | null, change: MaxibazarChangeData | null, $: CheerioAPI) {
  return normalizeAvailability(
    firstString(
      product?.offers?.availability,
      change?.stock?.message,
      change?.stock?.label,
      change?.stock?.status,
      change?.common?.availability as string | undefined,
      $('meta[property="product:availability"]').attr('content'),
      $('body').text().match(/(en stock|indisponible|rupture de stock)/i)?.[1],
    ),
  )
}

function extractPrice(product: JsonLdProduct | null, change: MaxibazarChangeData | null) {
  return (
    normalizePriceValue(product?.offers?.price) ??
    normalizePriceValue(change?.price?.current) ??
    normalizePriceValue(change?.price?.price) ??
    normalizePriceValue(change?.price?.original) ??
    normalizePriceValue(change?.price?.strikeThrough) ??
    normalizePriceValue(change?.price?.compareAt)
  )
}

function extractOriginalPrice(product: JsonLdProduct | null, change: MaxibazarChangeData | null) {
  return (
    normalizePriceValue(change?.price?.original) ??
    normalizePriceValue(change?.price?.strikeThrough) ??
    normalizePriceValue(change?.price?.compareAt) ??
    normalizePriceValue(product?.offers?.price)
  )
}

function extractImage(product: JsonLdProduct | null, change: MaxibazarChangeData | null) {
  const candidates = [
    ...collectImageCandidates(product?.image),
    ...collectImageCandidates(change?.visuals),
  ]

  for (const candidate of candidates) {
    const absolute = normalizeImageUrl(candidate)
    if (absolute) {
      return absolute
    }
  }

  return ''
}

function extractSourceUrl(product: JsonLdProduct | null, change: MaxibazarChangeData | null, pageUrl: string) {
  const raw = firstString(product?.offers?.url, change?.common?.URL?.canonical, pageUrl)
  if (!raw) return pageUrl

  const absolute = toAbsoluteUrl(raw, MAXIBAZAR_BASE_URL)
  if (!absolute) return pageUrl

  try {
    const url = new URL(absolute)
    url.hash = ''
    url.search = ''
    return url.toString()
  } catch (_error) {
    return absolute
  }
}

function parseProductOffer(html: string, pageUrl: string): ScrapedOffer | null {
  const $ = load(html)
  const { product, breadcrumb } = extractJsonLdDocuments($)
  const change = extractWindowChange10(html)

  const name = extractName(product, change, $)
  const sourceUrl = extractSourceUrl(product, change, pageUrl)
  const price = extractPrice(product, change)

  if (!name || price === null) {
    return null
  }

  const sourceCategoryPath = firstString(
    extractBreadcrumbPath(breadcrumb, name),
    extractChangePath(change),
  )

  const brand = extractBrand(product, change)
  const description = extractDescription(product, change)
  const availability = extractAvailability(product, change, $)
  const image = extractImage(product, change)
  const sourceProductId = extractSourceProductId(product, change, sourceUrl)
  const originalPrice = extractOriginalPrice(product, change)

  const categoryResolution = resolveScrapedOfferCategory({
    retailer: 'maxibazar',
    sourceUrl,
    sourceCategoryPath,
    nativeCategory: sourceCategoryPath,
    name,
    brand,
    description,
    availability,
  })

  return {
    retailer: 'maxibazar',
    sourceProductId,
    sourceUrl,
    sourceCategoryPath,
    category: categoryResolution.category,
    categoryResolution,
    name,
    brand: brand || undefined,
    price,
    image,
    description: description || undefined,
    availability,
    originalPrice: originalPrice === price ? undefined : originalPrice || undefined,
  }
}

function dedupeOffers(offers: ScrapedOffer[]) {
  const seen = new Set<string>()
  return offers.filter((offer) => {
    const key = `${cleanDisplayText(offer.sourceProductId)}|${cleanDisplayText(offer.sourceUrl)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

async function fetchProductSitemapUrls() {
  if (!cachedProductUrlsPromise) {
    cachedProductUrlsPromise = (async () => {
      const sitemapIndex = await fetchTextWithRetry(MAXIBAZAR_SITEMAP_INDEX_URL)
      const sitemapUrls = parseLocs(sitemapIndex).filter((url) => MAXIBAZAR_PRODUCT_SITEMAP_PATTERN.test(url))
      const sitemapContents = await mapWithConcurrency(sitemapUrls, 4, async (url) => fetchTextWithRetry(url))
      const productUrls = sitemapContents.flatMap((xml) => parseLocs(xml))
      const seen = new Set<string>()
      return productUrls.filter((url) => {
        if (!url || seen.has(url)) return false
        seen.add(url)
        return true
      })
    })()
  }

  return cachedProductUrlsPromise
}

function filterUrlsByQuery(urls: string[], query: string) {
  const normalizedQuery = normalizeSearchQuery(query)
  if (!normalizedQuery) return urls

  const queryTokens = normalizedQuery.split(' ').filter((token) => token.length > 1)
  return urls.filter((url) => {
    let slug = ''
    try {
      slug = normalizeSearchQuery(new URL(url).pathname)
    } catch (_error) {
      slug = normalizeSearchQuery(url)
    }

    if (!slug) return false
    if (slug.includes(normalizedQuery)) return true
    if (queryTokens.length > 0 && queryTokens.every((token) => slug.includes(token))) return true
    if (queryTokens.length === 1) return slug.includes(queryTokens[0] || '')
    return false
  })
}

async function scrapeUrls(urls: string[], concurrency: number, issues: ScrapeIssue[]) {
  const offers: ScrapedOffer[] = []
  let completed = 0

  await mapWithConcurrency(urls, concurrency, async (url) => {
    try {
      const html = await fetchTextWithRetry(url)
      const offer = parseProductOffer(html, url)
      if (offer) {
        offers.push(offer)
      } else {
        issues.push(createIssue('missing_product_data', 'Produit Maxi Bazar incomplet ou non parsable', url, 'warning'))
      }
      completed += 1
    } catch (error) {
      issues.push(
        createIssue(
          'page_fetch_failed',
          error instanceof Error ? error.message : String(error),
          url,
          'warning',
        ),
      )
    }
  })

  return {
    offers: dedupeOffers(offers),
    completed,
  }
}

function getConfiguredLimit(name: string) {
  const value = Number.parseInt(process.env[name] || '', 10)
  return Number.isFinite(value) && value > 0 ? value : null
}

export function dedupeMaxibazarOffers(offers: ScrapedOffer[]) {
  return dedupeOffers(offers)
}

export function parseMaxibazarPrice(value: string | number | null | undefined) {
  return normalizePriceValue(value)
}

export function extractMaxibazarProductPageOffer(html: string, pageUrl: string) {
  return parseProductOffer(html, pageUrl)
}

export async function scrapeMaxibazarProductsDetailed(searchQuery?: string): Promise<RetailerScrapeDetails> {
  const issues: ScrapeIssue[] = []

  try {
    let urls = await fetchProductSitemapUrls()
    const discoveredListings = urls.length
    if (searchQuery) {
      urls = filterUrlsByQuery(urls, searchQuery)
    }

    const configuredLimit = getConfiguredLimit('MAXIBAZAR_MAX_PRODUCT_PAGES')
    if (configuredLimit !== null && urls.length > configuredLimit) {
      issues.push(
        createIssue(
          'product_cap_reached',
          `Cap de pages Maxi Bazar atteint: ${configuredLimit}/${urls.length}`,
          undefined,
          'warning',
        ),
      )
      urls = urls.slice(0, configuredLimit)
    }

    const concurrency = getConfiguredLimit('MAXIBAZAR_CONCURRENCY') || MAXIBAZAR_DEFAULT_CONCURRENCY
    const { offers, completed } = await scrapeUrls(urls, concurrency, issues)
    const filteredOffers = searchQuery ? filterOffersByQuery(offers, searchQuery) : offers

    return {
      retailer: 'maxibazar',
      offers: filteredOffers,
      issues,
      coverage: {
        discoveredListings,
        completedListings: completed,
        collectionRate: discoveredListings === 0 ? 100 : Math.round((completed / discoveredListings) * 100),
        isComplete: completed === discoveredListings && !issues.some((issue) => issue.severity !== 'warning'),
      },
    }
  } catch (error) {
    issues.push(
      createIssue(
        'scraper_error',
        error instanceof Error ? error.message : String(error),
        undefined,
        'error',
      ),
    )

    return {
      retailer: 'maxibazar',
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

export async function scrapeMaxibazarProducts(searchQuery?: string): Promise<ScrapedOffer[]> {
  const result = await scrapeMaxibazarProductsDetailed(searchQuery)
  return result.offers
}
