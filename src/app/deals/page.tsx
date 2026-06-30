import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, ArrowUpRight, Search, Sparkles } from 'lucide-react'

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
  const { minPrice, maxPrice } = normalizePriceRange(
    firstParam(searchParams.minPrice),
    firstParam(searchParams.maxPrice),
  )
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
          url: '/logo.png',
          width: 512,
          height: 512,
          alt: 'Bons plans | ComparPrix',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/logo.png'],
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

      <section className="relative border-b-2 border-ink bg-cream pt-32 pb-12">
        <div className="absolute inset-0 -z-10 grain" aria-hidden />
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft transition-colors hover:text-navy"
          >
            <ArrowLeft size={15} strokeWidth={2.5} />
            Retour à l&apos;accueil
          </Link>

          <div className="mt-8 grid items-end gap-6 md:grid-cols-[1.5fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <span className="eyebrow text-ink-faint">№ 02 — La une du Bulletin</span>
                <span className="dotline h-px w-12 bg-ink/30" />
                <span className="yellow-stamp mono text-[10px] uppercase">Promotions</span>
              </div>
              <h1 className="display-huge mt-3 text-fluid-display text-ink">
                Les bons
                <span className="block text-navy stamp-rotate-1">plans.</span>
              </h1>
              <p className="editorial mt-5 text-2xl leading-snug text-ink-soft max-w-2xl text-pretty">
                Le trihebdomadaire des promotions repérées dans les linéaires.{' '}
                <span className="editorial-italic text-navy">Moins cher cette semaine</span>, c&apos;est ici.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="border-2 border-ink bg-cream p-4 shadow-[4px_4px_0_var(--ink)]">
                <p className="eyebrow text-ink-faint">Offres</p>
                <p className="display-md text-4xl text-ink tabular-nums mt-1">{formatCount(feed.count)}</p>
              </div>
              <div className="border-2 border-ink bg-cream p-4 shadow-[4px_4px_0_var(--navy)]">
                <p className="eyebrow text-ink-faint">Édition</p>
                <p className="display-md text-2xl text-navy mt-1">№ 02</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-10 sm:px-6">
        <div className="space-y-4">
          <form action="/deals" method="get" className="border-2 border-ink bg-cream p-4 shadow-[4px_4px_0_var(--ink)]">
            {retailer.length > 0 && <input type="hidden" name="retailer" value={retailer.join(',')} />}
            {Number.isFinite(limit) && limit > 0 && <input type="hidden" name="limit" value={limit} />}
            {category && <input type="hidden" name="category" value={category} />}
            {minPrice !== null && <input type="hidden" name="minPrice" value={String(minPrice)} />}
            {maxPrice !== null && <input type="hidden" name="maxPrice" value={String(maxPrice)} />}
            {sort !== 'default' && <input type="hidden" name="sort" value={sort} />}
            <div className="flex items-center gap-2.5 border-2 border-ink bg-cream px-3 shadow-[2px_2px_0_var(--ink)] focus-within:shadow-[3px_3px_0_var(--ink)]">
              <Search className="shrink-0 text-ink" size={20} strokeWidth={2.5} />
              <input
                name="query"
                type="text"
                defaultValue={query}
                placeholder="Filtrer les bons plans par mot-clé…"
                aria-label="Rechercher un bon plan"
                className="min-w-0 flex-1 bg-transparent py-3.5 text-lg text-ink outline-none placeholder:text-ink-faint body-sans"
              />
              <button
                type="submit"
                className="btn-ink inline-flex h-11 shrink-0 items-center gap-2 px-4 text-sm"
              >
                <span className="display-md leading-none">Filtrer</span>
                <ArrowUpRight size={14} strokeWidth={2.5} />
              </button>
            </div>
          </form>

          <RetailerFilterPanel selectedRetailers={retailer} minPrice={minPrice} maxPrice={maxPrice} sort={sort} />

          {feed.warnings.length > 0 && (
            <div className="flex gap-3 border-2 border-yellow bg-cream p-4 text-sm text-ink shadow-[4px_4px_0_var(--yellow)]">
              <AlertTriangle size={18} className="mt-0.5 shrink-0 text-yellow" strokeWidth={2.5} />
              <ul className="space-y-1.5">
                {feed.warnings.map((warning) => (
                  <li key={warning} className="leading-relaxed">{describeWarning(warning)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-8">
          {feed.products.length > 0 ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-4">
                <div className="flex items-baseline gap-3">
                  <span className="display-md text-5xl text-ink tabular-nums">{feed.products.length}</span>
                  <div className="leading-tight">
                    <p className="eyebrow text-ink-faint">bons plans</p>
                    {query && (
                      <p className="editorial text-lg text-ink-soft">
                        pour <span className="italic text-navy">«&nbsp;{query}&nbsp;»</span>
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-yellow" strokeWidth={2.5} />
                  <span className="eyebrow text-ink-faint">Tri par meilleur prix</span>
                </div>
              </div>
              <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 22rem), 1fr))' }}>
                {feed.products.map((product, index) => (
                  <ProductCard key={product.id} product={product} isBest={index === 0 && sort !== 'price-desc'} index={index} />
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-xl border-2 border-ink bg-cream p-8 text-center shadow-[5px_5px_0_var(--ink)]">
              <p className="eyebrow text-ink-faint">Page blanche</p>
              <h2 className="display-md mt-2 text-3xl text-ink">Aucun bon plan trouvé</h2>
              <p className="mt-3 text-sm text-ink-soft leading-relaxed">
                Aucun résultat ne correspond à votre recherche. Réinitialisez les filtres ou revenez à l&apos;accueil.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/deals"
                  className="btn-ink inline-flex min-h-11 items-center gap-2 px-5 text-sm"
                >
                  Réinitialiser
                </Link>
                <Link
                  href="/"
                  className="btn-paper inline-flex min-h-11 items-center gap-2 px-5 text-sm"
                >
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
