/**
 * Public product data is refreshed by the scheduled scraper, not per user.
 * Keep the cache short enough for price corrections while avoiding a DB read
 * for every crawler or product-page visit.
 */
export const PRODUCT_CACHE_REVALIDATE_SECONDS = 600
export const PRODUCT_CACHE_STALE_WHILE_REVALIDATE_SECONDS = 3600

/**
 * The product API has no user-specific or authenticated response. Vercel can
 * serve a cached response for ten minutes and refresh it in the background.
 */
export const PRODUCT_API_CACHE_CONTROL = `public, s-maxage=${PRODUCT_CACHE_REVALIDATE_SECONDS}, stale-while-revalidate=${PRODUCT_CACHE_STALE_WHILE_REVALIDATE_SECONDS}`
