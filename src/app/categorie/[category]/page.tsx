import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import Navbar from '@/components/Navbar'
import ProductCard from '@/components/ProductCard'
import { CATEGORY_LABELS, SUPPORTED_CATEGORIES, type SupportedCategory } from '@/lib/catalog'
import { getOffersByCategory } from '@/lib/db'
import { absoluteUrl } from '@/lib/site'

export const dynamic = 'force-dynamic'

type CategoryPageParams = {
  category: string
}

function isSupportedCategory(value: string): value is SupportedCategory {
  return SUPPORTED_CATEGORIES.includes(value as SupportedCategory)
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

export default async function CategoryPage({ params }: { params: Promise<CategoryPageParams> }) {
  const resolvedParams = await params

  if (!isSupportedCategory(resolvedParams.category)) {
    notFound()
  }

  const categoryLabel = CATEGORY_LABELS[resolvedParams.category]
  const offers = await getOffersByCategory(resolvedParams.category)

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 lg:pt-28">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-accent dark:text-slate-400">
          <ArrowLeft size={16} />
          Retour à la recherche
        </Link>

        <div className="mt-8">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground dark:text-slate-50">{categoryLabel}</h1>
          <p className="mt-2 text-sm font-medium text-muted dark:text-slate-400">
            {formatCount(offers.length)} offre{offers.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="mt-6">
          {offers.length === 0 ? (
            <div className="mx-auto max-w-xl rounded-lg border border-line/70 bg-white px-4 py-6 text-center dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-foreground dark:text-slate-100">Aucune offre trouvée</h2>
              <Link
                href="/"
                className="mt-4 inline-flex min-h-10 items-center rounded-lg bg-foreground px-4 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
              >
                Retour à l&apos;accueil
              </Link>
            </div>
          ) : (
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 28rem), 1fr))' }}>
              {offers.map((offer, index) => (
                <ProductCard key={offer.id} product={offer} isBest={index === 0} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  )
}
