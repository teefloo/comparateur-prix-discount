import { type Page } from 'playwright'

import { isSupportedCategory, type SupportedCategory } from '../catalog'
import {
  cleanDisplayText,
  ensureUnitPriceText,
  extractQuantity,
  filterOffersByQuery,
  resolveScrapedOfferCategory,
  toAbsoluteUrl,
  toValidPrice,
} from '../scraper-utils'
import { enrichOffersFromProductPages } from './product-page-details'
import type { RetailerScrapeDetails, ScrapeIssue, ScrapedOffer } from '../types'
import { launchChromiumBrowser } from './chromium-launch'

const BM_BASE_URL = 'https://bmstores.fr'
const BM_MAX_PAGES = 60

const BM_CATEGORIES: Array<{ name: SupportedCategory; url: string }> = [
  { name: 'maison-deco', url: `${BM_BASE_URL}/produits/2211-maison-deco` },
  { name: 'loisirs', url: `${BM_BASE_URL}/produits/2317-loisirs-fetes-cadeaux` },
  { name: 'alimentation', url: `${BM_BASE_URL}/produits/2406-alimentation-boisson` },
  { name: 'hygiene', url: `${BM_BASE_URL}/produits/2443-hygiene-beaute-mode` },
  { name: 'loisirs', url: `${BM_BASE_URL}/produits/2343-univers-enfant` },
  { name: 'jardin', url: `${BM_BASE_URL}/produits/2553-jardin-plein-air` },
  { name: 'bricolage', url: `${BM_BASE_URL}/produits/2596-brico-auto` },
  { name: 'animaux', url: `${BM_BASE_URL}/produits/1416-animalerie` },
  { name: 'menage', url: `${BM_BASE_URL}/produits/2270-rangement-entretien` },
  { name: 'maison-deco', url: `${BM_BASE_URL}/produits/2212-mobilier` },
  { name: 'maison-deco', url: `${BM_BASE_URL}/produits/2305-petit-electromenager` },
  { name: 'textile', url: `${BM_BASE_URL}/produits/2233-textile-de-maison` },
  { name: 'maison-deco', url: `${BM_BASE_URL}/produits/2220-rangement` },
  { name: 'maison-deco', url: `${BM_BASE_URL}/produits/2222-decoration` },
  { name: 'high-tech', url: `${BM_BASE_URL}/produits/2327-multimedia-electronique` },
  { name: 'loisirs', url: `${BM_BASE_URL}/produits/2368-idee-cadeau` },
  { name: 'loisirs', url: `${BM_BASE_URL}/produits/2344-jeu-jouet` },
  { name: 'hygiene', url: `${BM_BASE_URL}/produits/2628-hygiene-soin` },
]

interface BMExtractedRow {
  name: string
  priceText: string
  originalPriceText?: string
  promotionText?: string
  image: string
  url: string
  brand?: string
  detailsText?: string
  availability?: string
  unitPrice?: string
  quantity?: string | null
}

function parseBMSourceProductId(url: string) {
  try {
    return new URL(url).pathname.replace(/\/+$/, '').split('/').filter(Boolean).join(':')
  } catch (_error) {
    return ''
  }
}

function createBmIssue(
  code: string,
  message: string,
  url?: string,
  category?: SupportedCategory | null,
  page?: number,
): ScrapeIssue {
  return {
    retailer: 'bm',
    code,
    message,
    url,
    category: category || undefined,
    page,
  }
}

