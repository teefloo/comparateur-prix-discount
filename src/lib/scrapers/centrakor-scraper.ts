import { type Browser, type Page } from 'playwright'

import { type SupportedCategory } from '../catalog'
import {
  cleanDisplayText,
  filterOffersByQuery,
  inferCategoryFromText,
  resolveOfferCategory,
  toAbsoluteUrl,
  toValidPrice,
} from '../scraper-utils'
import type { ScrapedOffer } from '../types'
import { launchChromiumBrowser } from './chromium-launch'

const CENTRAKOR_BASE_URL = 'https://www.centrakor.com'

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

    const category =
      categoryName ||
      resolveOfferCategory({
        sourceCategoryPath: row.sourceCategoryPath,
        textValues: [finalName, row.description],
      })

    if (!category) {
      continue
    }

    offers.push({
      retailer: 'centrakor',
      sourceProductId,
      sourceUrl,
      sourceCategoryPath: row.sourceCategoryPath,
      category,
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
): Promise<ScrapedOffer[]> {
  const offers: ScrapedOffer[] = []
  const seenUrls = new Set<string>()
  const seenPageSignatures = new Set<string>()

  for (let pageNum = 1; pageNum <= maxPages; pageNum += 1) {
    const pageUrl = pageNum === 1 ? url : `${url}?page=${pageNum}`

    try {
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await page.waitForTimeout(750)

      const pageOffers = await extractProductsFromApollo(page, categoryName)
      if (pageOffers.length === 0) {
        break
      }

      const pageSignature = pageOffers.slice(0, 8).map((offer) => offer.sourceUrl).join('|')
      if (!pageSignature || seenPageSignatures.has(pageSignature)) {
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
        break
      }
    } catch (error) {
      console.error(`Centrakor subcategory scrape failed for ${pageUrl}:`, error)
      break
    }
  }

  return offers
}

async function scrapeRootCategory(
  browser: Browser,
  categoryName: SupportedCategory,
  rootUrl: string,
): Promise<ScrapedOffer[]> {
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

    for (const subcategory of subcategories) {
      const pageOffers = await scrapeSubcategoryPage(page, subcategory.url, categoryName, 8)

      for (const offer of pageOffers) {
        if (seenUrls.has(offer.sourceUrl)) continue
        seenUrls.add(offer.sourceUrl)
        offers.push(offer)
      }
    }

    return offers
  } finally {
    await context.close()
  }
}

export async function scrapeCentrakorProducts(searchQuery?: string): Promise<ScrapedOffer[]> {
  const normalizedQuery = cleanDisplayText(searchQuery)
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

    const settled = await Promise.allSettled(
      Array.from(rootsToScrape.entries()).map(([categoryName, rootUrl]) =>
        scrapeRootCategory(browser, categoryName, rootUrl),
      ),
    )

    const offers: ScrapedOffer[] = []
    const seenUrls = new Set<string>()

    for (const result of settled) {
      if (result.status !== 'fulfilled') {
        console.error('Centrakor root scrape failed:', result.reason)
        continue
      }

      for (const offer of result.value) {
        if (seenUrls.has(offer.sourceUrl)) continue
        seenUrls.add(offer.sourceUrl)
        offers.push(offer)
      }
    }

    return normalizedQuery ? filterOffersByQuery(offers, normalizedQuery) : offers
  } catch (error) {
    console.error('Error in Centrakor scraper:', error)
    return []
  } finally {
    await browser.close()
  }
}
