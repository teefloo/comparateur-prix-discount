# Agent Instructions: `src/lib/scrapers/`

## Role
Retailer scraping module — extracts store-specific offers from 10 discount retailers.

## Scrapers

| File | Technology | Retailer |
|------|------------|----------|
| `action-playwright-browser.ts` | Playwright | Action |
| `bm-playwright-browser.ts` | Playwright | B&M |
| `centrakor-scraper.ts` | Playwright + Apollo state | Centrakor |
| `aldi-scraper.ts` | Playwright | Aldi |
| `stokomani-scraper.ts` | fetch + Shopify JSON | Stokomani |
| `gifi-scraper.ts` | fetch + HTML/JSON-LD | GiFi |
| `lafoirfouille-scraper.ts` | fetch | La Foir'Fouille |
| `lidl-scraper.ts` | fetch | Lidl |
| `maxibazar-scraper.ts` | fetch | Maxi Bazar |
| `noz-scraper.ts` | fetch | Noz |
| `index.ts` | Exports | Re-exports all `*Detailed` entrypoints |
| `deals.ts` | Wrappers | Wraps each `*Detailed` scraper to return only promotional offers |

## Patterns
- Each retailer exports a `scrape*ProductsDetailed` function consumed by `scrape-runtime.ts`
- `*Detailed` functions return `RetailerScrapeDetails` (`{ offers, issues, coverage }`)
- `deals.ts` wraps these to filter for promotional offers only
- Scrapers **must not** persist data internally; persistence happens in `weekly-scrape.ts`

## Agent Guidelines
- Browser selectors are fragile: keep them tight and retailer-specific
- Avoid hardcoded category defaults like `|| 'menage'` — let `scraper-utils.ts` resolve categories
- Set `retailer`, `sourceProductId`, `sourceUrl`, `category`, `name`, and `price` on every raw offer
- Domain mismatches are treated as invalid offers downstream; do not correct them in scrapers
- If a required retailer returns empty validated output after retries, the weekly job fails
