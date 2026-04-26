import { type Page } from 'playwright'

import { isSupportedCategory, type SupportedCategory } from '../catalog'
import {
  cleanDisplayText,
  ensureUnitPriceText,
  extractQuantity,
  filterOffersByQuery,
  resolveOfferCategory,
  toAbsoluteUrl,
  toValidPrice,
} from '../scraper-utils'
import type { ScrapedOffer } from '../types'
import { launchChromiumBrowser } from './chromium-launch'

const ACTION_BASE_URL = 'https://www.action.com/fr-fr'
const ACTION_NAVIGATION_TIMEOUT_MS = 90000
const ACTION_NAVIGATION_RETRIES = 3

const ACTION_CATEGORIES: Array<{ name: SupportedCategory; url: string }> = [
  { name: 'alimentation', url: `${ACTION_BASE_URL}/c/boissons--alimentation/` },
  { name: 'hygiene', url: `${ACTION_BASE_URL}/c/hygiene--beaute/` },
  { name: 'menage', url: `${ACTION_BASE_URL}/c/articles-menagers/` },
  { name: 'maison-deco', url: `${ACTION_BASE_URL}/c/habitat/` },
  { name: 'bricolage', url: `${ACTION_BASE_URL}/c/bricolage/` },
  { name: 'loisirs', url: `${ACTION_BASE_URL}/c/jouets/` },
  { name: 'loisirs', url: `${ACTION_BASE_URL}/c/papeterie--bureau/` },
  { name: 'loisirs', url: `${ACTION_BASE_URL}/c/hobby/` },
  { name: 'animaux', url: `${ACTION_BASE_URL}/c/animaux-domestiques/` },
  { name: 'jardin', url: `${ACTION_BASE_URL}/c/jardin/` },
  { name: 'textile', url: `${ACTION_BASE_URL}/c/mode/` },
  { name: 'high-tech', url: `${ACTION_BASE_URL}/c/multimedia/` },
  { name: 'bazar', url: `${ACTION_BASE_URL}/c/cuisine/` },
]

interface ExtractedActionProduct {
  url: string
  image: string
  rawName: string
  fullText: string
  whole: string
  fractional: string
  fullPriceText: string
  originalPriceText?: string
  promotionText?: string
  brand?: string
  detailsText?: string
  quantityText?: string
  unitPriceText?: string
}

function parseActionSourceProductId(url: string) {
  const match = url.match(/\/p\/(\d+)\//)
  if (match) return match[1]

  try {
    return new URL(url).pathname.replace(/\/+$/, '').split('/').filter(Boolean).join(':')
  } catch (_error) {
    return ''
  }
}

function cleanActionProductName(rawName: string): string {
  return cleanDisplayText(rawName)
    .replace(/Utiliser ce produit en toute securite/gi, '')
    .replace(/Semaine d Action|Semaine Action|Nouveau|Nouveaute|Durabilite|Promo|Pas cher/gi, ' ')
    .replace(/Utiliser ce produit[^.]*\.?/gi, ' ')
    .replace(/\b\d+[,.]\d{2}\s*(?:€|eur)\b/gi, ' ')
    .replace(/\/pce\d+/gi, '')
    .replace(/\/l\d+/gi, '')
    .replace(/\/m\d+/gi, '')
    .replace(/pce\d+/gi, '')
    .replace(/kg\d+/gi, '')
    .replace(/\d{3,4}$/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

function parseActionPrice(wholeRaw: string, fractionalRaw: string, fallbackTexts: string[]): number | null {
  const whole = cleanDisplayText(wholeRaw).replace(/\D/g, '')
  const fractional = cleanDisplayText(fractionalRaw).replace(/\D/g, '')

  if (whole && fractional) {
    const parsed = toValidPrice(`${whole}.${fractional.slice(0, 2).padEnd(2, '0')}`)
    if (parsed !== null) return parsed
  }

  for (const fallbackText of fallbackTexts) {
    const match = cleanDisplayText(fallbackText).replace(',', '.').match(/(\d{1,3})\s*[,.]\s*(\d{2})/)
    if (match) {
      const parsed = toValidPrice(`${match[1]}.${match[2]}`)
      if (parsed !== null) return parsed
    }
  }

  return null
}

async function navigateActionListingPage(page: Page, url: string) {
  let lastError: unknown

  for (let attempt = 1; attempt <= ACTION_NAVIGATION_RETRIES; attempt += 1) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: ACTION_NAVIGATION_TIMEOUT_MS })
      return
    } catch (error) {
      lastError = error
      if (attempt < ACTION_NAVIGATION_RETRIES) {
        await page.waitForTimeout(800 * attempt)
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError))
}

