# Agent Instructions: `src/app/api/search/`

## Role
Search API endpoint with multi-source fallback: database → live scraping → demo fallback.

## Request
```
GET /api/search?query=<term>&category=<cat>&retailer=<retailer>
```
- `query`: Search term (optional)
- `category`: One of 13 supported categories (optional)
- `retailer`: Single retailer slug to filter (optional)

## Response
```json
{
  "products": [...],
  "count": 120,
  "grouped": false,
  "source": "database" | "real-time" | "demo-fallback" | null,
  "lastUpdate": "2026-01-01T00:00:00.000Z",
  "categories": { "hygiene": "Hygiène", ... }
}
```

## Fallback Chain
1. **Database** first (`src/lib/db.ts`): queries `products` + `prices` if `POSTGRES_URL` is set
2. **Live scraping**: triggered only when DB results are insufficient
   - Search query: live scrape if `< 5` DB results
   - Category-only: live scrape if `0` DB results **and not on Vercel**
   - Timeout: **8s on Vercel**, **30s locally**
3. **Demo fallback**: 22 hardcoded `RetailerOfferCard` samples covering all 13 categories and 10 retailers

## Key Behavior
- Category pages on Vercel **never** trigger live scrapes; they rely on persisted data
- Uses `Promise.allSettled()` for live scrapes so one failure does not block others
- Browser scrapers are skipped on Vercel (`process.env.VERCEL === '1'`)
- The endpoint always returns successfully; errors fall back to demo data

## Agent Guidelines
- Only accepts `GET` requests
- Do not change the demo offer count or shape without updating the UI expectations
- `lastUpdate` is read from `scrape-results.json` timestamp
