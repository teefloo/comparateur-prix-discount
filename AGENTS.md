# Agent Instructions: Comparateur de Prix

## Tech Stack & Architecture
- **Framework**: Next.js 14 App Router (`/src/app`)
- **DB**: Vercel Postgres (`/src/lib/db.ts`)
- **Scrapers**: `/src/lib/scrapers/` (Playwright + fetch/JSON)

## Critical Commands
- `npm run dev`: Dev server (port 3000)
- `npm run scrape`: Run the full weekly scraper
- `npm run lint`: **Required after changes**
- `npm run typecheck`: Type-check app code and operational scripts
- `npx tsx scripts/init-db.ts`: Rebuild the store-specific DB schema
- `npx playwright install chromium`: Setup scrapers
- `npm run supervise`: Run the supervision agent for all retailers (coverage audit)
- `npm run supervise:gifi`: Run supervision for a single retailer (replace `gifi` with any retailer name)

## Operational Notes
- **Retailers**: `action`, `stokomani`, `bm`, `centrakor`, `aldi`, `gifi`, `lafoirfouille`, `lidl`
- **Categories**: `hygiene`, `alimentation`, `menage`, `maison-deco`, `jardin`, `bricolage`, `loisirs`, `animaux`, `textile`, `mode`, `high-tech`, `bazar`, `jouets`
- **Storage model**: Store-specific offers in `products`, current price snapshots in `prices`
- **Environment**: Needs `POSTGRES_URL` or `DATABASE_URL`
- **Fallbacks**: Search API only falls back to demo data when DB lookup and live scraping both fail
- **Consistency**: Maintain strict TS types across scrapers, DB helpers, API responses, and UI offer cards
