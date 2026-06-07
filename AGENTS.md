# Agent Instructions: Comparateur de Prix

## Tech Stack & Architecture
- **Framework**: Next.js 16 App Router (`/src/app`) — pinned to `^16.3.0-canary.23` (canary build, breaking changes possible)
- **DB**: Vercel Postgres — `@vercel/postgres` for reads, raw `pg` Client for transactional batch writes
- **UI**: React 19, Tailwind CSS 3, Framer Motion 12, Lucide icons, Fuse.js (client-side fuzzy search)
- **Parsing**: `cheerio` for HTML, native `fetch` for JSON endpoints
- **Scrapers**: `/src/lib/scrapers/` — mix of Playwright (browser, with `@sparticuz/chromium` for serverless) and fetch scrapers
- **Runtime**: Node ≥ 22.17 (CI requirement)

## Critical Commands
- `npm run dev`: Dev server (port 3000)
- `npm run lint`: **Required after changes** (ESLint flat config with `next/core-web-vitals`)
- `npm run typecheck`: Type-checks **both** app code and scripts via two tsconfigs
  - `tsconfig.json` excludes `scripts/`; `tsconfig.scripts.json` extends it and includes `scripts/**/*.ts`
- `npx tsx scripts/init-db.ts`: Rebuild DB schema (destructive — drops `products` + `prices`)
- `npx playwright install --with-deps chromium`: Setup for browser scrapers
- `npm run scrape`: Full weekly scraper with validation and DB persistence
- `npm run scrape:deals`: Promotional offers only (accepts `action,aldi`-style retailer filter)
- `npm run scrape:<retailer>`: Per-retailer scrape (`scrape:gifi`, `scrape:lafoirfouille`, `scrape:lidl`, `scrape:maxibazar`, `scrape:noz`)
- `npm run fix:gifi-images`: Repair Gifi image URLs
- `npm run supervise`: Coverage/validation audit for all retailers
- `npm run supervise:<retailer>`: Single-retailer supervision (e.g., `supervise:gifi`)

## Scrapers
- **10 retailers**: `action`, `stokomani`, `bm`, `centrakor`, `aldi`, `gifi`, `lafoirfouille`, `lidl`, `maxibazar`, `noz`
- **Browser scrapers** (Playwright): `action`, `bm`, `centrakor`, `aldi` — disabled on Vercel
- **Fetch scrapers**: `stokomani`, `gifi`, `lafoirfouille`, `lidl`, `maxibazar`, `noz`
- Weekly scrape split:
  - **Required** (3 attempts, fail on blocking issues): `action`, `stokomani`, `bm`, `centrakor`, `aldi`, `gifi`
  - **Optional** (1 attempt, tolerate failure): `lafoirfouille`, `lidl`, `maxibazar`, `noz`

## Database
- **Env**: `POSTGRES_URL` or `DATABASE_URL` (code normalizes `DATABASE_URL` → `POSTGRES_URL` via `src/lib/ensure-db-env.ts`)
- **Schema** (store-specific):
  - `products`: `id`, `store_id`, `source_product_id`, `source_url`, `category`, `quantity`, `unit_price`, ...
  - `prices`: `product_id`, `price`, `original_price`, `discount`, `is_on_promotion`, `updated_at`
  - Constraint: `UNIQUE(store_id, source_product_id)`
- Batch upserts chunk at 150 products / 200 prices per transaction
- `pruneStaleOffersByRetailer` deletes all non-active offers for a retailer

## Search API Fallback Chain
All `/api/*` routes are `dynamic = 'force-dynamic'`.
`GET /api/search?query=...&category=...&retailer=...`
1. **Database** first (if `POSTGRES_URL` set)
2. **Live scraping** only if DB empty/unresponsive (skipped on Vercel for category-only browsing)
3. **Demo fallback** (hardcoded 22 demo offers) if both fail
- Live scrape timeout: 8s on Vercel, 30s locally
- Orchestration handled by `src/lib/scrape-runtime.ts` (retries, timeouts, per-retailer reporting)

## Vercel Deploy Behavior
- `postbuild` runs `scripts/vercel-postbuild-scrape.mjs`
- Postbuild scraping is disabled by default and only runs when explicitly enabled with `VERCEL_ENABLE_POSTBUILD_SCRAPE=1`
- Postbuild scrape failure exits non-zero when enabled
- Browser scrapers automatically skipped on Vercel

## CI / GitHub Actions
- `.github/workflows/daily-full-scrape.yml` — cron `30 1 * * *` (winter) / `30 2 * * *` (summer) with Europe/Paris TZ guard; manual `workflow_dispatch`; concurrency group `daily-full-scrape` (no cancel). Timeout 240 min.
- `.github/workflows/deals-scrape.yml` — manual `workflow_dispatch` only. Timeout 120 min.
- Both use `node-version: 22.17.0`, `npm ci`, and `npx playwright install --with-deps chromium`
- Required secrets: `POSTGRES_URL` or `DATABASE_URL` (workflow errors out if both missing)
- Artifacts: `daily-full-scrape-results` (`scrape-results.json` + `scrape-history.log`, 14d) and `deal-scrape-log` (14d)

## Operational Notes
- **Retailer catalog**: `src/lib/catalog.ts` is the source of truth for the 10 retailers (`RETAILERS`, `SUPPORTED_CATEGORIES`, labels, domain rules)
- **Caching**: Home page uses ISR with `revalidate = 300s` (5 min). API routes are `dynamic = 'force-dynamic'`.
- **Categories** (13): `hygiene`, `alimentation`, `menage`, `maison-deco`, `jardin`, `bricolage`, `loisirs`, `animaux`, `textile`, `mode`, `high-tech`, `bazar`, `jouets`
- **Validation rules** (`scraper-utils.ts`): rejects `missing_name`, `invalid_source_url`, `wrong_domain`, `invalid_price`, `unsupported_category`, `missing_source_identity`, `duplicate_offer`
- **Category resolution**: Prefer explicit native/source-path mapping over keyword inference; fallback is `bazar`
- **Consistency**: Maintain strict TS types across scrapers, DB helpers, API responses, and UI offer cards
- **Sub-AGENTS.md** (layered, file-local guidance): `src/AGENTS.md`, `src/lib/AGENTS.md`, `src/lib/scrapers/AGENTS.md`, `src/app/AGENTS.md`, `src/app/api/search/AGENTS.md`
- **Supervision outputs**: `supervision-results.json`, `supervision-report.txt`, `supervision-history.log`
- **Weekly scrape outputs**: `scrape-results.json`, `scrape-history.log`

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
