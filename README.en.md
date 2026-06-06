<p align="center">
  <img src="public/logo.png" alt="ComparPrix" width="160" />
</p>

<h1 align="center">ComparPrix</h1>

<p align="center">
  <em>The Discount Price Bulletin — № 01, Weekly.</em>
</p>

<p align="center">
  <a href="#how-it-works"><img alt="Next.js 16" src="https://img.shields.io/badge/Next.js-16-App%20Router-0F1623?style=flat-square&logo=nextdotjs&logoColor=FCFDFE" /></a>
  <a href="#tech-stack"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=FCFDFE" /></a>
  <a href="#database"><img alt="PostgreSQL" src="https://img.shields.io/badge/PostgreSQL-Vercel-336791?style=flat-square&logo=postgresql&logoColor=FCFDFE" /></a>
  <a href="#scraping"><img alt="Playwright" src="https://img.shields.io/badge/Playwright-Chromium-2EAD33?style=flat-square&logo=playwright&logoColor=FCFDFE" /></a>
  <a href="#quick-start"><img alt="Node 22" src="https://img.shields.io/badge/Node-%E2%89%A522.17-339933?style=flat-square&logo=nodedotjs&logoColor=FCFDFE" /></a>
  <a href="LICENSE"><img alt="License" src="https://img.shields.io/badge/License-SEE%20LICENSE%20IN%20FILE-0F2C52?style=flat-square" /></a>
</p>

<p align="center">
  <a href="#quick-start">Quick Start</a> ·
  <a href="#tech-stack">Stack</a> ·
  <a href="#retailers">Retailers</a> ·
  <a href="#categories">Categories</a> ·
  <a href="#scraping">Scraping</a> ·
  <a href="#automation">GitHub Actions</a> ·
  <a href="#deployment">Deployment</a>
</p>

<!-- README-I18N:START -->

[Français](./README.md) | **[English](./README.en.md)** | [Español](./README.es.md) | [Deutsch](./README.de.md) | [Italiano](./README.it.md)

<!-- README-I18N:END -->

---

> [!NOTE]
> **The bargain-hunting bulletin.** A single list, **ten discount retailers**, and the fairest price always at hand. ComparPrix reads, compares, ranks — then publishes a weekly state of the art, no fluff.

---

## Contents

