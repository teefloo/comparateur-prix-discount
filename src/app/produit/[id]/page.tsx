import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Calendar, ExternalLink, Tag } from 'lucide-react'

import Navbar from '@/components/Navbar'
import { RETAILER_INFO } from '@/lib/catalog'
import { getOfferById } from '@/lib/db'
import { absoluteUrl } from '@/lib/site'

export const dynamic = 'force-dynamic'

function formatPrice(value: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(value)
}

function formatDate(dateString: string | null | undefined) {
  if (!dateString) return 'Date inconnue'
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function buildAvailabilityLabel(availability?: string | null) {
  if (!availability) return 'https://schema.org/InStock'
  const normalized = availability.toLowerCase()
  if (normalized.includes('rupture') || normalized.includes('indispon')) {
    return 'https://schema.org/OutOfStock'
  }
  return 'https://schema.org/InStock'
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const offer = await getOfferById(params.id)

  if (!offer) {
    return {
      title: 'Offre introuvable',
      description: 'Cette offre n’existe pas ou n’est plus disponible.',
      alternates: {
        canonical: `/produit/${params.id}`,
      },
    }
  }

  const retailer = RETAILER_INFO[offer.retailer]
  const description = [
    retailer.name,
    offer.category,
    offer.quantity,
    offer.unitPrice ? `${offer.unitPrice}${offer.unitPriceLabel || ''}` : null,
  ]
    .filter(Boolean)
    .join(' - ')

  return {
    title: `${offer.name}`,
    description:
      offer.description ||
      `${offer.name} chez ${retailer.name}. ${offer.price.toFixed(2)} EUR${offer.unitPrice ? `, ${offer.unitPrice}${offer.unitPriceLabel || ''}` : ''}.`,
    alternates: {
      canonical: `/produit/${params.id}`,
    },
    openGraph: {
      title: offer.name,
      description,
      type: 'website',
      url: absoluteUrl(`/produit/${params.id}`),
      images: [
        {
          url: offer.image || '/logo.png',
          width: 1200,
          height: 630,
          alt: offer.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: offer.name,
      description,
      images: [offer.image || '/logo.png'],
    },
  }
}

export default async function ProductPage({ params }: { params: { id: string } }) {
  const offer = await getOfferById(params.id)

  if (!offer) {
    notFound()
  }

  const retailer = RETAILER_INFO[offer.retailer]
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: offer.name,
    description: offer.description || offer.name,
    image: offer.image ? [offer.image] : undefined,
    brand: offer.brand ? { '@type': 'Brand', name: offer.brand } : undefined,
    category: offer.category,
    offers: {
      '@type': 'Offer',
      url: offer.url,
      priceCurrency: 'EUR',
      price: offer.price,
      availability: buildAvailabilityLabel(offer.availability),
      seller: {
        '@type': 'Organization',
        name: retailer.name,
      },
    },
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 pt-24 pb-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-muted hover:text-accent mb-8 transition-colors font-medium text-sm dark:text-slate-400 dark:hover:text-accent"
        >
          <ArrowLeft size={16} />
          Retour à la recherche
        </Link>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5">
            <div className="card p-6 sticky top-24">
              <div className="aspect-square bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200 mb-6 p-4 overflow-hidden dark:bg-slate-700/50 dark:border-slate-700">
                {offer.image ? (
                  <div className="relative w-full h-full">
                    <Image
                      src={offer.image}
                      alt={offer.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      className="object-contain hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                ) : (
                  <span className="text-6xl opacity-20">📦</span>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-muted text-[10px] font-bold uppercase tracking-widest dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400">
                    {offer.category}
                  </span>
                  <span className="px-3 py-1 bg-accent-subtle border border-accent/20 rounded-full text-accent text-[10px] font-bold uppercase tracking-widest dark:bg-accent/15">
                    {retailer.name}
                  </span>
                  {offer.brand && (
                    <span className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-muted text-[10px] font-bold uppercase tracking-widest dark:bg-slate-700 dark:border-slate-600 dark:text-slate-400">
                      {offer.brand}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-foreground leading-tight dark:text-slate-100">{offer.name}</h1>

                <div className="flex items-center gap-2 text-muted text-xs font-medium bg-slate-50 border border-slate-200 p-3 rounded-xl dark:bg-slate-700/50 dark:border-slate-700 dark:text-slate-300">
                  <Calendar size={14} className="text-accent" />
                  Dernier relevé : {formatDate(offer.lastUpdated)}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="space-y-6">
              <div className="bg-accent p-8 rounded-2xl text-white shadow-accent-lg">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest mb-2">Offre en cours</p>
                    <h2 className="text-3xl font-bold">{formatPrice(offer.price)}</h2>
                    {offer.unitPrice && offer.unitPriceLabel && (
                      <p className="text-white/70 text-sm mt-1 font-medium">
                        {formatPrice(offer.unitPrice)}
                        {offer.unitPriceLabel}
                      </p>
                    )}
                  </div>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: retailer.color }}
                  >
                    <Image
                      src={retailer.logo}
                      alt={retailer.name}
                      width={56}
                      height={56}
                      className="object-contain p-2"
                      unoptimized
                    />
                  </div>
                </div>
              </div>

              <div className="card overflow-hidden">
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-bold text-foreground dark:text-slate-100">Détails de l&apos;offre</h2>
                </div>

                <div className="p-6 space-y-5">
                  {offer.quantity && (
                    <div>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1 dark:text-slate-400">Conditionnement</p>
                      <p className="text-foreground font-semibold dark:text-slate-200">{offer.quantity}</p>
                    </div>
                  )}

                  {offer.availability && (
                    <div>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1 dark:text-slate-400">Disponibilité</p>
                      <p className="text-foreground font-semibold dark:text-slate-200">{offer.availability}</p>
                    </div>
                  )}

                  {offer.description && (
                    <div>
                      <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1 dark:text-slate-400">Description</p>
                      <p className="text-muted leading-relaxed text-sm dark:text-slate-400">{offer.description}</p>
                    </div>
                  )}

                  <a
                    href={offer.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary inline-flex items-center gap-2"
                  >
                    Voir la fiche enseigne <ExternalLink size={16} />
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 p-5 bg-slate-50 border border-slate-200 rounded-xl dark:bg-slate-700/50 dark:border-slate-700">
                <Tag size={14} className="text-muted dark:text-slate-400" />
                <p className="text-[10px] font-medium text-muted leading-relaxed uppercase tracking-widest dark:text-slate-400">
                  Cette page affiche une offre enseigne unique, avec son prix, sa disponibilité et son lien d&apos;origine.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
