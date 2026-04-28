import { type Browser, type Page } from 'playwright'

import { type SupportedCategory } from '../catalog'
import {
  cleanDisplayText,
  filterOffersByQuery,
  inferCategoryFromText,
  resolveOfferCategory,
  resolveScrapedOfferCategory,
  toAbsoluteUrl,
  toValidPrice,
} from '../scraper-utils'
import type { ScrapedOffer } from '../types'
import { launchChromiumBrowser } from './chromium-launch'
import type { RetailerScrapeDetails, ScrapeIssue } from '../types'

const CENTRAKOR_BASE_URL = 'https://www.centrakor.com'
const CENTRAKOR_MAX_PAGES = 30

const ROOT_FALLBACKS: Partial<Record<SupportedCategory, string>> = {
  hygiene: `${CENTRAKOR_BASE_URL}/bain-et-beaute.html`,
  menage: `${CENTRAKOR_BASE_URL}/rangement.html`,
  'maison-deco': `${CENTRAKOR_BASE_URL}/deco.html`,
  jardin: `${CENTRAKOR_BASE_URL}/saison-ete-plein-air.html`,
  animaux: `${CENTRAKOR_BASE_URL}/animalerie.html`,
  textile: `${CENTRAKOR_BASE_URL}/linge-de-maison.html`,
}

const ROOT_DISCOVERY_PATTERNS: Record<SupportedCategory, string[]> = {
  hygiene: ['bain-et-beaute', 'beaute', 'hygiene'],
  alimentation: ['alimentation', 'epicerie', 'boisson'],
  menage: ['rangement', 'entretien', 'nettoyage', 'menage'],
  'maison-deco': ['deco', 'decoration', 'maison'],
  jardin: ['jardin', 'plein-air', 'plein air', 'saison-ete'],
  bricolage: ['bricolage', 'outillage'],
  loisirs: ['loisir', 'jouet', 'papeterie'],
  animaux: ['animalerie', 'animaux'],
  textile: ['linge-de-maison', 'linge', 'textile'],
  mode: ['mode', 'vetement', 'chaussure', 'sac', 'bijoux'],
  'high-tech': ['high-tech', 'telephone', 'multimedia', 'electronique'],
  bazar: ['bazar', 'cuisine', 'ustensile', 'mobilier', 'camping'],
  jouets: ['jouet', 'jouets', 'playmobil', 'lego'],
}

interface ApolloOfferRow {
  sourceProductId: string
  name: string
  price: number
  image: string
  sourceUrl: string
  sourceCategoryPath: string
  brand?: string
  description?: string
  availability?: string
}

function categoryFromRootUrl(url: string): SupportedCategory | null {
  return resolveOfferCategory({
    sourceCategoryPath: url,
    textValues: [url],
  })
}

function rootPathFromUrl(url: string) {
  try {
    return new URL(url).pathname.replace(/^\//, '').replace(/\.html$/, '').replace(/\/+$/, '')
  } catch (_error) {
    return ''
  }
}

function createCentrakorIssue(
  code: string,
  message: string,
  url?: string,
  category?: SupportedCategory | null,
  page?: number,
): ScrapeIssue {
  return {
    retailer: 'centrakor',
    code,
    message,
    url,
    category: category || undefined,
    page,
  }
}

async function discoverRootCategories(page: Page) {
  const discovered = new Map<SupportedCategory, string>()

  try {
    await page.goto(CENTRAKOR_BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(1000)

    const links = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href*=".html"]')).map((anchor) => ({
        href: (anchor as HTMLAnchorElement).href || anchor.getAttribute('href') || '',
        text: anchor.textContent?.trim() || '',
      }))
    })

    for (const [category, patterns] of Object.entries(ROOT_DISCOVERY_PATTERNS) as Array<
      [SupportedCategory, string[]]
    >) {
      const match = links.find((link) => {
        const haystack = cleanDisplayText(`${link.href} ${link.text}`).toLowerCase()
        return patterns.some((pattern) => haystack.includes(pattern))
      })

      if (match?.href) {
        discovered.set(category, toAbsoluteUrl(match.href, CENTRAKOR_BASE_URL))
      }
    }
  } catch (error) {
    console.error('Failed to discover Centrakor root categories:', error)
  }

  for (const [category, fallbackUrl] of Object.entries(ROOT_FALLBACKS) as Array<[SupportedCategory, string]>) {
    if (!discovered.has(category) && fallbackUrl) {
      discovered.set(category, fallbackUrl)
    }
  }

  return discovered
}

