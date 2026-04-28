# Agents.md: `src/lib/scrapers/`

## Role
Retailer scraping module for extracting **store-specific offers** from 6 discount retailers: Action, Stokomani, B&M, Centrakor, Aldi, and GiFi.

## Responsibilities
- Extract retailer-native product/offer metadata
- Prefer explicit source categories from site structure or structured metadata
- Return store-specific offers with stable source identity
- Leave validation/reporting to the shared runtime wrapper

## Components

| File | Technology | Purpose |
|------|------------|---------|
| `action-playwright-browser.ts` | Playwright | Action category/search scraping with pagination |
| `bm-playwright-browser.ts` | Playwright | B&M category/search scraping with pagination |
| `stokomani-scraper.ts` | fetch + Shopify JSON | Stokomani catalog/search ingestion |
| `centrakor-scraper.ts` | Playwright + Apollo state | Centrakor root/subcategory scraping |
| `aldi-scraper.ts` | Playwright | Aldi category/subcategory scraping with `Voir plus` pagination |
| `gifi-scraper.ts` | fetch + HTML/JSON-LD | GiFi sitemap/category/product scraping |
| `index.ts` | Exports | Re-exports scraper entrypoints |

## Common Patterns
- All scrapers return `ScrapedOffer[]`
- `retailer`, `sourceProductId`, `sourceUrl`, `category`, `name`, and `price` must be set before validation
- Category pages should use explicit source-category mapping first
- Search pages may fall back to structured metadata and keyword inference
- Each scraper should avoid hardcoded defaults like `|| 'menage'` or `|| 'alimentation'`

## Agent Guidelines
- Browser selectors are fragile: keep them tight and retailer-specific
- Do not persist from inside a scraper
- If a retailer returns empty validated output after retries, the weekly job should fail
- Domain mismatches must be treated as invalid offers, not corrected downstream
