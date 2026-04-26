# Agents.md: `src/app/`

## Role
Next.js 14 App Router frontend application - UI layer for the price comparison site.

## Components

| File | Purpose |
|------|---------|
| `page.tsx` | Main landing page with search UI |
| `layout.tsx` | Root layout with HTML wrapper |
| `globals.css` | Global Tailwind styles |
| `api/search/route.ts` | Search API endpoint (see `api/search/AGENTS.md`) |

## Behavior

### Page Flow
1. User lands on `/` - search page loads
2. User enters query or selects category
3. Frontend calls `/api/search?query=...&category=...`
4. Results displayed with prices from multiple stores

### Styling
- Uses Tailwind CSS (configured in `tailwind.config.js`)
- Responsive design for mobile/desktop

## Agent Guidelines
- **API integration**: Frontend expects `/api/search` to return `products` array
- **TypeScript**: Props must match API response shape
- **Demo mode**: UI shows "demo" badge when source is demo data
- **Build**: Run `npm run build` to generate production build