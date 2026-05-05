import type { Metadata } from 'next'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, Flame, Search, Sparkles } from 'lucide-react'

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
      return "La base locale ne couvre pas encore toutes les enseignes demandées. La section complète dépend du dernier job de synchronisation."
    case 'browser_scraper_unavailable_on_runtime':
      return 'Certaines enseignes nécessitent un navigateur et ne peuvent pas être rafraîchies sur ce runtime.'
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

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { query } = parseSearchParams(searchParams)
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

export default async function DealsPage({ searchParams }: { searchParams: SearchParams }) {
  const { query, retailer, limit } = parseSearchParams(searchParams)
  const selectedRetailers = retailer ? retailer.split(',').map((value) => value.trim()).filter(Boolean) : []
  const isMixedRetailerView = selectedRetailers.length !== 1
  const feed = await fetchDeals(query, retailer, limit)

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:pt-28">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-accent dark:text-slate-400"
          >
            <ArrowLeft size={16} />
            Retour à l&apos;accueil
          </Link>

          <span className="result-badge result-badge-accent">
            <Flame size={12} />
            Bons plans centralisés
          </span>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] lg:items-start">
          <div className="min-w-0 space-y-5">
            <div className="max-w-3xl">
              <p className="section-label">Bons plans</p>
              <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight text-foreground text-balance sm:text-5xl lg:text-6xl dark:text-slate-50">
                Les offres en promo, au centre.
              </h1>
              <p className="support-copy mt-5 max-w-2xl text-base sm:text-lg">
                Retrouvez ici les offres promotionnelles extraites des sections officielles des enseignes, triées par réduction et mises
                à jour dès que possible.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="result-badge result-badge-accent">
                <Sparkles size={12} />
                {formatCount(feed.count)} offre{feed.count > 1 ? 's' : ''}
              </span>
              {isMixedRetailerView && (
                <span className="result-badge">
                  <Sparkles size={12} />
                  Vue mixée par enseigne
                </span>
              )}
              <span className="result-badge">
                Source : {feed.source === 'database' ? 'Base de données' : 'Aucune offre'}
              </span>
              {feed.lastUpdate && (
                <span className="result-badge">
                  Mise à jour :{' '}
                  {new Date(feed.lastUpdate).toLocaleString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              )}
            </div>

            <div className="surface-strong p-4 sm:p-5">
              <form action="/deals" method="get" className="space-y-4">
                {retailer && <input type="hidden" name="retailer" value={retailer} />}
                {Number.isFinite(limit) && limit > 0 && <input type="hidden" name="limit" value={limit} />}
                <div className="field-shell p-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                    <div className="relative flex-1">
                      <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-subtle dark:text-slate-500" size={18} />
                      <input
                        name="query"
                        type="text"
                        defaultValue={query}
                        placeholder="Lessive, gel douche, bonbons..."
                        aria-label="Rechercher un bon plan"
                        className="w-full rounded-[12px] bg-transparent py-4 pl-11 pr-4 text-base text-foreground outline-none placeholder:text-subtle dark:text-slate-100 dark:placeholder:text-slate-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-foreground px-6 py-4 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
                    >
                      Rechercher
                    </button>
                  </div>
                </div>
              </form>
            </div>

            {feed.products.length > 0 ? (
              <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 38rem), 1fr))' }}>
                {feed.products.map((product, index) => (
                  <ProductCard key={product.id} product={product} isBest={index === 0} />
                ))}
              </div>
            ) : (
              <div className="surface mx-auto max-w-2xl px-6 py-10 text-center">
                <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground dark:text-slate-100">
                  Aucun bon plan trouvé
                </h2>
                <p className="support-copy mx-auto mt-3 max-w-lg">
                  Nous n&apos;avons pas trouvé d&apos;offre promo pour le moment. Essayez une autre enseigne ou un autre mot-clé.
                </p>
                <Link
                  href="/"
                  className="mt-6 inline-flex items-center gap-2 rounded-[12px] bg-foreground px-4 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
                >
                  Retour à la recherche
                </Link>
              </div>
            )}

            {feed.warnings.length > 0 && (
              <div className="surface border border-amber-300/40 bg-amber-50 px-5 py-4 text-amber-950 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-50">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-300" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">Informations de couverture</p>
                    <ul className="mt-2 space-y-1 text-sm leading-relaxed">
                      {feed.warnings.map((warning) => (
                        <li key={warning}>{describeWarning(warning)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="section-label">Filtres enseignes</p>
                  <p className="mt-2 text-sm font-medium text-foreground dark:text-slate-100">
                    Choisissez une ou plusieurs enseignes pour concentrer la section bons plans.
                  </p>
                </div>
                <Flame size={18} className="text-accent" />
              </div>
              <RetailerFilterPanel />
            </div>

            <div className="surface p-5 sm:p-6">
              <p className="section-label">Navigation</p>
              <p className="mt-2 text-sm text-muted dark:text-slate-400">
                Cette page se base sur les sections promotionnelles officielles des enseignes et centralise les offres visibles ici.
              </p>
              <Link
                href="/deals"
                className="mt-4 inline-flex items-center gap-2 rounded-[12px] border border-line bg-white px-4 py-3 text-sm font-semibold text-foreground dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                Lien de la section
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
