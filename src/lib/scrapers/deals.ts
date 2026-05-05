import { load } from 'cheerio'

import { discoverDealUrlsFromHtml, getDealEntrypoint } from '../deals'
import { cleanDisplayText, toAbsoluteUrl } from '../scraper-utils'
import type { RetailerScrapeDetails, ScrapeIssue, ScrapedOffer } from '../types'
import { scrapeActionDealsDetailed as scrapeActionDealSources } from './action-playwright-browser'
import { scrapeAldiDealsDetailed as scrapeAldiDealSources } from './aldi-scraper'
import { scrapeBMDealsDetailed as scrapeBMDealSources } from './bm-playwright-browser'
import { scrapeCentrakorDealsDetailed as scrapeCentrakorDealSources } from './centrakor-scraper'
import { extractGifiCategoryPageOffers, extractGifiProductPageOffer } from './gifi-scraper'
import { extractLafoirfouilleCategoryPage, extractLafoirfouilleProductPageOffer } from './lafoirfouille-scraper'
import { extractLidlNavigationLinks, extractLidlOffersFromApiResponse, selectAllLidlCategorySources } from './lidl-scraper'
import { extractMaxibazarProductPageOffer } from './maxibazar-scraper'
import { extractNozListingEnhancements, scrapeNozProductsDetailed } from './noz-scraper'
import { scrapeStokomaniDealsDetailed as scrapeStokomaniDealSources } from './stokomani-scraper'

type DealResult = Promise<RetailerScrapeDetails>

function forceDealPromotion(offers: ScrapedOffer[]) {
  return offers.map((offer) => ({
    ...offer,
    isOnPromotion: true,
  }))
}

function uniqueStrings(values: string[]) {
  return Array.from(new Set(values.map((value) => cleanDisplayText(value)).filter(Boolean)))
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      'user-agent': 'Mozilla/5.0 (compatible; ComparateurPrixDiscountBot/1.0)',
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'fr-FR,fr;q=0.9,en;q=0.8',
    },
  })

  return {
    ok: response.ok,
    status: response.status,
    url: response.url,
    text: await response.text(),
  }
}

function extractSameOriginLinks(html: string, baseUrl: string) {
  const $ = load(html)
  const origin = new URL(baseUrl).origin
  const urls: string[] = []

  $('a[href]').each((_, element) => {
    const href = cleanDisplayText($(element).attr('href'))
    if (!href) return

    const absolute = toAbsoluteUrl(href, baseUrl)
    if (!absolute) return

    try {
      const parsed = new URL(absolute)
      if (parsed.origin !== origin) return
      urls.push(parsed.toString())
    } catch (_error) {
      // Ignore malformed urls.
    }
  })

  return uniqueStrings(urls)
}

function withPromotionFlags(offers: ScrapedOffer[]) {
  return forceDealPromotion(offers)
}

async function scrapeBrowserDealSources(scraper: () => DealResult) {
  const result = await scraper()
  return {
    ...result,
    offers: withPromotionFlags(result.offers),
  }
}

export async function scrapeActionDealsDetailed() {
  return scrapeBrowserDealSources(scrapeActionDealSources)
}

export async function scrapeBMDealsDetailed() {
  return scrapeBrowserDealSources(scrapeBMDealSources)
}

export async function scrapeAldiDealsDetailed() {
  return scrapeBrowserDealSources(scrapeAldiDealSources)
}

export async function scrapeCentrakorDealsDetailed() {
  return scrapeBrowserDealSources(scrapeCentrakorDealSources)
}

async function scrapeGifiDealsFromOfficialPage(): Promise<RetailerScrapeDetails> {
  const deals = getDealEntrypoint('gifi')
  const { text } = await fetchHtml(deals.url)
  const candidateUrls = uniqueStrings([
    deals.url,
    ...discoverDealUrlsFromHtml('gifi', text, deals.url),
    ...extractSameOriginLinks(text, deals.url),
  ])

  const offers: ScrapedOffer[] = []
  const issues: ScrapeIssue[] = []
  let discoveredListings = candidateUrls.length
  let completedListings = 0

  for (const candidateUrl of candidateUrls) {
    try {
      const page = await fetchHtml(candidateUrl)
      let pageOffers = extractGifiCategoryPageOffers(page.text, candidateUrl)
      if (pageOffers.length === 0) {
        const productOffer = extractGifiProductPageOffer(page.text, candidateUrl)
        pageOffers = productOffer ? [productOffer] : []
      }

      completedListings += 1
      offers.push(...pageOffers)
    } catch (error) {
      issues.push({
        retailer: 'gifi',
        code: 'page_fetch_failed',
        message: error instanceof Error ? error.message : String(error),
        url: candidateUrl,
        severity: 'warning',
      })
    }
  }

  return {
    retailer: 'gifi',
    offers: withPromotionFlags(offers),
    issues,
    coverage: {
      discoveredListings,
      completedListings,
      collectionRate: discoveredListings === 0 ? 0 : Math.round((completedListings / discoveredListings) * 100),
      isComplete: completedListings > 0,
    },
  }
}

