import { type Page } from 'playwright'

import { type SupportedCategory } from '../catalog'
import { discoverDealUrlsFromHtml, getDealEntrypoint } from '../deals'
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

const ALDI_BASE_URL = 'https://www.aldi.fr'
const ALDI_SEARCH_URL = 'https://www.aldi.fr/recherche/?q='
const LOAD_MORE_BUTTON_SELECTOR = 'button[data-testid="product-tile-grid-load-more-button"]'
const ALDI_MAX_LOAD_MORE_CLICKS = 120
const ALDI_FALLBACK_ROOT_PATHS = [
  'viande-poisson',
  'produits-laitiers',
  'charcuterie',
  'epicerie-salee',
  'epicerie-sucree',
  'pain-viennoiserie',
  'surgeles',
  'boissons',
  'hygiene-beaute-bebe',
  'entretien',
  'biere-vin-alcool',
  'animalerie',
  'recompenses',
  'marque-aldi-vs-grandes-marques',
  'nouveau-look',
  'maison-loisirs-dupes-pepites',
] as const

interface AldiTile {
  sourceUrl: string
  image: string
  brandName: string
  productName: string
  priceText: string
  originalPriceText: string
  unitPriceText: string
  promotionText: string
  quantityLabel: string
}

function parseAldiSourceProductId(url: string) {
  try {
    return new URL(url).pathname.replace(/\/+$/, '').split('/').filter(Boolean).join(':')
  } catch (_error) {
    return ''
  }
}

function createAldiIssue(
  code: string,
  message: string,
  url?: string,
  category?: SupportedCategory | null,
  page?: number,
): ScrapeIssue {
  return {
    retailer: 'aldi',
    code,
    message,
    url,
    category: category || undefined,
    page,
  }
}

function parseAldiPrice(priceText: string): number | null {
  const cleaned = cleanDisplayText(priceText).replace(/\s/g, '').replace(',', '.')
  if (!cleaned) return null

  const match = cleaned.match(/(\d+[.,]?\d{0,2})/)
  return match ? toValidPrice(match[1]) : null
}

function buildFullProductName(tile: AldiTile) {
  const productName = cleanDisplayText(tile.productName)
  const brandName = cleanDisplayText(tile.brandName)

  if (brandName && !productName.toLowerCase().includes(brandName.toLowerCase())) {
    return `${brandName} ${productName}`
  }

  return productName
}

async function acceptCookies(page: Page) {
  try {
    const cookieButton = await page.$('button:has-text("Accepter"), button[data-testid="uc-accept-all-button"]')
    if (cookieButton) {
      await cookieButton.click()
      await page.waitForTimeout(300)
    }
  } catch (_error) {
    // Ignore cookie banner failures.
  }
}

async function clickLoadMoreUntilEnd(page: Page, maxClicks: number) {
  let lastTileCount = 0
  let stagnantLoops = 0

  for (let clickCount = 0; clickCount < maxClicks; clickCount += 1) {
    const tileCount = await page.locator('.product-tile').count()
    if (tileCount <= lastTileCount) {
      stagnantLoops += 1
    } else {
      stagnantLoops = 0
      lastTileCount = tileCount
    }

    if (stagnantLoops >= 2) {
      return true
    }

    try {
      const loadMoreButtonLocator = page.locator(LOAD_MORE_BUTTON_SELECTOR).first()
      const loadMoreButtonCount = await page.locator(LOAD_MORE_BUTTON_SELECTOR).count()
      if (loadMoreButtonCount === 0) {
        return true
      }

      await loadMoreButtonLocator.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => {})
      await loadMoreButtonLocator.click({ timeout: 5000 })
      await page.waitForTimeout(1200)
    } catch (_error) {
      const remainingButtonCount = await page.locator(LOAD_MORE_BUTTON_SELECTOR).count().catch(() => 0)
      if (remainingButtonCount === 0) {
        return true
      }

      await page.waitForTimeout(1200)
    }
  }

  return false
}

