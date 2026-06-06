import type { Metadata } from 'next'
import Link from 'next/link'

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
          url: '/logo.png',
          width: 512,
          height: 512,
          alt: 'ComparPrix',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'ComparPrix — Le Bulletin des Prix Discount',
      description: "Le comparateur de prix discount nouvelle génération, pour 10 enseignes françaises.",
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
        <main className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6">
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
    <section className="border-y-2 border-ink bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b-2 border-ink pb-5">
          <div>
            <p className="eyebrow text-ink-faint">Sommaire de l&apos;édition</p>
            <h2 className="display-xl mt-2 text-5xl text-ink sm:text-6xl">Trois choses à savoir.</h2>
          </div>
          <p className="editorial text-lg text-ink-soft max-w-md text-pretty">
            Une seule page, trois portes d&apos;entrée.{' '}
            <span className="italic text-navy">Choisissez votre angle</span> et laissez faire le comparateur.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <SommaireCard
            number="01"
            kicker="L'essentiel"
            title="Une recherche, dix réponses."
            description="Tapez un produit. La base croise Action, Stokomani, B&M, Centrakor, Aldi, GiFi, La Foir'Fouille, Lidl, Maxi Bazar et Noz en un seul coup d'œil."
            cta="Lancer une recherche"
            href="/?query=lessive"
            accent="navy"
          />
          <SommaireCard
            number="02"
            kicker="Le filon"
            title="Les bons plans du moment."
            description="Une page dédiée aux promotions repérées cette semaine, classées par enseigne et par catégorie, pour shopper malin."
            cta="Voir les bons plans"
            href="/deals"
            accent="yellow"
          />
          <SommaireCard
            number="03"
            kicker="La logique"
            title="Le manifeste du Bulletin."
            description="Pourquoi un comparateur ouvert, transparent, et tenu à jour chaque semaine. Sans cookie, sans tracker, sans pub."
            cta="Lire le manifeste"
            href="/a-propos"
            accent="ink"
          />
        </div>

        <div className="mt-12 border-t-2 border-ink pt-8">
          <p className="eyebrow text-ink-faint mb-5">Enseignes distribuées cette semaine</p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
            {RETAILERS.map((retailerId) => {
              const retailer = RETAILER_INFO[retailerId]
              return (
                <Link
                  key={retailerId}
                  href={`/?retailer=${retailerId}`}
                  className="group flex items-center gap-2.5 border-2 border-ink/60 bg-cream px-3 py-2.5 shadow-[3px_3px_0_var(--ink)] transition-all hover:-translate-x-[1.5px] hover:-translate-y-[1.5px] hover:border-ink hover:shadow-[4.5px_4.5px_0_var(--ink)]"
                >
                  <span
                    className="grid h-7 w-7 shrink-0 place-items-center border border-ink/70"
                    style={{ backgroundColor: retailer.color + '33' }}
                  >
                    <span
                      className="mono text-[10px] font-bold"
                      style={{ color: retailer.color }}
                    >
                      {retailer.name.slice(0, 2).toUpperCase()}
                    </span>
                  </span>
                  <div className="min-w-0">
                    <p className="editorial text-sm font-medium text-ink truncate group-hover:text-navy transition-colors">
                      {retailer.name}
                    </p>
                    <p className="mono text-[9px] text-ink-faint uppercase">scrapé chaque semaine</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function SommaireCard({
  number,
  kicker,
  title,
  description,
  cta,
  href,
  accent,
}: {
  number: string
  kicker: string
  title: string
  description: string
  cta: string
  href: string
  accent: 'navy' | 'yellow' | 'ink'
}) {
  const accentColor = accent === 'navy' ? 'var(--navy)' : accent === 'yellow' ? 'var(--yellow)' : 'var(--ink)'

  return (
    <Link
      href={href}
      className="group relative flex flex-col border-2 border-ink bg-cream p-6 shadow-[5px_5px_0_var(--ink)] transition-all duration-200 hover:-translate-x-[4px] hover:-translate-y-[4px] hover:shadow-[9px_9px_0_var(--ink)]"
    >
      <div className="absolute -top-3 left-5 grid h-7 min-w-12 place-items-center border-2 border-ink bg-ink px-2 mono text-xs font-bold text-cream">
        № {number}
      </div>
      <div className="flex items-start justify-between gap-3">
        <p className="eyebrow text-ink-faint pt-1">{kicker}</p>
        <span
          className="grid h-8 w-8 shrink-0 place-items-center border-2 border-ink"
          style={{ backgroundColor: `rgb(${accentColor})` }}
        >
          <span className="display-md text-base text-cream leading-none">{number}</span>
        </span>
      </div>
      <h3 className="editorial mt-5 text-2xl font-medium leading-tight text-ink text-balance">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft text-pretty">{description}</p>
      <div className="mt-6 flex items-center gap-2 pt-2">
        <span className="display-md text-sm text-navy">{cta}</span>
        <span className="text-navy transition-transform group-hover:translate-x-1">→</span>
      </div>
    </Link>
  )
}
