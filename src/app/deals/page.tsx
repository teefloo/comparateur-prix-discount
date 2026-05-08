import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, Search } from 'lucide-react'

import Navbar from '@/components/Navbar'
import ProductCard from '@/components/ProductCard'
import RetailerFilterPanel from '@/components/RetailerFilterPanel'
import { loadDealsFeed } from '@/lib/deals-feed'
import { absoluteUrl } from '@/lib/site'

export const dynamic = 'force-dynamic'

type SearchParams = {
  query?: string | string[]
  retailer?: string | string[]
  limit?: string | string[]
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parseSearchParams(searchParams: SearchParams) {
  const query = (firstParam(searchParams.query) || '').trim()
  const retailer = firstParam(searchParams.retailer) || null
  const limitValue = Number.parseInt(firstParam(searchParams.limit) || '', 10)

  return {
    query,
    retailer,
    limit: Number.isFinite(limitValue) ? limitValue : 120,
  }
}

function formatCount(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value)
}

function describeWarning(code: string) {
  switch (code) {
    case 'partial_database_coverage':
      return 'La base locale ne couvre pas encore toutes les enseignes demandées.'
    case 'browser_scraper_unavailable_on_runtime':
      return 'Certaines enseignes nécessitent un navigateur et ne peuvent pas être rafraîchies ici.'
    default:
      return code
  }
}

async function fetchDeals(query: string, retailer: string | null, limit: number) {
  return loadDealsFeed({
    query,
    retailer,
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : 120,
    liveScrape: false,
    persistLive: false,
  })
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const resolvedSearchParams = await searchParams
  const { query } = parseSearchParams(resolvedSearchParams)
  const title = query ? `Recherche bons plans: ${query}` : 'Bons plans'
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
  const { query, retailer, limit } = parseSearchParams(resolvedSearchParams)
  const feed = await fetchDeals(query, retailer, limit)

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:pt-28">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-accent dark:text-slate-400">
          <ArrowLeft size={16} />
          Retour à l&apos;accueil
        </Link>

        <div className="mt-8 max-w-3xl">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground dark:text-slate-50">Bons plans</h1>
          <p className="mt-2 text-sm font-medium text-muted dark:text-slate-400">
            {formatCount(feed.count)} offre{feed.count > 1 ? 's' : ''}
            {query ? ` pour "${query}"` : ''}
          </p>
        </div>

        <div className="mt-5 space-y-3">
          <form action="/deals" method="get">
            {retailer && <input type="hidden" name="retailer" value={retailer} />}
            {Number.isFinite(limit) && limit > 0 && <input type="hidden" name="limit" value={limit} />}
            <div className="flex min-h-12 items-center gap-2 rounded-xl border border-line bg-white px-3 dark:border-slate-800 dark:bg-slate-900">
              <Search className="shrink-0 text-muted dark:text-slate-500" size={18} />
              <input
                name="query"
                type="text"
                defaultValue={query}
                placeholder="Rechercher un bon plan"
                aria-label="Rechercher un bon plan"
                className="min-w-0 flex-1 bg-transparent py-3 text-base text-foreground outline-none placeholder:text-subtle dark:text-slate-100 dark:placeholder:text-slate-500"
              />
              <button
                type="submit"
                className="inline-flex h-9 shrink-0 items-center rounded-lg bg-foreground px-4 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
              >
                Chercher
              </button>
            </div>
          </form>

          <RetailerFilterPanel />

          {feed.warnings.length > 0 && (
            <div className="flex gap-3 rounded-lg border border-amber-300/40 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-50">
              <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" />
              <ul className="space-y-1">
                {feed.warnings.map((warning) => (
                  <li key={warning}>{describeWarning(warning)}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="mt-6">
          {feed.products.length > 0 ? (
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 28rem), 1fr))' }}>
              {feed.products.map((product, index) => (
                <ProductCard key={product.id} product={product} isBest={index === 0} />
              ))}
            </div>
          ) : (
            <div className="mx-auto max-w-xl rounded-lg border border-line/70 bg-white px-4 py-6 text-center dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-foreground dark:text-slate-100">Aucun bon plan trouvé</h2>
              <Link
                href="/deals"
                className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-foreground px-4 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
              >
                Réinitialiser
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