- [Manifesto](#manifesto)
- [How It Works](#how-it-works)
- [Tech Stack](#tech-stack)
- [Retailers](#retailers)
- [Categories](#categories)
- [Data Architecture](#data-architecture)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Database](#database)
- [Scraping](#scraping)
- [Automation](#automation)
- [API](#api)
- [Checks](#checks)
- [Deployment](#deployment)
- [Legal Pages & Links](#legal-pages--links)

---

## Manifesto

Discount is not a category, it is a mindset: find the right product, at the right price, from the right retailer, without losing an hour. ComparPrix does exactly that.

- **One source, ten retailers.** Every offer is persisted in a single source of truth; the UI never scrapes on the fly.
- **Surface honesty.** Categories, strikethrough prices, discounts — every card mirrors what is in the database, nothing more.
- **Editorial tone.** *The Discount Price Bulletin* reads like a logbook. The visuals follow suit, the code respects it.
- **Zero secrets.** Scrapers, schemas, supervision scripts: all versioned, all runnable locally.

> [!TIP]
> ComparPrix is **not** affiliated with the retailers it indexes. All brands mentioned belong to their respective owners.

---

## How It Works

```text
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│  Scrapers (Playwright / fetch) │ ─► │ PostgreSQL (products + prices) │ ─► │ UI Next.js (revalidate 300s)  │
└────────────────────┘    └────────────────────┘    └────────────────────┘
        ▲                                                       ▲
        │                                                       │
┌────────────────────┐                                  ┌────────────────────┐
│ GitHub Actions (cron + manual)             │                                  │ /api/search with fallback       │
└────────────────────┘                                  └────────────────────┘
```

Three well-separated read paths:

1. **Home page `/`** — DB read first, with a live `search` fallback if the database returns few results (≤ 5).
2. **`/deals` section** — Shows **only** the promotional offers persisted in the database. Never live scraping.
3. **`/api/search`** — JSON endpoint with a fallback chain: `database → real-time → demo-fallback`. See [`src/app/api/search/AGENTS.md`](src/app/api/search/AGENTS.md).

> [!IMPORTANT]
> Browser scrapers (Action, B&M, Centrakor, Aldi) are **automatically disabled on Vercel**. The Deals page rendering stays strictly database-driven, which guarantees a deployment never spawns a headless browser.

---

## Tech Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | [Next.js 16](https://nextjs.org) App Router + Turbopack | RSC, ISR (`revalidate = 300s`), native `route handlers` |
| UI | React 19, Tailwind CSS 3, Framer Motion 12 | Sober components, editorial micro-animations |
| Icons | [Lucide](https://lucide.dev) | Consistent set, tree-shakable |
| Client search | [Fuse.js](https://fusejs.io) | Typo tolerance, tunable weights |
| Database | Vercel Postgres (read `@vercel/postgres`, batch write `pg`) | Transactional, easy to provision |
| Scraping | [Playwright](https://playwright.dev) Chromium (browser) + native `fetch` (HTML/JSON) | Mix per retailer defenses |
| HTML parsing | [Cheerio](https://cheerio.js.org) | Fast, familiar jQuery-like syntax |
| Validation | `scraper-utils.ts` (keyword + domain + price + source identity) | Explicit rejects, never silent coercion |
| Typography | Bricolage Grotesque, Big Shoulders, Fraunces, JetBrains Mono | *The Bulletin* editorial voice |
| Palette | Ink `#0F1623` · Navy `#0F2C52` · Navy-deep `#081C36` · Cream `#FCFDFE` | AAA contrast on most pairs |

---

## Retailers

Ten discounters, ten scraping approaches. The table reflects the source of truth in `src/lib/catalog.ts`:

| Slug | Retailer | Domain | Technology | Strategy |
| --- | --- | --- | --- | --- |
| `action` | Action | `action.com` | Playwright | Browser (Cloudflare) |
| `stokomani` | Stokomani | `stokomani.fr` | `fetch` + Shopify JSON | Storefront API |
| `bm` | B&M | `bmstores.fr` | Playwright | Browser |
| `centrakor` | Centrakor | `centrakor.com` | Playwright + Apollo state | Injected GraphQL state |
| `aldi` | Aldi | `aldi.fr` | Playwright | Browser |
| `gifi` | GiFi | `gifi.fr` | `fetch` + HTML / JSON-LD | Multi-format fallback |
| `lafoirfouille` | La Foir'Fouille | `lafoirfouille.fr` | `fetch` | HTML |
| `lidl` | Lidl | `lidl.fr` | `fetch` | HTML + image CDN |
| `maxibazar` | Maxi Bazar | `maxibazar.fr` | `fetch` | HTML |
| `noz` | Noz | `noz.fr` | `fetch` | HTML |

> [!TIP]
> The details of each scraper live in [`src/lib/scrapers/AGENTS.md`](src/lib/scrapers/AGENTS.md). The `*Detailed` exports emit `{ offers, issues, coverage }` — persistence is centralized in `weekly-scrape.ts`, never inside the scrapers.

### Weekly Strategy

Retailers split into two groups:

- **Required** — `action`, `stokomani`, `bm`, `centrakor`, `aldi`, `gifi`. 3 attempts, failure ⇒ job errors out.
- **Optional** — `lafoirfouille`, `lidl`, `maxibazar`, `noz`. 1 tolerant attempt: partial coverage is accepted.

---

## Categories

Thirteen aisles, strictly mapped in the database (SQL `CHECK`) to avoid categorization leaks.

| Slug | Label | Slug | Label |
| --- | --- | --- | --- |
| `hygiene` | Hygiene | `animaux` | Pets |
| `alimentation` | Grocery | `textile` | Textile |
| `menage` | Household | `mode` | Fashion |
| `maison-deco` | Home & Decor | `high-tech` | High-Tech |
| `jardin` | Garden | `bazar` | General |
| `bricolage` | DIY | `jouets` | Toys |
| `loisirs` | Leisure | | |

> [!NOTE]
> Category resolution favors **native metadata** (source path) over keyword inference. The final fallback is `bazar`, never a `|| 'menage'` default.

---

## Data Architecture

Two tables, two responsibilities:

```sql
products (
  id, store_id, source_product_id, source_url,
  source_category_path, name, category, brand, image,
  description, availability, quantity, unit_price,
  last_scraped_at, created_at,
  UNIQUE (store_id, source_product_id)
)

prices (
  product_id PK REFERENCES products(id) ON DELETE CASCADE,
  price, original_price, discount, is_on_promotion, updated_at
)
```

- **Read** via `@vercel/postgres` (`sql.query`).
- **Write** via `pg.Client` in explicit transactions, chunked at **150 products** / **200 prices**.
- **Prune**: `pruneStaleOffersByRetailer` deletes offers from a retailer that are missing from the latest active batch.

Schema details, validation rules, and SQL constraints are documented in [`scripts/init-db.ts`](scripts/init-db.ts).

---

## Quick Start

> [!IMPORTANT]
> **Node ≥ 22.17** is required (see CI workflows). `nvm use 22.17.0` is your best ally.

```bash
# 1. Clone and install
git clone https://github.com/<owner>/comparateur-prix-discount.git
cd comparateur-prix-discount
npm install

# 2. Provision Chromium for the browser scrapers
npx playwright install chromium

# 3. Configure environment
cp .env.example .env.local
# edit .env.local → POSTGRES_URL=...

# 4. (Optional but recommended) rebuild the schema
npx tsx scripts/init-db.ts

# 5. Run in dev mode
npm run dev
```

The app is served on `http://localhost:3000` by default.

> [!TIP]
> Without `POSTGRES_URL`, the home page runs in degraded mode: `/api/search` will automatically fall back to the demo set (22 cards).

---

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `POSTGRES_URL` | recommended | Vercel Postgres URL (preferred). |
| `DATABASE_URL` | alias | Accepted as equivalent; normalized to `POSTGRES_URL` at startup. |
| `VERCEL_ENABLE_POSTBUILD_SCRAPE` | optional | Enables the postbuild hook (see [Deployment](#deployment)). Leave empty/default in normal production. |

The `src/lib/ensure-db-env.ts` module harmonizes both names, which avoids surprises between local and CI.

---

## Database

### Initialization (Destructive)

```bash
npx tsx scripts/init-db.ts
```

The script **drops** then recreates the `products` and `prices` tables, with `CHECK` constraints on the supported retailers and categories. Use it on first deploy or for a full reset.

> [!WARNING]
> This operation is **destructive**. It must never be run against a database holding production data without a prior snapshot.

### Future Migrations

The project does not yet use an incremental migration tool (Drizzle, Prisma, etc.). Any schema evolution is shipped as a new script under `scripts/` until a decision is made.

---

## Scraping

### Full Weekly Scrape

```bash
npm run scrape
```

Orchestration:

- **Read** all ten retailers with real scraping.
- **Validate** via `scraper-utils.ts` (rejects `missing_name`, `wrong_domain`, `invalid_price`, `duplicate_offer`, etc.).
- **Persist** to the database via transactional batches.
- **Reports**: `scrape-results.json` (machine summary) and `scrape-history.log` (human timeline).

### Targeted Deals Scrape

```bash
npm run scrape:deals
# or for a specific retailer:
npm run scrape:deals action,aldi
```

Filters promotional offers (via `isPromotionalOffer`) and persists only the deals.

### Per-Retailer Scrape

```bash
npm run scrape:gifi
npm run scrape:lafoirfouille
npm run scrape:lidl
npm run scrape:maxibazar
npm run scrape:noz
npm run fix:gifi-images
```

### Supervision (Coverage Audit)

```bash
npm run supervise               # all retailers
npm run supervise:gifi          # one specific retailer
```

Generates `supervision-results.json`, `supervision-report.txt`, and feeds `supervision-history.log`. Ideal after a selector change or an upstream block.

> [!TIP]
> Run `npm run supervise` after every scraper change to measure regression before opening a PR.

---

## Automation

Two GitHub Actions workflows:

| Workflow | Trigger | Effect |
| --- | --- | --- |
| `.github/workflows/daily-full-scrape.yml` | Cron (with Europe/Paris TZ guard) | Full weekly scrape + DB persistence |
| `.github/workflows/deals-scrape.yml` | `workflow_dispatch` (manual) | On-demand deals refresh |

Both workflows share the same Node 22.17 runner and use `npx tsx` to execute TypeScript scripts directly, with no extra build step.

---

## API

| Endpoint | Method | Description |
| --- | --- | --- |
| `/api/search` | `GET` | Multi-source search (DB → live → demo). Query params: `query`, `category`, `retailer`, `minPrice`, `maxPrice`, `sort`. |
| `/api/deals` | `GET` | Deals sourced from the database only. |
| `/api/produit` | `GET` | Normalized offer detail for sharing. |

All endpoints are marked `dynamic = 'force-dynamic'` and return a stable JSON payload. The response shape is documented in `AGENTS.md` at the root of each folder.

---

## Checks

```bash
npm run lint             # ESLint (next/core-web-vitals)
npm run typecheck        # tsc --noEmit on app + scripts
npm run test:categories  # Node built-in suite via tsx
```

> [!IMPORTANT]
> The `typecheck` covers **both** tsconfigs: `tsconfig.json` (app code) and `tsconfig.scripts.json` (ops scripts). Both must stay green before any PR.

---

## Deployment

Target: **Vercel**, Vercel Postgres database, scraping on GitHub Actions.

```text
         ┌──────────────────────┐
         │      GitHub repo      │
         └──────────┬───────────┘
                    │ push
                    ▼
         ┌──────────────────────┐
         │  Vercel (build)      │
         │  next build          │
         │  postbuild (disabled)│
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Vercel Postgres     │ ◄── daily-full-scrape.yml (cron)
         └──────────┬───────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Production site     │ ◄── ISR (revalidate 300s)
         └──────────────────────┘
```

### `postbuild` Hook

`package.json` exposes a `postbuild` (`scripts/vercel-postbuild-scrape.mjs`):

- **Inactive by default** — `VERCEL_ENABLE_POSTBUILD_SCRAPE` must equal `'1'` to trigger the scrape during a deployment.
- **Recommended:** keep the hook **disabled** in normal production. Scraping runs in parallel via the GitHub Actions cron to decouple build from ingestion.

### First Deployment Procedure

1. Provision Vercel Postgres.
2. Feed `POSTGRES_URL` into the Vercel environment variables.
3. `npx tsx scripts/init-db.ts` against the prod database (from an authorized runner).
4. Run an initial `npm run scrape` to seed the data.
5. Verify coverage per retailer: `npm run supervise`.
6. Enable the GitHub Actions schedule (`daily-full-scrape.yml`).

---

## Legal Pages & Links

The app footer references the following pages, served by the App Router:

- `/` — Product search
- `/deals` — Current deals
- `/a-propos` — Manifesto
- `/faq` — Frequently asked questions
- `/cgu` — Terms of service
- `/cookies` — Cookie policy
- `/mentions-legales` — Legal notice
- `/politique-confidentialite` — Privacy policy

> [!NOTE]
> The `LICENSE`, `CONTRIBUTING`, and `CHANGELOG` files (when present) are intentionally excluded from this README: they live at the repository root to stay discoverable by GitHub.

---

<p align="center">
  <sub>№ 01 — Weekly · 10 retailers · 13 categories · <a href="public/brand/concept-2-etiquette/horizontal.svg">L'Étiquette</a> chosen as visual signature.</sub>
</p>
