import { type Page } from 'playwright'

import { type SupportedCategory } from '../catalog'
import {
  cleanDisplayText,
  ensureUnitPriceText,
  extractQuantity,
  filterOffersByQuery,
  resolveOfferCategory,
  toAbsoluteUrl,
  toValidPrice,
} from '../scraper-utils'
import { enrichOffersFromProductPages } from './product-page-details'
import type { ScrapedOffer } from '../types'
import { launchChromiumBrowser } from './chromium-launch'

const ALDI_BASE_URL = 'https://www.aldi.fr'
const ALDI_SEARCH_URL = 'https://www.aldi.fr/recherche/?q='
const LOAD_MORE_BUTTON_SELECTOR = 'button[data-testid="product-tile-grid-load-more-button"]'

const ALDI_ROOT_CATEGORIES: Array<{ category: SupportedCategory; path: string }> = [
  { category: 'alimentation', path: 'viande-poisson' },
  { category: 'alimentation', path: 'produits-laitiers' },
  { category: 'alimentation', path: 'charcuterie' },
  { category: 'alimentation', path: 'epicerie-salee' },
  { category: 'alimentation', path: 'epicerie-sucree' },
  { category: 'alimentation', path: 'pain-viennoiserie' },
  { category: 'alimentation', path: 'surgeles' },
  { category: 'alimentation', path: 'boissons' },
  { category: 'hygiene', path: 'hygiene-beaute-bebe' },
  { category: 'menage', path: 'entretien' },
  { category: 'alimentation', path: 'biere-vin-alcool' },
  { category: 'animaux', path: 'animalerie' },
]

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
      break
    }

    try {
      const loadMoreButton = await page.waitForSelector(LOAD_MORE_BUTTON_SELECTOR, { timeout: 3000 })
      if (!loadMoreButton || !(await loadMoreButton.isVisible())) {
        break
      }

      await loadMoreButton.click()
      await page.waitForTimeout(1200)
    } catch (_error) {
      break
    }
  }
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

function buildOfferFromTile(tile: AldiTile, explicitCategory: SupportedCategory | null): ScrapedOffer | null {
  const sourceUrl = toAbsoluteUrl(tile.sourceUrl, ALDI_BASE_URL)
  const sourceProductId = parseAldiSourceProductId(sourceUrl)
  const name = buildFullProductName(tile)
  const price = parseAldiPrice(tile.priceText)

  if (!sourceUrl || !sourceProductId || !name || price === null) {
    return null
  }

  const category =
    explicitCategory ||
    resolveOfferCategory({
      sourceCategoryPath: tile.promotionText,
      textValues: [name, tile.promotionText, tile.quantityLabel],
    })

  if (!category) {
    return null
  }

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
    sourceCategoryPath: explicitCategory || undefined,
    category,
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

async function scrapeListingPage(page: Page, url: string, explicitCategory: SupportedCategory | null) {
  const offers: ScrapedOffer[] = []
  const seenUrls = new Set<string>()

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
    await page.waitForTimeout(1000)
    await acceptCookies(page)
    await clickLoadMoreUntilEnd(page, 60)

    const tiles = await extractTilesFromPage(page)
    for (const tile of tiles) {
      const offer = buildOfferFromTile(tile, explicitCategory)
      if (!offer || seenUrls.has(offer.sourceUrl)) continue
      seenUrls.add(offer.sourceUrl)
      offers.push(offer)
    }
  } catch (error) {
    console.error(`Failed to scrape Aldi listing ${url}:`, error)
  }

  return offers
}

async function scrapeAldiSearch(page: Page, searchQuery: string) {
  const offers: ScrapedOffer[] = []
  const seenUrls = new Set<string>()

  try {
    await page.goto(`${ALDI_SEARCH_URL}${encodeURIComponent(searchQuery)}`, {
      waitUntil: 'networkidle',
      timeout: 45000,
    })
    await page.waitForTimeout(1000)
    await acceptCookies(page)
    await clickLoadMoreUntilEnd(page, 20)

    const tiles = await extractTilesFromPage(page)
    for (const tile of tiles) {
      const offer = buildOfferFromTile(tile, null)
      if (!offer || seenUrls.has(offer.sourceUrl)) continue
      seenUrls.add(offer.sourceUrl)
      offers.push(offer)
    }
  } catch (error) {
    console.error(`Failed to scrape Aldi search for "${searchQuery}":`, error)
  }

  return offers
}

export async function scrapeAldiProducts(searchQuery?: string): Promise<ScrapedOffer[]> {
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

    if (searchQuery) {
      const searchOffers = await scrapeAldiSearch(page, searchQuery)
      const filteredOffers = filterOffersByQuery(searchOffers, searchQuery)
      return enrichOffersFromProductPages(filteredOffers, () => true, 4)
    }

    const offers: ScrapedOffer[] = []
    const seenUrls = new Set<string>()

    for (const root of ALDI_ROOT_CATEGORIES) {
      const subcategories = await getSubcategoryUrls(page, root.path)

      for (const subcategory of subcategories) {
        const pageOffers = await scrapeListingPage(page, subcategory.url, root.category)

        for (const offer of pageOffers) {
          if (seenUrls.has(offer.sourceUrl)) continue
          seenUrls.add(offer.sourceUrl)
          offers.push({
            ...offer,
            sourceCategoryPath: subcategory.url,
          })
        }
      }
    }

    return enrichOffersFromProductPages(offers, () => true, 4)
  } catch (error) {
    console.error('Error in Aldi scraper:', error)
    return []
  } finally {
    await browser.close()
  }
}
