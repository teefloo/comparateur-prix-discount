# Agents.md: `src/lib/`

## Role
Shared library layer for category/store constants, scraper normalization, validation, database persistence, and runtime scrape orchestration.

## Responsibilities
- Normalize raw scraped data into **store-specific offers**
- Validate retailer/domain/category/price integrity before persistence
- Read and write the store-specific Postgres schema
- Provide shared query and offer-card helpers for the API/UI

## Components

| File | Purpose |
|------|---------|
| `catalog.ts` | Source of truth for retailers, categories, labels, and domain rules |
| `types.ts` | Shared store-specific offer types for scrapers, DB, and UI |
| `scraper-utils.ts` | Category resolution, quantity/unit-price parsing, validation, sorting, card shaping |
| `db.ts` | Store-specific DB upserts and read helpers |
| `scrape-runtime.ts` | Shared runtime wrapper for retries, validation, and per-retailer reporting |
| `scrapers/` | Individual store scraper implementations |

## Database Schema

### `products`
- `id`
- `store_id`
- `source_product_id`
- `source_url`
- `source_category_path`
- `name`
- `category`
- `brand`
- `image`
- `description`
- `availability`
- `quantity`
- `unit_price`
- `last_scraped_at`

### `prices`
- `product_id`
- `price`
- `original_price`
- `discount`
- `is_on_promotion`
- `updated_at`

## Agent Guidelines
- Prefer explicit source-category metadata over keyword inference
- Never silently coerce an unknown product into a valid category
- Keep offer IDs stable by retailer + source identity
- Treat demo data as a failure fallback, not the default search source
