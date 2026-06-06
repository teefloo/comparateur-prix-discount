# Agent Instructions: Comparateur de Prix

## Tech Stack & Architecture
- **Framework**: Next.js 16 App Router (`/src/app`)
- **DB**: Vercel Postgres (`@vercel/postgres`) with raw SQL via `pg` Client for batch writes
- **Scrapers**: `/src/lib/scrapers/` — mix of Playwright (browser) and fetch/JSON scrapers

## Critical Commands
- `npm run dev`: Dev server (port 3000)
- `npm run lint`: **Required after changes** (eslint with `next/core-web-vitals`)
- `npm run typecheck`: Type-checks **both** app code and scripts via two tsconfigs
  - `tsconfig.json` excludes `scripts/`; `tsconfig.scripts.json` extends it and includes `scripts/**/*.ts`
- `npx tsx scripts/init-db.ts`: Rebuild DB schema (destructive — drops `products` + `prices`)
- `npx playwright install chromium`: Setup for browser scrapers
- `npm run scrape`: Full weekly scraper with validation and DB persistence
- `npm run supervise`: Coverage/validation audit for all retailers
- `npm run supervise:<retailer>`: Single-retailer supervision (e.g., `supervise:gifi`)
- `npm run test:categories`: Run Node.js built-in test suite with `tsx` (not Jest/Vitest)

## Scrapers
- **10 retailers**: `action`, `stokomani`, `bm`, `centrakor`, `aldi`, `gifi`, `lafoirfouille`, `lidl`, `maxibazar`, `noz`
- **Browser scrapers** (Playwright): `action`, `bm`, `centrakor`, `aldi` — disabled on Vercel
- **Fetch scrapers**: `stokomani`, `gifi`, `lafoirfouille`, `lidl`, `maxibazar`, `noz`
- Weekly scrape split:
  - **Required** (3 attempts, fail on blocking issues): `action`, `stokomani`, `bm`, `centrakor`, `aldi`, `gifi`
  - **Optional** (1 attempt, tolerate failure): `lafoirfouille`, `lidl`, `maxibazar`, `noz`

## Database
- **Env**: `POSTGRES_URL` or `DATABASE_URL` (code normalizes `DATABASE_URL` → `POSTGRES_URL`)
- **Schema** (store-specific):
  - `products`: `id`, `store_id`, `source_product_id`, `source_url`, `category`, `quantity`, `unit_price`, ...
  - `prices`: `product_id`, `price`, `original_price`, `discount`, `is_on_promotion`, `updated_at`
  - Constraint: `UNIQUE(store_id, source_product_id)`
- Batch upserts chunk at 150 products / 200 prices per transaction
- `pruneStaleOffersByRetailer` deletes all non-active offers for a retailer

## Search API Fallback Chain
`GET /api/search?query=...&category=...&retailer=...`
1. **Database** first (if `POSTGRES_URL` set)
2. **Live scraping** only if DB empty/unresponsive (skipped on Vercel for category-only browsing)
3. **Demo fallback** (hardcoded 22 demo offers) if both fail
- Live scrape timeout: 8s on Vercel, 30s locally

## Vercel Deploy Behavior
- `postbuild` runs `scripts/vercel-postbuild-scrape.mjs`
- Postbuild scraping is disabled by default and only runs when explicitly enabled with `VERCEL_ENABLE_POSTBUILD_SCRAPE=1`
- Postbuild scrape failure exits non-zero when enabled
- Browser scrapers automatically skipped on Vercel

## Operational Notes
- **Categories** (13): `hygiene`, `alimentation`, `menage`, `maison-deco`, `jardin`, `bricolage`, `loisirs`, `animaux`, `textile`, `mode`, `high-tech`, `bazar`, `jouets`
- **Validation**: Scrapers return raw offers; `scraper-utils.ts` validates retailer/domain/category/price integrity
- **Category resolution**: Prefer explicit native/source-path mapping over keyword inference; fallback is `bazar`
- **Consistency**: Maintain strict TS types across scrapers, DB helpers, API responses, and UI offer cards
- **Supervision outputs**: `supervision-results.json`, `supervision-report.txt`, `supervision-history.log`
- **Weekly scrape outputs**: `scrape-results.json`, `scrape-history.log`

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
