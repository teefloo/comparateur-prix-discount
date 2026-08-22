import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

import CategoryBar from '@/components/CategoryBar'
import Navbar from '@/components/Navbar'
import ProductGrid from '@/components/ProductGrid'
import SearchWorkspace from '@/components/SearchWorkspace'
import { isSupportedCategory, CATEGORY_LABELS, RETAILERS, RETAILER_INFO, type SupportedCategory } from '@/lib/catalog'
import { filterDemoOffers } from '@/lib/demo-offers'
import { hasDatabaseUrl } from '@/lib/ensure-db-env'
import { normalizePriceRange, normalizePriceSort } from '@/lib/result-filters'
import { runSearch } from '@/lib/search-service'
import { absoluteUrl } from '@/lib/site'

export const revalidate = 300

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
      description: 'ComparPrix: le bulletin des prix discount, mis à jour chaque semaine.',
      alternates: {
        canonical: query || category ? `/?${new URLSearchParams({ ...(query ? { query } : {}), ...(category ? { category } : {}) }).toString()}` : '/',
      },
      openGraph: {
        title: `${title} | ComparPrix`,
        description: 'ComparPrix: le bulletin des prix discount, mis à jour chaque semaine.',
        url: absoluteUrl('/'),
        type: 'website',
        images: [
          {
            url: '/brand/comparprix-social.svg',
            width: 1200,
            height: 630,
            alt: 'ComparPrix, comparateur de prix discount',
          },
        ],
      },
    }
  }

  return {
    title: 'ComparPrix — Le Bulletin des Prix Discount',
    description:
      "Le bulletin de chasse aux bonnes affaires : comparateur de prix discount pour Action, Stokomani, B&M, Centrakor, Aldi, GiFi, La Foir'Fouille, Lidl, Maxi Bazar et Noz.",
    alternates: { canonical: '/' },
    openGraph: {
      title: 'ComparPrix — Le Bulletin des Prix Discount',
      description: "Le bulletin de chasse aux bonnes affaires : comparateur de prix discount pour 10 enseignes.",
      type: 'website',
      locale: 'fr_FR',
      url: absoluteUrl('/'),
      siteName: 'ComparPrix',
      images: [
        {
          url: '/brand/comparprix-social.svg',
          width: 1200,
          height: 630,
          alt: 'ComparPrix, comparateur de prix discount',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'ComparPrix — Le Bulletin des Prix Discount',
      description: "Le comparateur de prix discount nouvelle génération, pour 10 enseignes françaises.",
      images: ['/brand/comparprix-social.svg'],
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
        <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
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
          <ProductGrid
            products={products}
            loading={false}
            hasSearched={hasSearched}
            search={query}
            error={error}
            sort={sort}
          />
        </main>
      )}

      {!hasSearched && <SommaireSection />}
    </>
  )
}

function SommaireSection() {
  return (
    <section className="border-b bg-cream">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="max-w-2xl">
          <p className="meta-label">Pour commencer</p>
          <h2 className="display-xl mt-3 text-balance">Une recherche simple, des prix lisibles.</h2>
          <p className="mt-5 text-base leading-7 text-ink-soft">
            Choisissez votre point d&apos;entrée et laissez ComparPrix réunir les offres utiles au même endroit.
          </p>
        </div>

        <div className="mt-10 grid border-y md:grid-cols-3 md:divide-x">
          <QuickLink
            href="/?query=lessive"
            label="Rechercher un produit"
            description="Comparez une même référence entre plusieurs enseignes."
          />
          <QuickLink
            href="/deals"
            label="Voir les bons plans"
            description="Parcourez les promotions relevées cette semaine."
          />
          <QuickLink
            href="/a-propos"
            label="Comprendre le projet"
            description="Découvrez la méthode et les principes de ComparPrix."
          />
        </div>

        <div className="mt-14">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-ink">Enseignes suivies</h2>
            <span className="meta-label">Mise à jour chaque semaine</span>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
            {RETAILERS.map((retailerId) => {
              const retailer = RETAILER_INFO[retailerId]
              return (
                <Link
                  key={retailerId}
                  href={`/?retailer=${retailerId}`}
                  className="group flex min-h-14 items-center gap-3 rounded-lg border bg-cream px-3 transition-colors hover:border-navy"
                >
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md border bg-paper-2">
                    <Image src={retailer.logo} alt="" width={20} height={20} className="h-5 w-5 object-contain" />
                  </span>
                  <span className="min-w-0 truncate text-sm font-medium text-ink transition-colors group-hover:text-navy">
                    {retailer.name}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function QuickLink({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <Link href={href} className="group flex min-h-32 flex-col justify-between gap-4 px-0 py-6 transition-colors md:px-6 first:md:pl-0 last:md:pr-0 hover:text-navy">
      <div>
        <h3 className="text-base font-semibold text-ink group-hover:text-navy">{label}</h3>
        <p className="mt-2 max-w-xs text-sm leading-6 text-ink-soft">{description}</p>
      </div>
      <ArrowRight size={17} strokeWidth={1.8} className="text-navy transition-transform group-hover:translate-x-1" aria-hidden="true" />
    </Link>
  )
}
