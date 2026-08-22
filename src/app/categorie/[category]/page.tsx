import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import Navbar from '@/components/Navbar'
import ProductCard from '@/components/ProductCard'
import RetailerFilterPanel from '@/components/RetailerFilterPanel'
import { CATEGORY_LABELS, SUPPORTED_CATEGORIES, isSupportedCategory, type SupportedCategory } from '@/lib/catalog'
import { filterDemoOffers } from '@/lib/demo-offers'
import { getOffersByCategory } from '@/lib/db'
import { hasDatabaseUrl } from '@/lib/ensure-db-env'
import { applyPriceFilters, normalizePriceBound, normalizePriceSort } from '@/lib/result-filters'
import { absoluteUrl } from '@/lib/site'

export const dynamic = 'force-dynamic'

type CategoryPageParams = {
  category: string
}

type CategorySearchParams = {
  retailer?: string | string[]
  minPrice?: string | string[]
  maxPrice?: string | string[]
  sort?: string | string[]
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parseSearchParams(searchParams: CategorySearchParams) {
  const retailer = (firstParam(searchParams.retailer) || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  const minPrice = normalizePriceBound(firstParam(searchParams.minPrice))
  const maxPrice = normalizePriceBound(firstParam(searchParams.maxPrice))
  const sort = normalizePriceSort(firstParam(searchParams.sort))

  return { retailer, minPrice, maxPrice, sort }
}

function formatCount(value: number) {
  return new Intl.NumberFormat('fr-FR').format(value)
}

export function generateStaticParams() {
  return SUPPORTED_CATEGORIES.map((category) => ({ category }))
}

export async function generateMetadata({ params }: { params: Promise<CategoryPageParams> }): Promise<Metadata> {
  const resolvedParams = await params

  if (!isSupportedCategory(resolvedParams.category)) {
    return {
      title: 'Catégorie introuvable',
      description: "Cette catégorie n'existe pas.",
    }
  }

  const categoryLabel = CATEGORY_LABELS[resolvedParams.category]

  return {
    title: categoryLabel,
    description: `Découvrez les meilleures offres dans la catégorie ${categoryLabel.toLowerCase()} chez Action, Stokomani, B&M, Centrakor, Aldi, GiFi, La Foir'Fouille, Lidl et Noz.`,
    alternates: {
      canonical: `/categorie/${resolvedParams.category}`,
    },
    openGraph: {
      title: `${categoryLabel} | ComparPrix`,
      description: `Les meilleures offres ${categoryLabel.toLowerCase()} mises à jour régulièrement.`,
      url: absoluteUrl(`/categorie/${resolvedParams.category}`),
      type: 'website',
      images: [
        {
          url: '/brand/comparprix-social.svg',
          width: 1200,
          height: 630,
          alt: `${categoryLabel} | ComparPrix`,
        },
      ],
    },
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<CategoryPageParams>
  searchParams: Promise<CategorySearchParams>
}) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const { retailer, minPrice, maxPrice, sort } = parseSearchParams(resolvedSearchParams)

  if (!isSupportedCategory(resolvedParams.category)) {
    notFound()
  }

  const categoryLabel = CATEGORY_LABELS[resolvedParams.category]
  const databaseOffers = await getOffersByCategory(resolvedParams.category, 5000, retailer.join(',') || null, sort)
  const offers =
    databaseOffers.length > 0
      ? applyPriceFilters(databaseOffers, { minPrice, maxPrice, sort })
      : !hasDatabaseUrl()
        ? filterDemoOffers({
            category: resolvedParams.category,
            retailer: retailer.join(',') || null,
            minPrice,
            maxPrice,
            sort,
          })
        : []

  return (
    <>
      <Navbar />

      <section className="border-b bg-paper">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
          <Link href="/" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-ink-soft transition-colors hover:text-navy">
            <ArrowLeft size={16} strokeWidth={1.8} aria-hidden="true" />
            Retour à la recherche
          </Link>

          <div className="mt-10 grid gap-8 md:grid-cols-[minmax(0,1fr)_12rem] md:items-end md:gap-12">
            <div>
              <p className="meta-label">Catégorie</p>
              <h1 className="display-huge mt-3 text-fluid-display text-balance">{categoryLabel}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-7 text-ink-soft">
                Les offres de cette catégorie, classées par prix et mises à jour chaque semaine.
              </p>
            </div>
            <div className="border-t pt-4 md:border-l md:border-t-0 md:pl-5">
              <p className="meta-label">Résultats</p>
              <p className="mt-1 font-mono text-3xl font-semibold tabular-nums text-ink">{formatCount(offers.length)}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <RetailerFilterPanel selectedRetailers={retailer} minPrice={minPrice} maxPrice={maxPrice} sort={sort} />

          {offers.length === 0 ? (
            <div className="surface-elevated mx-auto max-w-xl p-8 text-center">
              <p className="meta-label">Aucune correspondance</p>
              <h2 className="mt-3 text-2xl font-semibold text-ink">Aucune offre trouvée</h2>
              <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-ink-soft">
                Aucun résultat ne correspond à votre recherche dans cette catégorie.
              </p>
              <Link href="/" className="btn-primary mt-6 inline-flex min-h-11 items-center gap-2 px-5 text-sm">
                Retour à l&apos;accueil
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5">
                <div>
                  <p className="font-mono text-4xl font-semibold tracking-tight text-ink tabular-nums">{offers.length}</p>
                  <p className="mt-1 text-sm text-ink-soft">offre{offers.length > 1 ? 's' : ''} dans {categoryLabel.toLowerCase()}</p>
                </div>
                <p className="text-xs font-medium text-ink-faint">Triées par prix croissant</p>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {offers.map((offer, index) => (
                  <ProductCard key={offer.id} product={offer} isBest={index === 0 && sort !== 'price-desc'} index={index} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
