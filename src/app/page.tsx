import type { Metadata } from 'next'
import { headers } from 'next/headers'

import CategoryBar from '@/components/CategoryBar'
import Hero from '@/components/Hero'
import Navbar from '@/components/Navbar'
import ProductGrid from '@/components/ProductGrid'
import RetailerFilterPanel from '@/components/RetailerFilterPanel'
import { isRetailer, isSupportedCategory, CATEGORY_LABELS } from '@/lib/catalog'
import { absoluteUrl, getSiteUrl } from '@/lib/site'
import type { RetailerOfferCard, SupportedCategory } from '@/lib/types'

type SearchSource = 'database' | 'real-time' | 'demo-fallback' | null

type SearchParams = {
  query?: string | string[]
  category?: string | string[]
  retailer?: string | string[]
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parseSearchParams(searchParams: SearchParams) {
  const query = (firstParam(searchParams.query) || '').trim()
  const categoryValue = firstParam(searchParams.category)
  const category = isSupportedCategory(categoryValue) ? categoryValue : null
  const retailerValue = firstParam(searchParams.retailer)
  const retailer = retailerValue || null

  return { query, category, retailer }
}

async function fetchSearchResults(
  query: string,
  category: SupportedCategory | null,
  retailer: string | null,
  baseUrl: string,
) {
  if (!query && !category) {
    return {
      products: [] as RetailerOfferCard[],
      source: null as SearchSource,
      lastUpdate: null as string | null,
    }
  }

  const params = new URLSearchParams()
  if (query) params.set('query', query)
  if (category) params.set('category', category)
  if (retailer) params.set('retailer', retailer)

  const response = await fetch(new URL(`/api/search?${params.toString()}`, baseUrl), {
    cache: 'no-store',
  })
  const data = await response.json()

  return {
    products: (data.products || []) as RetailerOfferCard[],
    source: (data.source || null) as SearchSource,
    lastUpdate: (data.lastUpdate || null) as string | null,
    error: data.error as string | undefined,
  }
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { query, category } = parseSearchParams(searchParams)

  if (query || category) {
    const title = query ? `Recherche: ${query}` : CATEGORY_LABELS[category as SupportedCategory]
    return {
      title,
      description: 'ComparPrix: comparez rapidement les offres discount et trouvez le meilleur prix.',
      alternates: {
        canonical: query || category ? `/?${new URLSearchParams({ ...(query ? { query } : {}), ...(category ? { category } : {}) }).toString()}` : '/',
      },
      openGraph: {
        title: `${title} | ComparPrix`,
        description: 'ComparPrix: comparez rapidement les offres discount et trouvez le meilleur prix.',
        url: absoluteUrl('/'),
        type: 'website',
        images: [
          {
            url: '/logo.png',
            width: 512,
            height: 512,
            alt: 'ComparPrix',
          },
        ],
      },
    }
  }

  return {
    title: 'ComparPrix',
    description: 'Comparateur de prix discount pour Action, Stokomani, B&M, Centrakor, Aldi, GiFi, La Foir\'Fouille, Lidl, Maxi Bazar et Noz.',
    alternates: { canonical: '/' },
    openGraph: {
      title: 'ComparPrix',
      description: 'Comparateur de prix discount pour Action, Stokomani, B&M, Centrakor, Aldi, GiFi, La Foir\'Fouille, Lidl, Maxi Bazar et Noz.',
      type: 'website',
      locale: 'fr_FR',
      url: absoluteUrl('/'),
      siteName: 'ComparPrix',
      images: [
        {
          url: '/logo.png',
          width: 512,
          height: 512,
          alt: 'ComparPrix',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'ComparPrix',
      description: 'Comparateur de prix discount pour Action, Stokomani, B&M, Centrakor, Aldi, GiFi, La Foir\'Fouille, Lidl, Maxi Bazar et Noz.',
      images: ['/logo.png'],
    },
  }
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const requestHeaders = headers()
  const forwardedHost = requestHeaders.get('x-forwarded-host')
  const host = forwardedHost || requestHeaders.get('host')
  const proto = requestHeaders.get('x-forwarded-proto') || 'http'
  const origin = host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_SITE_URL || getSiteUrl()
  const { query, category, retailer } = parseSearchParams(searchParams)
  const hasSearched = Boolean(query || category)
  const { products, source, lastUpdate, error } = await fetchSearchResults(query, category, retailer, origin)

  const sourceLabel: Record<Exclude<SearchSource, null>, string> = {
    database: 'Base de données',
    'real-time': 'Scraping live',
    'demo-fallback': 'Mode dégradé',
  }

  return (
    <>
      <Navbar />

      <Hero search={query} selectedCategory={category} />

      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <CategoryBar search={query} selectedCategory={category} />

        <div className="space-y-4">
          {hasSearched && source && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-white px-4 py-4 shadow-card dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${
                    source === 'demo-fallback'
                      ? 'bg-warning/10 text-warning'
                      : 'bg-accent-subtle text-accent'
                  }`}
                >
                  {source === 'database' ? (
                    <span aria-hidden="true">DB</span>
                  ) : (
                    <span aria-hidden="true">↻</span>
                  )}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground dark:text-slate-100">{sourceLabel[source]}</p>
                  <p className="text-xs text-muted dark:text-slate-400">
                    Les résultats s&apos;affichent avec la source la plus fiable disponible.
                  </p>
                </div>
              </div>
              <span className="result-badge">
                {source === 'demo-fallback' ? 'Fallback activé' : 'Source active'}
              </span>
            </div>
          )}

          {hasSearched && !error && <RetailerFilterPanel />}

          {error && (
            <div className="surface flex items-start gap-4 border-danger/20 bg-danger/5 px-5 py-4 dark:border-danger/30 dark:bg-danger/10">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-danger/20 bg-white text-danger dark:border-danger/30 dark:bg-slate-900">
                ⚠️
              </div>
              <div>
                <p className="font-semibold text-foreground dark:text-slate-100">Recherche interrompue</p>
                <p className="mt-1 text-sm text-muted dark:text-slate-400">{error}</p>
              </div>
            </div>
          )}

          <ProductGrid products={products} loading={false} hasSearched={hasSearched} search={query} />

          {lastUpdate && (
            <div className="surface mx-auto max-w-2xl px-5 py-5 text-center">
              <p className="text-sm font-medium text-foreground dark:text-slate-100">
                Dernier relevé des prix :{' '}
                {new Date(lastUpdate).toLocaleString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="mt-2 text-xs text-muted dark:text-slate-400">
                Les prix sont relevés directement sur les plateformes des enseignes. Vérifiez la disponibilité en magasin.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
