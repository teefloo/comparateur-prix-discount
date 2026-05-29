import type { Metadata } from 'next'

import CategoryBar from '@/components/CategoryBar'
import Navbar from '@/components/Navbar'
import ProductGrid from '@/components/ProductGrid'
import SearchWorkspace from '@/components/SearchWorkspace'
import { isSupportedCategory, CATEGORY_LABELS, type SupportedCategory } from '@/lib/catalog'
import { filterDemoOffers } from '@/lib/demo-offers'
import { hasDatabaseUrl } from '@/lib/ensure-db-env'
import { normalizePriceRange, normalizePriceSort } from '@/lib/result-filters'
import { runSearch } from '@/lib/search-service'
import { absoluteUrl } from '@/lib/site'

export const dynamic = 'force-dynamic'

type SearchParams = {
  query?: string | string[]
  category?: string | string[]
  retailer?: string | string[]
  minPrice?: string | string[]
  maxPrice?: string | string[]
  sort?: string | string[]
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parseSearchParams(searchParams: SearchParams) {
  const query = (firstParam(searchParams.query) || '').trim()
  const categoryValue = firstParam(searchParams.category)
  const category = isSupportedCategory(categoryValue) ? categoryValue : null
  const retailer = (firstParam(searchParams.retailer) || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  const { minPrice, maxPrice } = normalizePriceRange(
    firstParam(searchParams.minPrice),
    firstParam(searchParams.maxPrice),
  )
  const sort = normalizePriceSort(firstParam(searchParams.sort))

  return { query, category, retailer, minPrice, maxPrice, sort }
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const resolvedSearchParams = await searchParams
  const { query, category } = parseSearchParams(resolvedSearchParams)

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

export default async function Home({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const resolvedSearchParams = await searchParams
  const { query, category, retailer, minPrice, maxPrice, sort } = parseSearchParams(resolvedSearchParams)
  const hasSearched = Boolean(query || category)
  const hasDatabase = hasDatabaseUrl()

  const { products, source, lastUpdate, error } = hasSearched
    ? await runSearch({ query, category, retailer, minPrice, maxPrice, sort })
    : hasDatabase
      ? { products: [], source: null, lastUpdate: null, error: undefined }
      : {
          products: filterDemoOffers({ sort }),
          source: 'demo-fallback' as const,
          lastUpdate: null,
          error: undefined,
        }

  return (
    <>
      <Navbar />

      <SearchWorkspace
        search={query}
        selectedCategory={category}
        selectedRetailers={retailer}
        minPrice={minPrice}
        maxPrice={maxPrice}
        sort={sort}
        source={source}
        error={error}
      />

      {(hasSearched || products.length > 0) && (
        <main className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6">
          {hasSearched && (
            <CategoryBar
              search={query}
              selectedCategory={category}
              selectedRetailers={retailer}
              minPrice={minPrice}
              maxPrice={maxPrice}
              sort={sort}
            />
          )}
          <div className="space-y-4">
            <ProductGrid
              products={products}
              loading={false}
              hasSearched={hasSearched}
              search={query}
              error={error}
              sort={sort}
            />
          </div>
        </main>
      )}
    </>
  )
}