async function scrapeLidlDealsFromOfficialPage(): Promise<RetailerScrapeDetails> {
  const deals = getDealEntrypoint('lidl')
  const { text } = await fetchHtml(deals.url)
  const navigationLinks = extractLidlNavigationLinks(text)
  const sources = selectAllLidlCategorySources(navigationLinks)
  const candidateSources = sources.length > 0 ? sources : [{ category: 'bazar' as const, sourceUrl: deals.url, sourceCategoryPath: deals.label }]

  const offers: ScrapedOffer[] = []
  const issues: ScrapeIssue[] = []
  let discoveredListings = candidateSources.length
  let completedListings = 0

  for (const source of candidateSources) {
    try {
      const apiUrl = new URL(`${new URL(source.sourceUrl).origin}/q/api/category${new URL(source.sourceUrl).pathname}`)
      apiUrl.searchParams.set('assortment', 'FR')
      apiUrl.searchParams.set('locale', 'fr_FR')
      apiUrl.searchParams.set('version', 'v2.0.0')

      const response = await fetch(apiUrl.toString(), {
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; ComparateurPrixDiscountBot/1.0)',
          accept: 'application/json, text/plain, */*',
          'accept-language': 'fr-FR,fr;q=0.9,en;q=0.8',
          referer: source.sourceUrl,
          'x-requested-with': 'XMLHttpRequest',
        },
      })

      const payload = (await response.json()) as Parameters<typeof extractLidlOffersFromApiResponse>[0]
      const pageOffers = extractLidlOffersFromApiResponse(payload, source, source.sourceUrl)
      offers.push(...pageOffers)
      completedListings += 1
    } catch (error) {
      issues.push({
        retailer: 'lidl',
        code: 'page_fetch_failed',
        message: error instanceof Error ? error.message : String(error),
        url: source.sourceUrl,
        severity: 'warning',
      })
    }
  }

  return {
    retailer: 'lidl',
    offers: withPromotionFlags(offers),
    issues,
    coverage: {
      discoveredListings,
      completedListings,
      collectionRate: discoveredListings === 0 ? 0 : Math.round((completedListings / discoveredListings) * 100),
      isComplete: completedListings > 0,
    },
  }
}

async function scrapeLafoirfouilleDealsFromOfficialPage(): Promise<RetailerScrapeDetails> {
  const deals = getDealEntrypoint('lafoirfouille')
  const { text } = await fetchHtml(deals.url)
  const candidateUrls = uniqueStrings([
    deals.url,
    ...discoverDealUrlsFromHtml('lafoirfouille', text, deals.url),
    ...extractSameOriginLinks(text, deals.url),
  ])

  const offers: ScrapedOffer[] = []
  const issues: ScrapeIssue[] = []
  let discoveredListings = candidateUrls.length
  let completedListings = 0

  for (const candidateUrl of candidateUrls) {
    try {
      const page = await fetchHtml(candidateUrl)
      const categoryPage = extractLafoirfouilleCategoryPage(page.text, candidateUrl)
      const pageOffers = categoryPage.offers.length > 0 ? categoryPage.offers : [extractLafoirfouilleProductPageOffer(page.text, candidateUrl)].filter((offer): offer is ScrapedOffer => offer !== null)
      offers.push(...pageOffers)
      completedListings += 1
      if (categoryPage.pageCount > 1) {
        for (let pageNumber = 2; pageNumber <= categoryPage.pageCount; pageNumber += 1) {
          const pagedUrl = candidateUrl.replace(/\.html$/, `--page-${pageNumber}.html`)
          const paged = await fetchHtml(pagedUrl)
          offers.push(...extractLafoirfouilleCategoryPage(paged.text, pagedUrl).offers)
          completedListings += 1
          discoveredListings += 1
        }
      }
    } catch (error) {
      issues.push({
        retailer: 'lafoirfouille',
        code: 'page_fetch_failed',
        message: error instanceof Error ? error.message : String(error),
        url: candidateUrl,
        severity: 'warning',
      })
    }
  }

  return {
    retailer: 'lafoirfouille',
    offers: withPromotionFlags(offers),
    issues,
    coverage: {
      discoveredListings,
      completedListings,
      collectionRate: discoveredListings === 0 ? 0 : Math.round((completedListings / discoveredListings) * 100),
      isComplete: completedListings > 0,
    },
  }
}

