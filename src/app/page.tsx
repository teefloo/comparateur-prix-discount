import type { Metadata } from 'next'
import { headers } from 'next/headers'

import CategoryBar from '@/components/CategoryBar'
import Navbar from '@/components/Navbar'
import ProductGrid from '@/components/ProductGrid'
import SearchWorkspace from '@/components/SearchWorkspace'
import { isSupportedCategory, CATEGORY_LABELS } from '@/lib/catalog'
import { absoluteUrl, getSiteUrl } from '@/lib/site'
import type { SearchSource } from '@/lib/search-ui'
import type { RetailerOfferCard, SupportedCategory } from '@/lib/types'

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
      error: undefined as string | undefined,
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
  const requestHeaders = await headers()
  const forwardedHost = requestHeaders.get('x-forwarded-host')
  const host = forwardedHost || requestHeaders.get('host')
  const proto = requestHeaders.get('x-forwarded-proto') || 'http'
  const origin = host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_SITE_URL || getSiteUrl()
  const { query, category, retailer } = parseSearchParams(searchParams)
  const hasSearched = Boolean(query || category)
  const { products, source, lastUpdate, error } = await fetchSearchResults(query, category, retailer, origin)

  return (
    <>
      <Navbar />

      <SearchWorkspace
        search={query}
        selectedCategory={category}
        source={source}
        lastUpdate={lastUpdate}
        error={error}
      />

      <main className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
        <CategoryBar search={query} selectedCategory={category} />
        <div className="space-y-4">
          <ProductGrid products={products} loading={false} hasSearched={hasSearched} search={query} />
        </div>
      </main>
    </>
  )
}
