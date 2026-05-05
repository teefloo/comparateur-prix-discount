# Agent Instructions: `src/lib/`

## Role
Shared library for types, catalog constants, scraper validation, DB persistence, and runtime orchestration.

## Key Files

| File | Purpose |
|------|---------|
| `catalog.ts` | Source of truth: `RETAILERS`, `SUPPORTED_CATEGORIES`, labels, domain rules |
| `types.ts` | Shared TS types: `ScrapedOffer`, `ValidatedOffer`, `RetailerOfferCard`, etc. |
| `scraper-utils.ts` | Category resolution, quantity parsing, offer validation, sorting, card shaping |
| `db.ts` | DB reads (`@vercel/postgres`) and batch writes (`pg` Client) |
| `scrape-runtime.ts` | Orchestrates scraper execution with retries, timeouts, and per-retailer reporting |
| `deals.ts` / `deals-config.ts` | Promotional-offer detection and deal-section keywords |
| `scrapers/` | Individual retailer scraper implementations |
| `ensure-db-env.ts` | Normalizes `DATABASE_URL` → `POSTGRES_URL` at runtime |

## Validation Rules (`scraper-utils.ts`)
Raw offers can be rejected for:
- `missing_name` — empty or whitespace name
- `invalid_source_url` — missing or unparseable URL
- `wrong_domain` — URL does not match retailer domain in `RETAILER_INFO`
- `invalid_price` — missing, zero, or non-numeric price
- `unsupported_category` — category not in `SUPPORTED_CATEGORIES`
- `missing_source_identity` — cannot derive `sourceProductId`
- `duplicate_offer` — same `id` seen twice in one batch

## DB Persistence (`db.ts`)
- Reads use `@vercel/postgres` `sql.query`
- Batch writes use `pg` `Client` with explicit transactions
- Upsert chunk sizes: **150 products** / **200 prices** per transaction
- `pruneStaleOffersByRetailer` deletes every offer for a retailer not in the active ID list

## Agent Guidelines
- Prefer explicit source-category metadata over keyword inference
- Never silently coerce an unknown product into a valid category
- Keep offer IDs stable by retailer + source identity
- Treat demo data as a failure fallback, not the default search source
