import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Sparkles } from 'lucide-react'

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
          url: '/logo.png',
          width: 512,
          height: 512,
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

      <section className="relative border-b-2 border-ink bg-cream pt-32 pb-12">
        <div className="absolute inset-0 -z-10 grain" aria-hidden />
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft transition-colors hover:text-navy"
          >
            <ArrowLeft size={15} strokeWidth={2.5} />
            Retour à la recherche
          </Link>

          <div className="mt-8 flex items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="eyebrow text-ink-faint">Rayon</span>
                <span className="dotline h-px w-12 bg-ink/30" />
              </div>
              <h1 className="display-huge mt-2 text-fluid-display text-ink">
                {categoryLabel}.
              </h1>
              <p className="editorial mt-4 text-xl text-ink-soft max-w-2xl text-pretty">
                Toutes les offres de la catégorie, classées par meilleur prix, mises à jour chaque semaine.
              </p>
            </div>
            <div className="hidden border-2 border-ink bg-cream p-4 shadow-[4px_4px_0_var(--ink)] sm:block">
              <p className="eyebrow text-ink-faint">Total</p>
              <p className="display-md mt-1 text-4xl text-navy tabular-nums">{formatCount(offers.length)}</p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6">
        <div className="mb-6 sm:hidden">
          <div className="flex items-center gap-3 border-2 border-ink bg-cream p-3 shadow-[3px_3px_0_var(--ink)]">
            <Sparkles size={14} className="text-yellow" strokeWidth={2.5} />
            <span className="eyebrow text-ink-faint">
              {formatCount(offers.length)} offre{offers.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="space-y-5">
          <RetailerFilterPanel selectedRetailers={retailer} minPrice={minPrice} maxPrice={maxPrice} sort={sort} />

          {offers.length === 0 ? (
            <div className="mx-auto max-w-xl border-2 border-ink bg-cream p-8 text-center shadow-[5px_5px_0_var(--ink)]">
              <p className="eyebrow text-ink-faint">Page blanche</p>
              <h2 className="display-md mt-2 text-3xl text-ink">Aucune offre trouvée</h2>
              <p className="mt-3 text-sm text-ink-soft leading-relaxed">
                Aucun résultat ne correspond à votre recherche dans cette catégorie.
              </p>
              <Link
                href="/"
                className="btn-ink mt-6 inline-flex min-h-11 items-center gap-2 px-5 text-sm"
              >
                Retour à l&apos;accueil
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-4">
                <div className="flex items-baseline gap-3">
                  <span className="display-md text-5xl text-ink tabular-nums">{offers.length}</span>
                  <div className="leading-tight">
                    <p className="eyebrow text-ink-faint">offres</p>
                    <p className="editorial text-lg text-ink-soft">catégorie {categoryLabel.toLowerCase()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles size={14} className="text-yellow" strokeWidth={2.5} />
                  <span className="eyebrow text-ink-faint">Tri par meilleur prix</span>
                </div>
              </div>
              <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 22rem), 1fr))' }}>
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