async function extractProductsFromPage(page: Page, explicitCategory: SupportedCategory | null): Promise<ScrapedOffer[]> {
  const rows = await page.evaluate((): ExtractedActionProduct[] => {
    // Use more generic selector that works with Action's current site
    const cards = Array.from(document.querySelectorAll('a[href*="/p/"]')) as HTMLAnchorElement[]

    return cards.map((card) => {
      const titleEl = card.querySelector('[data-testid="product-card-title"], h3, [class*="title"]') as HTMLElement | null
      const wholeEl = card.querySelector('[data-testid*="price-whole"], [data-testid*="price-integer"], [class*="price"] span:first-child') as HTMLElement | null
      const fractionEl = card.querySelector('[data-testid*="price-fraction"], [data-testid*="price-decimal"], [class*="price"] span:last-child') as HTMLElement | null
      const fullPriceEl = card.querySelector('[class*="price"]') as HTMLElement | null
      const imageEl = card.querySelector('img') as HTMLImageElement | null
      const originalPriceEl = card.querySelector('[class*="original"], [class*="was"], [class*="crossed"]') as HTMLElement | null
      const promotionEl = card.querySelector('[class*="promo"], [class*="discount"], [class*="sale"], [class*="badge"]') as HTMLElement | null
      const brandEl = card.querySelector('[class*="brand"], [data-testid*="brand"]') as HTMLElement | null
      const detailsEl = card.querySelector('[class*="details"], [data-testid*="details"]') as HTMLElement | null
      const fullText = card.textContent || ''
      const quantityMatch = fullText.match(/(\d+\s*(?:ml|l|cl|g|kg|pieces?|pcs?|pc|x\s*\d+))/i)
      const unitPriceMatch = fullText.match(/(\d+[.,]?\d*\s*€?\s*\/\s*(?:l|kg|g|ml|pieces?|pcs?|pc))/i)

      return {
        url: card.href || '',
        image: imageEl?.currentSrc || imageEl?.src || imageEl?.getAttribute('data-src') || '',
        rawName: titleEl?.innerText?.trim() || '',
        fullText,
        whole: wholeEl?.textContent?.trim() || '',
        fractional: fractionEl?.textContent?.trim() || '',
        fullPriceText: fullPriceEl?.textContent?.trim() || '',
        originalPriceText: originalPriceEl?.innerText?.trim() || '',
        promotionText: promotionEl?.innerText?.trim() || '',
        brand: brandEl?.innerText?.trim() || undefined,
        detailsText: detailsEl?.innerText?.trim() || undefined,
        quantityText: quantityMatch ? quantityMatch[1] : undefined,
        unitPriceText: unitPriceMatch ? unitPriceMatch[1] : undefined,
      }
    })
  })

  const offers: ScrapedOffer[] = []

  for (const row of rows) {
    const name = cleanActionProductName(row.rawName || row.fullText)
    const price = parseActionPrice(row.whole, row.fractional, [row.fullPriceText, row.fullText])
    const sourceUrl = toAbsoluteUrl(row.url, ACTION_BASE_URL)

    if (!name || price === null || !sourceUrl) {
      continue
    }

    const brand = cleanDisplayText(row.brand)
    const finalName = brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${name}` : name
    const sourceProductId = parseActionSourceProductId(sourceUrl)
    if (!sourceProductId) {
      continue
    }

    const category =
      explicitCategory ||
      resolveOfferCategory({
        sourceCategoryPath: row.detailsText,
        textValues: [finalName, row.detailsText, row.fullText],
      })

    if (!category) {
      continue
    }

    const originalPrice = row.originalPriceText
      ? parseActionPrice(row.originalPriceText, '', [row.originalPriceText])
      : null
    const quantity = row.quantityText || extractQuantity(`${finalName} ${row.detailsText || ''}`) || undefined
    const unitPrice = ensureUnitPriceText(row.unitPriceText || row.detailsText, price, quantity)
    const discount =
      originalPrice !== null && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : undefined

    offers.push({
      retailer: 'action',
      sourceProductId,
      sourceUrl,
      sourceCategoryPath: explicitCategory ? category : cleanDisplayText(row.detailsText) || undefined,
      category,
      name: finalName,
      brand: brand || undefined,
      price,
      image: toAbsoluteUrl(row.image, ACTION_BASE_URL),
      description: cleanDisplayText(row.detailsText) || undefined,
      quantity,
      unitPrice,
      originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
      isOnPromotion:
        discount !== undefined ||
        /promo|reduction|soldes|offre/i.test(cleanDisplayText(row.promotionText))
          ? true
          : undefined,
      discount,
    })
  }

  return offers
}

async function scrapeCategory(
  page: Page,
  categoryUrl: string,
  categoryName: SupportedCategory | null,
  maxPages: number,
): Promise<ScrapedOffer[]> {
  const offers: ScrapedOffer[] = []
  const seenUrls = new Set<string>()

  for (let pageNum = 1; pageNum <= maxPages; pageNum += 1) {
    const url = pageNum === 1 ? categoryUrl : `${categoryUrl}?page=${pageNum}#product-grid`

    try {
      await navigateActionListingPage(page, url)
      await page.waitForSelector('a[href*="/p/"]', { timeout: 10000 }).catch(() => null)

      for (let scrollAttempts = 0; scrollAttempts < 3; scrollAttempts++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
        await page.waitForTimeout(2000)
      }

      const pageOffers = await extractProductsFromPage(page, categoryName)
      if (pageOffers.length === 0) {
        break
      }

      let added = 0
      for (const offer of pageOffers) {
        if (seenUrls.has(offer.sourceUrl)) continue
        seenUrls.add(offer.sourceUrl)
        offers.push(offer)
        added += 1
      }

      // If no new products were added, we've reached the end
      if (added === 0) {
        break
      }
    } catch (error) {
      throw new Error(
        `Action category scrape failed for ${url}: ${error instanceof Error ? error.message : String(error)}`,
      )
    }
  }

  return offers
}