async function scrapeMaxibazarDealsFromOfficialPage(): Promise<RetailerScrapeDetails> {
  const deals = getDealEntrypoint('maxibazar')
  const { text } = await fetchHtml(deals.url)
  const candidateUrls = uniqueStrings([
    deals.url,
    ...discoverDealUrlsFromHtml('maxibazar', text, deals.url),
    ...extractSameOriginLinks(text, deals.url),
  ])
    .filter((url) => !/promotions|catalogue|emploi|tous-nos-produits/i.test(url))

  const offers: ScrapedOffer[] = []
  const issues: ScrapeIssue[] = []
  let discoveredListings = candidateUrls.length
  let completedListings = 0

  for (const candidateUrl of candidateUrls) {
    try {
      const page = await fetchHtml(candidateUrl)
      const offer = extractMaxibazarProductPageOffer(page.text, candidateUrl)
      if (offer) {
        offers.push(offer)
      } else {
        const linkedUrls = extractSameOriginLinks(page.text, candidateUrl).filter((url) => !/promotions|catalogue|emploi|tous-nos-produits/i.test(url))
        discoveredListings += linkedUrls.length
        for (const linkedUrl of linkedUrls) {
          const linkedPage = await fetchHtml(linkedUrl)
          const linkedOffer = extractMaxibazarProductPageOffer(linkedPage.text, linkedUrl)
          if (linkedOffer) {
            offers.push(linkedOffer)
          }
          completedListings += 1
        }
      }
      completedListings += 1
    } catch (error) {
      issues.push({
        retailer: 'maxibazar',
        code: 'page_fetch_failed',
        message: error instanceof Error ? error.message : String(error),
        url: candidateUrl,
        severity: 'warning',
      })
    }
  }

  return {
    retailer: 'maxibazar',
    offers: withPromotionFlags(offers),
    issues,
    coverage: {
      discoveredListings,
      completedListings,
      collectionRate: discoveredListings === 0 ? 0 : Math.round((completedListings / discoveredListings) * 100),
      isComplete: completedListings > 0,
    },
  }
}

async function scrapeNozDealsFromOfficialPage(): Promise<RetailerScrapeDetails> {
  const deals = getDealEntrypoint('noz')
  const { text } = await fetchHtml(deals.url)
  const enhancementMap = extractNozListingEnhancements(text)
  const dealUrls = uniqueStrings(Array.from(enhancementMap.keys()))

  const catalog = await scrapeNozProductsDetailed()
  const offers = catalog.offers.filter((offer) => dealUrls.includes(cleanDisplayText(offer.sourceUrl)))

  return {
    retailer: 'noz',
    offers: withPromotionFlags(offers),
    issues: catalog.issues,
    coverage: {
      discoveredListings: dealUrls.length,
      completedListings: offers.length,
      collectionRate: dealUrls.length === 0 ? 0 : Math.round((offers.length / dealUrls.length) * 100),
      isComplete: offers.length > 0,
    },
  }
}

export async function scrapeStokomaniDealsDetailed() {
  return scrapeStokomaniDealSources()
}

export async function scrapeGifiDealsDetailed() {
  return scrapeGifiDealsFromOfficialPage()
}

export async function scrapeLidlDealsDetailed() {
  return scrapeLidlDealsFromOfficialPage()
}

export async function scrapeLafoirfouilleDealsDetailed() {
  return scrapeLafoirfouilleDealsFromOfficialPage()
}

export async function scrapeMaxibazarDealsDetailed() {
  return scrapeMaxibazarDealsFromOfficialPage()
}

export async function scrapeNozDealsDetailed() {
  return scrapeNozDealsFromOfficialPage()
}
