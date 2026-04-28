import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

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

export async function generateMetadata({ params }: { params: CategoryPageParams }): Promise<Metadata> {
  if (!isSupportedCategory(params.category)) {
    return {
      title: 'Catégorie introuvable',
      description: 'Cette catégorie n’existe pas.',
    }
  }

  const categoryLabel = CATEGORY_LABELS[params.category]

  return {
    title: categoryLabel,
    description: `Découvrez les meilleures offres dans la catégorie ${categoryLabel.toLowerCase()} chez Action, Stokomani, B&M, Centrakor et Aldi.`,
    alternates: {
      canonical: `/categorie/${params.category}`,
    },
    openGraph: {
      title: `${categoryLabel} | ComparPrix`,
      description: `Les meilleures offres ${categoryLabel.toLowerCase()} mises à jour régulièrement.`,
      url: absoluteUrl(`/categorie/${params.category}`),
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

export default async function CategoryPage({ params }: { params: CategoryPageParams }) {
  if (!isSupportedCategory(params.category)) {
    notFound()
  }

  const categoryLabel = CATEGORY_LABELS[params.category]
  const offers = await getOffersByCategory(params.category)

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-20">
        <div className="max-w-3xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-accent mb-4">Catégorie</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground dark:text-slate-100">
            {categoryLabel}
          </h1>
          <p className="mt-4 text-muted leading-relaxed dark:text-slate-400">
            {offers.length
              ? `Sélection actuelle de ${formatCount(offers.length)} offre${offers.length > 1 ? 's' : ''} dans ${categoryLabel.toLowerCase()}.`
              : `Aucune offre n’est disponible pour ${categoryLabel.toLowerCase()} pour le moment.`}
          </p>
        </div>

        <div className="mt-10">
          {offers.length === 0 ? (
            <div className="card p-8 text-center max-w-xl">
              <p className="text-muted dark:text-slate-400">Aucune offre trouvée pour cette catégorie.</p>
              <Link href="/" className="btn-primary inline-flex mt-6">
                Retour à l&apos;accueil
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
              {offers.map((offer, index) => (
                <ProductCard key={offer.id} product={offer} isBest={index === 0} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
