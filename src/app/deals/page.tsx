import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, ArrowRight, Search } from 'lucide-react'

import Navbar from '@/components/Navbar'
import ProductCard from '@/components/ProductCard'
import RetailerFilterPanel from '@/components/RetailerFilterPanel'
import { isSupportedCategory } from '@/lib/catalog'
import { loadDealsFeed } from '@/lib/deals-feed'
import { normalizePriceRange, normalizePriceSort } from '@/lib/result-filters'
import { absoluteUrl } from '@/lib/site'

export const dynamic = 'force-dynamic'

type SearchParams = {
  query?: string | string[]
  retailer?: string | string[]
  limit?: string | string[]
  category?: string | string[]
  minPrice?: string | string[]
  maxPrice?: string | string[]
  sort?: string | string[]
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parseSearchParams(searchParams: SearchParams) {
  const query = (firstParam(searchParams.query) || '').trim()
  const retailer = (firstParam(searchParams.retailer) || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  const categoryValue = firstParam(searchParams.category)
  const category = isSupportedCategory(categoryValue) ? categoryValue : null
  const limitValue = Number.parseInt(firstParam(searchParams.limit) || '', 10)
  const { minPrice, maxPrice } = normalizePriceRange(firstParam(searchParams.minPrice), firstParam(searchParams.maxPrice))
  const sort = normalizePriceSort(firstParam(searchParams.sort))

  return {
    query,
    retailer,
    category,
    limit: Number.isFinite(limitValue) ? limitValue : 120,
    minPrice,
    maxPrice,
    sort,
  }
}

function formatCount(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value)
}

function describeWarning(code: string) {
  switch (code) {
    case 'demo_fallback':
      return 'Les offres de démonstration sont affichées en l’absence de base locale.'
    case 'partial_database_coverage':
      return 'La base locale ne couvre pas encore toutes les enseignes demandées.'
    case 'browser_scraper_unavailable_on_runtime':
      return "Certaines enseignes nécessitent un navigateur et ne peuvent pas être rafraîchies ici."
    default:
      return code
  }
}

async function fetchDeals(
  query: string,
  retailer: string | null,
  limit: number,
  category: string | null,
  minPrice: number | null,
  maxPrice: number | null,
  sort: string,
) {
  return loadDealsFeed({
    query,
    retailer,
    category,
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : 120,
    minPrice,
    maxPrice,
    sort,
    liveScrape: false,
    persistLive: false,
  })
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const resolvedSearchParams = await searchParams
  const { query } = parseSearchParams(resolvedSearchParams)
  const title = query ? `Bons plans: ${query}` : 'Bons plans de la semaine'
  const canonicalParams = new URLSearchParams()

  if (query) {
    canonicalParams.set('query', query)
  }

  const description = 'Les bons plans actuels des enseignes discount, centralisés par boutique et recherchables par produit.'

  return {
    title,
    description,
    alternates: {
      canonical: canonicalParams.toString() ? `/deals?${canonicalParams.toString()}` : '/deals',
    },
    openGraph: {
      title: `${title} | ComparPrix`,
      description,
      url: absoluteUrl('/deals'),
      type: 'website',
      images: [
        {
          url: '/brand/comparprix-social.svg',
          width: 1200,
          height: 630,
          alt: 'Bons plans | ComparPrix',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/brand/comparprix-social.svg'],
    },
  }
}

export default async function DealsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams
  const { query, retailer, category, limit, minPrice, maxPrice, sort } = parseSearchParams(resolvedSearchParams)
  const feed = await fetchDeals(query, retailer.join(',') || null, limit, category, minPrice, maxPrice, sort)

  return (
    <>
      <Navbar />

      <section className="border-b bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <Link href="/" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-ink-soft transition-colors hover:text-navy">
            <ArrowLeft size={16} strokeWidth={1.8} aria-hidden="true" />
            Retour à l&apos;accueil
          </Link>

          <div className="mt-10 grid gap-8 md:grid-cols-[minmax(0,1fr)_12rem] md:items-end md:gap-12">
            <div>
              <p className="meta-label">Promotions</p>
              <h1 className="display-huge mt-3 text-fluid-display text-balance">Les bons plans de la semaine</h1>
              <p className="mt-5 max-w-2xl text-lg leading-7 text-ink-soft">
                Retrouvez les offres promotionnelles relevées dans les catalogues des enseignes suivies.
              </p>
            </div>
            <div className="border-t pt-4 md:border-l md:border-t-0 md:pl-5">
              <p className="meta-label">Offres disponibles</p>
              <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-ink">{formatCount(feed.count)}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <form action="/deals" method="get" className="surface-elevated p-3 sm:p-4">
            {retailer.length > 0 && <input type="hidden" name="retailer" value={retailer.join(',')} />}
            {Number.isFinite(limit) && limit > 0 && <input type="hidden" name="limit" value={limit} />}
            {category && <input type="hidden" name="category" value={category} />}
            {minPrice !== null && <input type="hidden" name="minPrice" value={String(minPrice)} />}
            {maxPrice !== null && <input type="hidden" name="maxPrice" value={String(maxPrice)} />}
            {sort !== 'default' && <input type="hidden" name="sort" value={sort} />}
            <div className="input-shell flex min-h-14 items-center gap-3 p-1.5">
              <Search className="ml-2 shrink-0 text-ink-soft" size={20} strokeWidth={1.8} />
              <input
                name="query"
                type="text"
                defaultValue={query}
                placeholder="Filtrer les bons plans par mot-clé"
                aria-label="Rechercher un bon plan"
                className="min-w-0 flex-1 bg-transparent px-1 py-2 text-base text-ink outline-none placeholder:text-ink-faint body-sans sm:text-lg"
              />
              <button type="submit" className="btn-primary inline-flex min-h-11 shrink-0 items-center gap-2 px-4 text-sm sm:px-5">
                Filtrer
                <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
              </button>
            </div>
          </form>

          <RetailerFilterPanel selectedRetailers={retailer} minPrice={minPrice} maxPrice={maxPrice} sort={sort} />

          {feed.warnings.length > 0 && (
            <div className="flex items-start gap-3 rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-ink">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-warning" strokeWidth={1.8} aria-hidden="true" />
              <ul className="space-y-1.5 text-ink-soft">
                {feed.warnings.map((warning) => (
                  <li key={warning} className="leading-6">{describeWarning(warning)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-10">
          {feed.products.length > 0 ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5">
                <div>
                  <p className="font-mono text-4xl font-semibold tracking-tight text-ink tabular-nums">{feed.products.length}</p>
                  <p className="mt-1 text-sm text-ink-soft">
                    bon{feed.products.length > 1 ? 's' : ''} plan{feed.products.length > 1 ? 's' : ''}
                    {query ? <> pour <span className="font-semibold text-navy">« {query} »</span></> : null}
                  </p>
                </div>
                <p className="text-xs font-medium text-ink-faint">Triés par prix croissant</p>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {feed.products.map((product, index) => (
                  <ProductCard key={product.id} product={product} isBest={index === 0 && sort !== 'price-desc'} index={index} />
                ))}
              </div>
            </div>
          ) : (
            <div className="surface-elevated mx-auto max-w-xl p-8 text-center">
              <p className="meta-label">Aucune correspondance</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">Aucun bon plan trouvé</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-soft">
                Aucun résultat ne correspond à votre recherche. Réinitialisez les filtres ou revenez à l&apos;accueil.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/deals" className="btn-primary inline-flex min-h-11 items-center gap-2 px-5 text-sm">
                  Réinitialiser
                </Link>
                <Link href="/" className="btn-secondary inline-flex min-h-11 items-center gap-2 px-5 text-sm">
                  Retour à l&apos;accueil
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