async function extractProductsFromPage(
  page: Page,
  categoryUrl: string,
  explicitCategory: SupportedCategory | null,
): Promise<ScrapedOffer[]> {
  const rows = await page.evaluate((): BMExtractedRow[] => {
    const cards = Array.from(document.querySelectorAll('article.product-miniature')) as HTMLElement[]

    return cards.map((card) => {
      const linkEl = card.querySelector('a[href]') as HTMLAnchorElement | null
      const nameEl = card.querySelector('h6, .product-title, [class*="product-title"]') as HTMLElement | null
      const priceEl = card.querySelector('span.price') as HTMLElement | null
      const originalPriceEl = card.querySelector('[class*="original"], [class*="was"], .old-price') as HTMLElement | null
      const promotionEl = card.querySelector('[class*="promo"], [class*="sale"], [class*="discount"], .badge-promo') as HTMLElement | null
      const imageEl = card.querySelector('img') as HTMLImageElement | null
      const brandEl = card.querySelector('.product-brand, [class*="brand"]') as HTMLElement | null
      const detailsEl = card.querySelector('[class*="details"], .product-details') as HTMLElement | null
      const availEl = card.querySelector('[class*="available"], [class*="stock"], .stock') as HTMLElement | null
      const fullText = `${nameEl?.innerText || ''} ${detailsEl?.innerText || ''}`.trim()

      return {
        name: nameEl?.innerText?.trim() || '',
        priceText: priceEl?.innerText?.trim() || '',
        originalPriceText: originalPriceEl?.innerText?.trim() || undefined,
        promotionText: promotionEl?.innerText?.trim() || undefined,
        image: imageEl?.currentSrc || imageEl?.getAttribute('src') || imageEl?.getAttribute('data-src') || '',
        url: linkEl?.href || '',
        brand: brandEl?.innerText?.trim() || undefined,
        detailsText: detailsEl?.innerText?.trim() || undefined,
        availability: availEl?.innerText?.trim() || undefined,
        unitPrice: fullText.match(/(\d+[.,]?\d*\s*€?\s*\/\s*(?:l|kg|g|ml|pieces?|pcs?|pc))/i)?.[1],
        quantity: fullText.match(/\b(\d+(?:[.,]\d+)?)\s*(?:ml|l|cl|g|kg|pieces?|pcs?|pc)\b/i)?.[0],
      }
    })
  })

  const offers: ScrapedOffer[] = []

  for (const row of rows) {
    const sourceUrl = toAbsoluteUrl(row.url, BM_BASE_URL)
    const sourceProductId = parseBMSourceProductId(sourceUrl)
    const cleanName = cleanDisplayText(row.name)
    const brand = cleanDisplayText(row.brand)
    const finalName = brand && !cleanName.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${cleanName}` : cleanName
    const priceMatch = cleanDisplayText(row.priceText).replace(',', '.').match(/(\d+[.,]\d{2})/)
    const price = toValidPrice(priceMatch ? priceMatch[1] : null)

    if (!sourceUrl || !sourceProductId || !finalName || price === null) {
      continue
    }

    const sourceCategoryPath = [categoryUrl, row.detailsText].filter(Boolean).join(' | ')
    const categoryResolution = resolveScrapedOfferCategory({
      retailer: 'bm',
      sourceUrl,
      sourceCategoryPath,
      name: finalName,
      brand,
      description: row.detailsText,
      availability: row.availability,
      tags: [explicitCategory || ''],
    })
    const category = categoryResolution.category

    const originalPriceMatch = cleanDisplayText(row.originalPriceText).replace(',', '.').match(/(\d+[.,]\d{2})/)
    const originalPrice = originalPriceMatch ? toValidPrice(originalPriceMatch[1]) : null
    const quantity = row.quantity || extractQuantity(`${finalName} ${row.detailsText || ''}`) || undefined
    const unitPrice = ensureUnitPriceText(row.unitPrice || row.detailsText, price, quantity)
    const discount =
      originalPrice !== null && originalPrice > price
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : undefined

    offers.push({
      retailer: 'bm',
      sourceProductId,
      sourceUrl,
      sourceCategoryPath: sourceCategoryPath || undefined,
      category,
      categoryResolution,
      name: finalName,
      brand: brand || undefined,
      price,
      image: toAbsoluteUrl(row.image, BM_BASE_URL),
      description: cleanDisplayText(row.detailsText) || undefined,
      availability: cleanDisplayText(row.availability) || undefined,
      quantity,
      unitPrice,
      originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
      isOnPromotion:
        discount !== undefined || Boolean(row.promotionText && cleanDisplayText(row.promotionText))
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
): Promise<{ offers: ScrapedOffer[]; issue?: ScrapeIssue; completed: boolean }> {
  const offers: ScrapedOffer[] = []
  const seenUrls = new Set<string>()
  const seenPageSignatures = new Set<string>()
  let completed = false

  for (let pageNum = 1; pageNum <= maxPages; pageNum += 1) {
    const url = pageNum === 1 ? categoryUrl : `${categoryUrl}?page=${pageNum}`

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      const productsFound = await page.waitForSelector('article.product-miniature', { timeout: 10000 }).catch(() => null)
      if (!productsFound) {
        completed = true
        break
      }

      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight / 2))
      await page.waitForTimeout(600)

      const pageOffers = await extractProductsFromPage(page, categoryUrl, categoryName)
      if (pageOffers.length === 0) {
        completed = true
        break
      }

      const pageSignature = pageOffers.slice(0, 8).map((offer) => offer.sourceUrl).join('|')
      if (!pageSignature || seenPageSignatures.has(pageSignature)) {
        completed = true
        break
      }
      seenPageSignatures.add(pageSignature)

      let added = 0
      for (const offer of pageOffers) {
        if (seenUrls.has(offer.sourceUrl)) continue
        seenUrls.add(offer.sourceUrl)
        offers.push(offer)
        added += 1
      }

      if (added === 0) {
        completed = true
        break
      }

      if (pageNum === maxPages) {
        return {
          offers,
          completed: false,
          issue: createBmIssue(
            'max_pages_reached',
            `Reached safety page limit while scraping ${categoryUrl}`,
            url,
            categoryName,
            pageNum,
          ),
        }
      }
    } catch (error) {
      return {
        offers,
        completed: false,
        issue: createBmIssue(
          'page_error',
          `B&M category scrape failed for ${url}: ${error instanceof Error ? error.message : String(error)}`,
          url,
          categoryName,
          pageNum,
        ),
      }
    }
  }

  return {
    offers,
    completed,
  }
}

export async function scrapeBMProductsDetailed(searchQuery?: string): Promise<RetailerScrapeDetails> {
  const offers: ScrapedOffer[] = []
  const seenUrls = new Set<string>()
  const issues: ScrapeIssue[] = []
  const normalizedQuery = cleanDisplayText(searchQuery)
  const maxPagesPerCategory = normalizedQuery ? 20 : BM_MAX_PAGES
  let discoveredListings = 0
  let completedListings = 0

  const browser = await launchChromiumBrowser({
    args: ['--disable-blink-features=AutomationControlled', '--disable-dev-shm-usage', '--no-sandbox', '--disable-setuid-sandbox'],
  })

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      locale: 'fr-FR',
      viewport: { width: 1920, height: 1080 },
    })

    const page = await context.newPage()

    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined })
    })

    await page.route('**/*', (route) => {
      const type = route.request().resourceType()
      if (['image', 'font', 'media'].includes(type)) {
        route.abort()
      } else {
        route.continue()
      }
    })

    await page.goto(BM_BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })

    try {
      const cookieBtn = await page.$('#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll')
      if (cookieBtn) {
        await cookieBtn.click()
      }
    } catch (_error) {
      // Ignore cookie banner failures.
    }

    const categoriesToScrape = normalizedQuery
      ? [{ name: null, url: `${BM_BASE_URL}/recherche?s=${encodeURIComponent(normalizedQuery)}` }]
      : BM_CATEGORIES

    discoveredListings = categoriesToScrape.length

    for (const category of categoriesToScrape) {
      const categoryResult = await scrapeCategory(
        page,
        category.url,
        isSupportedCategory(category.name) ? category.name : null,
        maxPagesPerCategory,
      )

      if (categoryResult.issue) {
        issues.push(categoryResult.issue)
      }

      if (categoryResult.completed) {
        completedListings += 1
      }

      const filteredOffers = normalizedQuery
        ? filterOffersByQuery(categoryResult.offers, normalizedQuery)
        : categoryResult.offers

      for (const offer of filteredOffers) {
        if (seenUrls.has(offer.sourceUrl)) continue
        seenUrls.add(offer.sourceUrl)
        offers.push(offer)
      }
    }
  } catch (error) {
    issues.push(
      createBmIssue(
        'scraper_error',
        `Error in B&M scraper: ${error instanceof Error ? error.message : String(error)}`,
      ),
    )
  } finally {
    await browser.close()
  }

  return {
    retailer: 'bm',
    offers,
    issues,
    coverage: {
      discoveredListings,
      completedListings,
      collectionRate: discoveredListings === 0 ? 0 : Math.round((completedListings / discoveredListings) * 100),
      isComplete: issues.length === 0 && discoveredListings > 0 && completedListings === discoveredListings,
    },
  }
}

export async function scrapeBMProducts(searchQuery?: string): Promise<ScrapedOffer[]> {
  const result = await scrapeBMProductsDetailed(searchQuery)
  return result.offers
}