export async function scrapeActionProducts(searchQuery?: string): Promise<ScrapedOffer[]> {
  const offers: ScrapedOffer[] = []
  const seenUrls = new Set<string>()
  const normalizedQuery = cleanDisplayText(searchQuery)
  const maxPagesPerCategory = normalizedQuery ? 10 : 25

  const browser = await launchChromiumBrowser({
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    ],
  })

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      locale: 'fr-FR',
      viewport: { width: 1920, height: 1080 },
    })

    await context.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false })
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] })
      Object.defineProperty(navigator, 'languages', { get: () => ['fr-FR', 'fr', 'en'] })
      ;(window as any).chrome = { runtime: {} }
    })

    const page = await context.newPage()

    await page.route('**/*', (route) => {
      const type = route.request().resourceType()
      if (['image', 'font', 'media'].includes(type)) {
        route.abort()
      } else {
        route.continue()
      }
    })

    await page.goto(ACTION_BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })

    try {
      const cookieButton = await page.$('button:has-text("Accepter")')
      if (cookieButton) {
        await cookieButton.click()
      }
    } catch (_error) {
      // Ignore cookie banner failures.
    }

    const categoriesToScrape = normalizedQuery
      ? [{ name: null, url: `${ACTION_BASE_URL}/search/?q=${encodeURIComponent(normalizedQuery)}` }]
      : ACTION_CATEGORIES

    for (const category of categoriesToScrape) {
      const categoryOffers = await scrapeCategory(
        page,
        category.url,
        isSupportedCategory(category.name) ? category.name : null,
        maxPagesPerCategory,
      )

      const filteredOffers = normalizedQuery ? filterOffersByQuery(categoryOffers, normalizedQuery) : categoryOffers

      for (const offer of filteredOffers) {
        if (seenUrls.has(offer.sourceUrl)) continue
        seenUrls.add(offer.sourceUrl)
        offers.push(offer)
      }
    }
  } finally {
    await browser.close()
  }

  return offers
}