async function discoverRootPaths(page: Page) {
  const rootUrl = `${ALDI_BASE_URL}/produits.html`

  try {
    await page.goto(rootUrl, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(1000)
    await acceptCookies(page)

    const roots = await page.evaluate(() => {
      const found = new Set<string>()
      for (const anchor of Array.from(document.querySelectorAll('a[href]'))) {
        const href = (anchor as HTMLAnchorElement).href || anchor.getAttribute('href') || ''
        const match = href.match(/\/produits\/([^\/?#]+)\.html/i)
        if (!match) continue
        found.add(match[1])
      }

      return Array.from(found)
    })

    if (roots.length > 0) {
      return roots
    }
  } catch (error) {
    console.error('Failed to discover Aldi root paths:', error)
  }

  return [...ALDI_FALLBACK_ROOT_PATHS]
}

async function getSubcategoryUrls(page: Page, rootPath: string) {
  const rootUrl = `${ALDI_BASE_URL}/produits/${rootPath}.html`

  try {
    await page.goto(rootUrl, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(1000)
    await acceptCookies(page)

    const subcategories = await page.evaluate(
      ({ baseUrl, root }) => {
        const links = Array.from(document.querySelectorAll('a[title]'))
        const found = new Map<string, string>()

        for (const link of links) {
          const href = link.getAttribute('href') || ''
          const title = link.getAttribute('title') || ''
          if (!href || !title || !href.includes(`/produits/${root}/`) || !href.endsWith('.html')) continue

          const absolute = href.startsWith('http') ? href : `${baseUrl}${href}`
          found.set(absolute, title)
        }

        return Array.from(found.entries()).map(([url, title]) => ({ url, title }))
      },
      { baseUrl: ALDI_BASE_URL, root: rootPath },
    )

    if (subcategories.length > 0) {
      return subcategories
    }
  } catch (error) {
    console.error(`Failed to discover Aldi subcategories for ${rootPath}:`, error)
  }

  return [{ url: rootUrl, title: rootPath }]
}

async function extractTilesFromPage(page: Page): Promise<AldiTile[]> {
  return await page.evaluate((): AldiTile[] => {
    const tiles = Array.from(document.querySelectorAll('.product-tile'))
    const extracted: AldiTile[] = []

    for (const tile of tiles) {
      const anchor = tile.querySelector('.product-tile__action') as HTMLAnchorElement | null
      const imageEl =
        (tile.querySelector('.product-tile__image-section__picture') as HTMLImageElement | null) ||
        (tile.querySelector('img') as HTMLImageElement | null)
      const brandEl = tile.querySelector('.product-tile__content__upper__brand-name') as HTMLElement | null
      const nameEl = tile.querySelector('.product-tile__content__upper__product-name') as HTMLElement | null
      const tagPrice = tile.querySelector('.tag__price') as HTMLElement | null
      const unitPriceEl = tile.querySelector('.tag__marker--base-price') as HTMLElement | null
      const promotionContainer = tile.querySelector('.product-tile__flags') as HTMLElement | null
      const quantityEl = tile.querySelector('.tag__marker--salesunit') as HTMLElement | null

      const allPriceLabels = Array.from(tagPrice?.querySelectorAll('.tag__label--price') || []).map((element) =>
        element.textContent?.trim() || '',
      )
      const currentPriceText = allPriceLabels.length > 1 ? allPriceLabels[allPriceLabels.length - 1] : allPriceLabels[0] || ''
      const originalPriceText = allPriceLabels.length > 1 ? allPriceLabels[0] : ''

      if (!anchor?.href || !nameEl?.textContent || !currentPriceText) {
        continue
      }

      extracted.push({
        sourceUrl: anchor.href,
        image: imageEl?.currentSrc || imageEl?.src || imageEl?.getAttribute('data-src') || '',
        brandName: brandEl?.textContent?.trim() || '',
        productName: nameEl?.textContent?.trim() || '',
        priceText: currentPriceText,
        originalPriceText,
        unitPriceText: unitPriceEl?.textContent?.trim() || '',
        promotionText: promotionContainer?.textContent?.trim() || '',
        quantityLabel: quantityEl?.textContent?.trim() || '',
      })
    }

    return extracted
  })
}

function buildOfferFromTile(
  tile: AldiTile,
  sourceCategoryPath?: string,
  nativeCategory?: string,
): ScrapedOffer | null {
  const sourceUrl = toAbsoluteUrl(tile.sourceUrl, ALDI_BASE_URL)
  const sourceProductId = parseAldiSourceProductId(sourceUrl)
  const name = buildFullProductName(tile)
  const price = parseAldiPrice(tile.priceText)

  if (!sourceUrl || !sourceProductId || !name || price === null) {
    return null
  }

  const categoryResolution = resolveScrapedOfferCategory({
    retailer: 'aldi',
    sourceUrl,
    sourceCategoryPath,
    nativeCategory,
    name,
    brand: tile.brandName,
    description: tile.promotionText,
    tags: [tile.quantityLabel],
  })
  const category = categoryResolution.category

  const originalPrice = parseAldiPrice(tile.originalPriceText)
  const quantity = cleanDisplayText(tile.quantityLabel) || extractQuantity(name) || undefined
  const unitPrice = ensureUnitPriceText(tile.unitPriceText, price, quantity)
  const discount =
    originalPrice !== null && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : undefined

  return {
    retailer: 'aldi',
    sourceProductId,
    sourceUrl,
    sourceCategoryPath: sourceCategoryPath || undefined,
    category,
    categoryResolution,
    name,
    brand: cleanDisplayText(tile.brandName) || undefined,
    price,
    image: toAbsoluteUrl(tile.image, ALDI_BASE_URL),
    description: cleanDisplayText(tile.promotionText) || undefined,
    quantity,
    unitPrice,
    originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
    isOnPromotion: discount !== undefined || /promo|offre|reduction|solde/i.test(cleanDisplayText(tile.promotionText)) ? true : undefined,
    discount,
  }
}

async function scrapeListingPage(
  page: Page,
  url: string,
  explicitCategory: SupportedCategory | null,
  nativeCategory?: string,
): Promise<{ offers: ScrapedOffer[]; issue?: ScrapeIssue; completed: boolean }> {
  const offers: ScrapedOffer[] = []
  const seenUrls = new Set<string>()

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(1000)
    await acceptCookies(page)
    const loadedAll = await clickLoadMoreUntilEnd(page, ALDI_MAX_LOAD_MORE_CLICKS)

    const tiles = await extractTilesFromPage(page)
    for (const tile of tiles) {
      const offer = buildOfferFromTile(tile, url, nativeCategory)
      if (!offer || seenUrls.has(offer.sourceUrl)) continue
      seenUrls.add(offer.sourceUrl)
      offers.push(offer)
    }

    return {
      offers,
      completed: loadedAll,
      issue: loadedAll
        ? undefined
        : createAldiIssue('load_more_limit', `Reached load-more safety limit while scraping ${url}`, url, explicitCategory),
    }
  } catch (error) {
    return {
      offers,
      completed: false,
      issue: createAldiIssue(
        'page_error',
        `Failed to scrape Aldi listing ${url}: ${error instanceof Error ? error.message : String(error)}`,
        url,
        explicitCategory,
      ),
    }
  }
}

async function scrapeAldiSearch(
  page: Page,
  searchQuery: string,
): Promise<{ offers: ScrapedOffer[]; issue?: ScrapeIssue; completed: boolean }> {
  const offers: ScrapedOffer[] = []
  const seenUrls = new Set<string>()

  try {
    const searchUrl = `${ALDI_SEARCH_URL}${encodeURIComponent(searchQuery)}`
    await page.goto(searchUrl, {
      waitUntil: 'networkidle',
      timeout: 45000,
    })
    await page.waitForTimeout(1000)
    await acceptCookies(page)
    const loadedAll = await clickLoadMoreUntilEnd(page, 40)

    const tiles = await extractTilesFromPage(page)
    for (const tile of tiles) {
      const offer = buildOfferFromTile(tile, searchUrl)
      if (!offer || seenUrls.has(offer.sourceUrl)) continue
      seenUrls.add(offer.sourceUrl)
      offers.push(offer)
    }

    return {
      offers,
      completed: loadedAll,
      issue: loadedAll
        ? undefined
        : createAldiIssue('load_more_limit', `Reached load-more safety limit while searching for "${searchQuery}"`, searchUrl),
    }
  } catch (error) {
    return {
      offers,
      completed: false,
      issue: createAldiIssue(
        'page_error',
        `Failed to scrape Aldi search for "${searchQuery}": ${error instanceof Error ? error.message : String(error)}`,
      ),
    }
  }
}

export async function scrapeAldiProductsDetailed(searchQuery?: string): Promise<RetailerScrapeDetails> {
  const browser = await launchChromiumBrowser({
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  })

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      locale: 'fr-FR',
      viewport: { width: 1920, height: 1080 },
      timezoneId: 'Europe/Paris',
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

    const offers: ScrapedOffer[] = []
    const seenUrls = new Set<string>()
    const issues: ScrapeIssue[] = []
    let discoveredListings = 0
    let completedListings = 0

    if (searchQuery) {
      discoveredListings = 1
      const searchResult = await scrapeAldiSearch(page, searchQuery)

      if (searchResult.issue) {
        issues.push(searchResult.issue)
      }

      if (searchResult.completed) {
        completedListings = 1
      }

      const filteredOffers = filterOffersByQuery(searchResult.offers, searchQuery)
      const enrichedOffers = await enrichOffersFromProductPages(filteredOffers, () => true, 2)

      return {
        retailer: 'aldi',
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

    const rootPaths = await discoverRootPaths(page)
    discoveredListings = 0

    for (const rootPath of rootPaths) {
      const subcategories = await getSubcategoryUrls(page, rootPath)
      discoveredListings += subcategories.length

      for (const subcategory of subcategories) {
        const pageResult = await scrapeListingPage(page, subcategory.url, null, subcategory.title)

        if (pageResult.issue) {
          issues.push(pageResult.issue)
        }

        if (pageResult.completed) {
          completedListings += 1
        }

        for (const offer of pageResult.offers) {
          if (seenUrls.has(offer.sourceUrl)) continue
          seenUrls.add(offer.sourceUrl)
          offers.push(offer)
        }
      }
    }

    const enrichedOffers = await enrichOffersFromProductPages(offers, () => true, 2)

    return {
      retailer: 'aldi',
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
    return {
      retailer: 'aldi',
      offers: [],
      issues: [
        createAldiIssue(
          'scraper_error',
          `Error in Aldi scraper: ${error instanceof Error ? error.message : String(error)}`,
        ),
      ],
      coverage: {
        discoveredListings: 0,
        completedListings: 0,
        collectionRate: 0,
        isComplete: false,
      },
    }
  } finally {
    await browser.close()
  }
}

export async function scrapeAldiProducts(searchQuery?: string): Promise<ScrapedOffer[]> {
  const result = await scrapeAldiProductsDetailed(searchQuery)
  return result.offers
}

export async function scrapeAldiDealsDetailed(): Promise<RetailerScrapeDetails> {
  const browser = await launchChromiumBrowser({
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  })

  const deals = getDealEntrypoint('aldi')
  const offers: ScrapedOffer[] = []
  const issues: ScrapeIssue[] = []
  const seenUrls = new Set<string>()
  let discoveredListings = 0
  let completedListings = 0

  try {
    const context = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
      locale: 'fr-FR',
      viewport: { width: 1920, height: 1080 },
      timezoneId: 'Europe/Paris',
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

    await page.goto(deals.url, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(1000)
    await acceptCookies(page)

    const html = await page.content()
    const sourceUrls = discoverDealUrlsFromHtml('aldi', html, ALDI_BASE_URL)
    discoveredListings = sourceUrls.length

    for (const sourceUrl of sourceUrls) {
      const result = await scrapeListingPage(page, sourceUrl, null)
      if (result.issue) {
        issues.push(result.issue)
      }

      if (result.completed) {
        completedListings += 1
      }

      for (const offer of result.offers) {
        if (seenUrls.has(offer.sourceUrl)) continue
        seenUrls.add(offer.sourceUrl)
        offers.push({
          ...offer,
          isOnPromotion: true,
        })
      }
    }
  } catch (error) {
    issues.push(
      createAldiIssue(
        'scraper_error',
        `Aldi deals scraper failed: ${error instanceof Error ? error.message : String(error)}`,
        deals.url,
      ),
    )
  } finally {
    await browser.close()
  }

  return {
    retailer: 'aldi',
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
