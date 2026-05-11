import { load } from 'cheerio'

import { cleanDisplayText, extractQuantity, formatUnitPriceText, toValidPrice } from '../scraper-utils'

export interface ProductPageDetails {
  quantity?: string
  unitPrice?: string
}

const PAGE_TEXT_CACHE = new Map<string, Promise<string>>()
const PAGE_TEXT_CACHE_LIMIT = 50
const DEFAULT_PAGE_TEXT_TIMEOUT_MS = 8000

function normalizePageText(value: string) {
  return value
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function readPositiveIntegerEnv(name: string) {
  const value = process.env[name]
  if (!value) return null

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function getPageTextTimeoutMs() {
  return readPositiveIntegerEnv('PRODUCT_PAGE_DETAILS_TIMEOUT_MS') || DEFAULT_PAGE_TEXT_TIMEOUT_MS
}

async function fetchPageText(url: string): Promise<string> {
  const cached = PAGE_TEXT_CACHE.get(url)
  if (cached) {
    return cached
  }

  const promise = (async () => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), getPageTextTimeoutMs())

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: controller.signal,
      })

      if (!response.ok) {
        return ''
      }

      const html = await response.text()
      const document = load(html)
      return normalizePageText(`${document('body').text()} ${document('script').text()}`)
    } catch (_error) {
      return ''
    } finally {
      clearTimeout(timeout)
    }
  })()

  PAGE_TEXT_CACHE.set(url, promise)
  if (PAGE_TEXT_CACHE.size > PAGE_TEXT_CACHE_LIMIT) {
    const oldestKey = PAGE_TEXT_CACHE.keys().next().value
    if (oldestKey) {
      PAGE_TEXT_CACHE.delete(oldestKey)
    }
  }
  return promise
}

function pickQuantityCandidate(text: string): string | undefined {
  const candidates: string[] = []

  const patterns: RegExp[] = [
    /Dimensions\s*\/\s*Contenance\s*\/\s*Taille\s*([0-9]+(?:[.,][0-9]+)?\s*(?:ml|l|cl|g|kg|piece|pieces|pc|pcs|unite|unites))/i,
    /Contenance\s*([0-9]+(?:[.,][0-9]+)?\s*(?:ml|l|cl|g|kg|piece|pieces|pc|pcs|unite|unites))/i,
    /"salesUnit":"([^"]+)"/i,
    /"drainedWeightValue":([0-9]+(?:\.[0-9]+)?)\s*,\s*"drainedWeightUnit":"([A-Z]+)"/i,
    /"weight":([0-9]+(?:\.[0-9]+)?)\s*,\s*"weight_unit":"([a-zA-Z]+)"/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (!match) {
      continue
    }

    if (match.length >= 3) {
      candidates.push(`${match[1]} ${match[2]}`)
    } else if (match[1]) {
      candidates.push(match[1])
    }
  }

  for (const candidate of candidates) {
    const quantity = extractQuantity(candidate)
    if (quantity) {
      return quantity
    }
  }

  return undefined
}

function pickUnitPriceCandidate(text: string): string | undefined {
  const bmMatch = text.match(/Prix au (litre|kilo)\s*([0-9]+(?:[.,][0-9]+)?)/i)
  if (bmMatch) {
    return formatUnitPriceText(toValidPrice(bmMatch[2]) || 0, bmMatch[1].toLowerCase() === 'litre' ? '/l' : '/kg')
  }

  const visibleMatch = text.match(/Le\s*(kg|l)\s*=\s*([0-9]+(?:[.,][0-9]+)?)/i)
  if (visibleMatch) {
    return formatUnitPriceText(toValidPrice(visibleMatch[2]) || 0, visibleMatch[1].toLowerCase() === 'kg' ? '/kg' : '/l')
  }

  const aldiMatch = text.match(/"basePriceValue":([0-9]+(?:\.[0-9]+)?)\s*,\s*"basePriceScale":"(KG|L|PIECE)"/i)
  if (aldiMatch) {
    const unit = aldiMatch[2].toUpperCase() === 'KG' ? '/kg' : aldiMatch[2].toUpperCase() === 'L' ? '/l' : '/pcs'
    return formatUnitPriceText(toValidPrice(aldiMatch[1]) || 0, unit)
  }

  return undefined
}

export async function resolveProductPageDetails(url: string): Promise<ProductPageDetails> {
  const text = await fetchPageText(url)
  if (!text) {
    return {}
  }

  const quantity = pickQuantityCandidate(text)
  const unitPrice = pickUnitPriceCandidate(text)

  return {
    quantity,
    unitPrice,
  }
}

export function isSpecificQuantity(quantity: string | null | undefined): boolean {
  const normalized = cleanDisplayText(quantity).toLowerCase()
  return /\d/.test(normalized) && /(kg|g|l|ml|cl|pc|pcs|piece|pieces|unite|unites)/.test(normalized)
}

export async function enrichOffersFromProductPages<T extends { sourceUrl: string; quantity?: string | null; unitPrice?: string | null; name: string; description?: string | null; category?: string }>(
  offers: T[],
  shouldEnrich: (offer: T) => boolean,
  concurrency = 4,
): Promise<T[]> {
  const candidates = offers
    .map((offer, index) => ({ offer, index }))
    .filter(({ offer }) => shouldEnrich(offer))

  if (candidates.length === 0) {
    return offers
  }

  const detailsByIndex = new Map<number, ProductPageDetails>()
  let nextIndex = 0

  async function worker() {
    while (nextIndex < candidates.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      const candidate = candidates[currentIndex]
      const details = await resolveProductPageDetails(candidate.offer.sourceUrl)
      detailsByIndex.set(candidate.index, details)
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, candidates.length) }, () => worker()),
  )

  return offers.map((offer, index) => {
    const details = detailsByIndex.get(index)
    if (!details) {
      return offer
    }

    const currentQuantity = cleanDisplayText(offer.quantity)
    const currentUnitPrice = cleanDisplayText(offer.unitPrice)
    const candidateQuantity = cleanDisplayText(details.quantity)
    const candidateUnitPrice = cleanDisplayText(details.unitPrice)

    const shouldReplaceQuantity =
      !isSpecificQuantity(currentQuantity) && isSpecificQuantity(candidateQuantity)

    return {
      ...offer,
      quantity: shouldReplaceQuantity ? candidateQuantity : currentQuantity || candidateQuantity || undefined,
      unitPrice: candidateUnitPrice || currentUnitPrice || undefined,
    }
  })
}