async function getSubcategoryUrls(page: Page, rootUrl: string) {
  const subcategories = new Map<string, string>()
  const rootPath = rootPathFromUrl(rootUrl)

  try {
    await page.goto(rootUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
    await page.waitForTimeout(750)

    const links = await page.evaluate((baseUrl) => {
      return Array.from(document.querySelectorAll('a[href*=".html"]')).map((anchor) => {
        const href = (anchor as HTMLAnchorElement).href || anchor.getAttribute('href') || ''
        const text = anchor.textContent?.trim() || ''
        return {
          href,
          text,
          absolute: href.startsWith('http') ? href : `${baseUrl}${href}`,
        }
      })
    }, CENTRAKOR_BASE_URL)

    for (const link of links) {
      const absolute = toAbsoluteUrl(link.absolute, CENTRAKOR_BASE_URL)
      if (!absolute) continue

      const path = rootPathFromUrl(absolute)
      if (path === rootPath || !path.startsWith(rootPath)) continue

      subcategories.set(absolute, link.text || absolute)
    }
  } catch (error) {
    console.error(`Failed to discover Centrakor subcategories for ${rootUrl}:`, error)
  }

  if (subcategories.size === 0) {
    subcategories.set(rootUrl, rootUrl)
  }

  return Array.from(subcategories.entries()).map(([url, name]) => ({ url, name }))
}

async function extractProductsFromApollo(page: Page, categoryName: SupportedCategory): Promise<ScrapedOffer[]> {
  const extracted = await page.evaluate((): ApolloOfferRow[] => {
    const apollo = (window as any).__APOLLO_STATE__
    if (!apollo) return []

    const baseUrl = 'https://www.centrakor.com'
    const productKeys = Object.keys(apollo).filter((key) => key.startsWith('Product_') && !key.startsWith('$'))
    const rows: ApolloOfferRow[] = []

    for (const key of productKeys) {
      const product = apollo[key]
      if (!product || product.__typename !== 'Product') continue

      let price: number | null = null

      try {
        const prices = product.prices?.id ? apollo[product.prices.id] : null
        const finalPrice = prices?.finalPrice?.id ? apollo[prices.finalPrice.id] : null
        const priceInclTax = finalPrice?.priceInclTax?.id ? apollo[finalPrice.priceInclTax.id] : null
        const money = priceInclTax?.value?.id ? apollo[priceInclTax.value.id] : null
        price = typeof money?.amount === 'number' ? money.amount : null
      } catch (_error) {
        price = null
      }

      if (!price || price <= 0) continue

      const path = product.path || ''
      const sourceUrl = path.startsWith('http') ? path : `${baseUrl}${path}`
      const imageUrl = product.imageUrl || product.smallImageUrl || ''
      const image = imageUrl.startsWith('http') ? imageUrl : `${baseUrl}${imageUrl}`
      const brandName =
        product.brand?.name ||
        product.brandName ||
        product.manufacturer ||
        product.vendor ||
        undefined
      const description = product.shortDescription || product.description || undefined
      const availability =
        product.inStock === false || product.available === false
          ? 'Rupture de stock'
          : product.inStock === true || product.available === true
            ? 'En stock'
            : undefined

      rows.push({
        sourceProductId: String(product.sku || product.id || key.replace('Product_', '')),
        name: product.name || '',
        price,
        image,
        sourceUrl,
        sourceCategoryPath: path,
        brand: brandName,
        description,
        availability,
      })
    }

    return rows
  })

  const offers: ScrapedOffer[] = []

  for (const row of extracted) {
    const sourceUrl = toAbsoluteUrl(row.sourceUrl, CENTRAKOR_BASE_URL)
    const sourceProductId = cleanDisplayText(row.sourceProductId)
    const brand = cleanDisplayText(row.brand)
    const name = cleanDisplayText(row.name)
    const finalName = brand && !name.toLowerCase().includes(brand.toLowerCase()) ? `${brand} ${name}` : name

    if (!sourceUrl || !sourceProductId || !finalName) {
      continue
    }

    const categoryResolution = resolveScrapedOfferCategory({
      retailer: 'centrakor',
      sourceUrl,
      sourceCategoryPath: row.sourceCategoryPath,
      nativeCategory: categoryName,
      name: finalName,
      brand,
      description: row.description,
      availability: row.availability,
    })
    const category = categoryResolution.category

    offers.push({
      retailer: 'centrakor',
      sourceProductId,
      sourceUrl,
      sourceCategoryPath: row.sourceCategoryPath,
      category,
      categoryResolution,
      name: finalName,
      brand: brand || undefined,
      price: row.price,
      image: toAbsoluteUrl(row.image, CENTRAKOR_BASE_URL),
      description: cleanDisplayText(row.description) || undefined,
      availability: cleanDisplayText(row.availability) || undefined,
    })
  }

  return offers
}

async function scrapeSubcategoryPage(
  page: Page,
  url: string,
  categoryName: SupportedCategory,
  maxPages: number,
): Promise<{ offers: ScrapedOffer[]; issue?: ScrapeIssue; completed: boolean }> {
  const offers: ScrapedOffer[] = []
  const seenUrls = new Set<string>()
  const seenPageSignatures = new Set<string>()
  let completed = false

  for (let pageNum = 1; pageNum <= maxPages; pageNum += 1) {
    const pageUrl = pageNum === 1 ? url : `${url}?page=${pageNum}`

    try {
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForTimeout(750)

      const pageOffers = await extractProductsFromApollo(page, categoryName)
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
          issue: createCentrakorIssue(
            'max_pages_reached',
            `Reached safety page limit while scraping ${url}`,
            pageUrl,
            categoryName,
            pageNum,
          ),
        }
      }
    } catch (error) {
      return {
        offers,
        completed: false,
        issue: createCentrakorIssue(
          'page_error',
          `Centrakor subcategory scrape failed for ${pageUrl}: ${error instanceof Error ? error.message : String(error)}`,
          pageUrl,
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

async function scrapeRootCategoryDetailed(
  browser: Browser,
  categoryName: SupportedCategory,
  rootUrl: string,
): Promise<RetailerScrapeDetails> {
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    locale: 'fr-FR',
    viewport: { width: 1920, height: 1080 },
  })

  try {
    const page = await context.newPage()
    const subcategories = await getSubcategoryUrls(page, rootUrl)
    const offers: ScrapedOffer[] = []
    const seenUrls = new Set<string>()
    const issues: ScrapeIssue[] = []
    let discoveredListings = subcategories.length
    let completedListings = 0

    for (const subcategory of subcategories) {
      const pageResult = await scrapeSubcategoryPage(page, subcategory.url, categoryName, CENTRAKOR_MAX_PAGES)

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

    return {
      retailer: 'centrakor',
      offers,
      issues,
      coverage: {
        discoveredListings,
        completedListings,
        collectionRate: discoveredListings === 0 ? 0 : Math.round((completedListings / discoveredListings) * 100),
        isComplete: issues.length === 0 && discoveredListings > 0 && completedListings === discoveredListings,
      },
    }
  } finally {
    await context.close()
  }
}

export async function scrapeCentrakorProductsDetailed(searchQuery?: string): Promise<RetailerScrapeDetails> {
  const normalizedQuery = cleanDisplayText(searchQuery)
  const issues: ScrapeIssue[] = []
  const browser = await launchChromiumBrowser({
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
    ],
  })

  try {
    const discoveryContext = await browser.newContext({
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      locale: 'fr-FR',
      viewport: { width: 1920, height: 1080 },
    })

    const discoveryPage = await discoveryContext.newPage()
    const discoveredRoots = await discoverRootCategories(discoveryPage)
    await discoveryContext.close()

    const hintedCategory = normalizedQuery ? inferCategoryFromText(normalizedQuery) : null
    const rootsToScrape =
      hintedCategory && discoveredRoots.has(hintedCategory)
        ? new Map([[hintedCategory, discoveredRoots.get(hintedCategory)!]])
        : discoveredRoots

    const offers: ScrapedOffer[] = []
    const seenUrls = new Set<string>()
    let discoveredListings = 0
    let completedListings = 0

    const settled = await Promise.allSettled(
      Array.from(rootsToScrape.entries()).map(([categoryName, rootUrl]) =>
        scrapeRootCategoryDetailed(browser, categoryName, rootUrl),
      ),
    )

    for (const result of settled) {
      if (result.status !== 'fulfilled') {
        issues.push(
          createCentrakorIssue(
            'scraper_error',
            `Centrakor root scrape failed: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`,
          ),
        )
        continue
      }

      discoveredListings += result.value.coverage.discoveredListings
      completedListings += result.value.coverage.completedListings
      issues.push(...result.value.issues)

      for (const offer of result.value.offers) {
        if (seenUrls.has(offer.sourceUrl)) continue
        seenUrls.add(offer.sourceUrl)
        offers.push(offer)
      }
    }

    const filteredOffers = normalizedQuery ? filterOffersByQuery(offers, normalizedQuery) : offers

    return {
      retailer: 'centrakor',
      offers: filteredOffers,
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
      createCentrakorIssue(
        'scraper_error',
        `Error in Centrakor scraper: ${error instanceof Error ? error.message : String(error)}`,
      ),
    )

    return {
      retailer: 'centrakor',
      offers: [],
      issues,
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

export async function scrapeCentrakorProducts(searchQuery?: string): Promise<ScrapedOffer[]> {
  const result = await scrapeCentrakorProductsDetailed(searchQuery)
  return result.offers
}
