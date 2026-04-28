# Agents.md: `src/app/api/search/`

## Role
Search API endpoint providing product search functionality with multi-source fallback: database → real-time scraping → demo data.

## Behavior

### Request
```
GET /api/search?query=<term>&category=<cat>
```
- `query`: Search term (optional)
- `category`: Filter by `hygiene`, `alimentation`, or `menage` (optional)

### Response
```json
{
  "products": [...],
  "count": 20,
  "source": "database" | "real-time" | "demo" | "demo-fallback"
}
```

### Data Flow
1. **Database first** (`src/lib/db.ts`): If `POSTGRES_URL` set, search in stored products
2. **Scrapers** (if DB empty): Run all 6 scrapers in parallel via `Promise.allSettled()`
3. **Demo fallback**: If both DB and scrapers fail, return hardcoded sample products

### Product Format
```typescript
{
  id: string,
  name: string,
  category: 'hygiene' | 'alimentation' | 'menage',
  prices: { [store]: number },  // e.g. {action: 2.99, stokomani: 3.49}
  urls: { [store]: string }
}
```

## Demo Products
Hardcoded list of 20 sample products used when no real data available:
- Each has `id` prefixed with `demo-`
- Covers all 3 categories and 6 stores

## Agent Guidelines
- **Error handling**: Returns demo products on any exception - always succeeds
- **Logging**: Logs `POSTGRES_URL` and `DATABASE_URL` env vars for debugging
- **Scraper timeout**: Uses `Promise.allSettled()` so one failure doesn't block others
- **No POST**: Only accepts GET requests
