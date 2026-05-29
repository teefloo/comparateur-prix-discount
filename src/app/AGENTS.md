# Agent Instructions: `src/app/`

## Role
Next.js 16 App Router frontend — server-rendered pages and API routes.

## Routes

| Route | File | Notes |
|-------|------|-------|
| `/` | `page.tsx` | Search landing page; server-fetches `/api/search` internally |
| `/categorie/[category]` | `categorie/[category]/page.tsx` | Category browse; `generateStaticParams` for all 13 categories; `force-dynamic` |
| `/produit/[id]` | `produit/[id]/page.tsx` | Product detail page |
| `/api/search` | `api/search/route.ts` | Search endpoint (see `api/search/AGENTS.md`) |

## Key Conventions
- Search page (`/`) uses `runSearch` directly in a Server Component; category pages share the same fallback-friendly data path
- Both search and category pages export `dynamic = 'force-dynamic'`
- `layout.tsx` wraps all pages; `globals.css` imports Tailwind base

## Agent Guidelines
- **Props**: Components must match `RetailerOfferCard` from `@/lib/types`
- **Demo badge**: UI shows a demo indicator when `source === 'demo-fallback'`
- **Category labels**: Use `CATEGORY_LABELS` from `@/lib/catalog`, never hardcode
