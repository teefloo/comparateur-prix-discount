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

function safeJsonLd(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const resolvedParams = await params
  const offer = await getOfferById(resolvedParams.id)

  if (!offer) {
    return {
      title: 'Offre introuvable',
      description: 'Cette offre n’existe pas ou n’est plus disponible.',
      alternates: {
        canonical: `/produit/${resolvedParams.id}`,
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
      canonical: `/produit/${resolvedParams.id}`,
    },
    openGraph: {
      title: offer.name,
      description,
      type: 'website',
      url: absoluteUrl(`/produit/${resolvedParams.id}`),
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

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const offer = await getOfferById(resolvedParams.id)

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
    <>
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 pt-24 pb-20 sm:px-6 lg:pt-28">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-accent dark:text-slate-400"
        >
          <ArrowLeft size={16} />
          Retour à la recherche
        </Link>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="surface overflow-hidden">
            <div className="relative aspect-square bg-surfaceSoft dark:bg-slate-950">
              {offer.image ? (
                <Image
                  src={offer.image}
                  alt={offer.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  priority
                  className="object-contain p-6"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-7xl text-subtle dark:text-slate-600">
                  <Tag size={64} />
                </div>
              )}
            </div>

            <div className="border-t border-line p-5 dark:border-slate-800">
              <div className="flex flex-wrap gap-2">
                <span className="result-badge">{offer.category}</span>
                <span className="result-badge result-badge-accent">{retailer.name}</span>
                {offer.brand && <span className="result-badge">{offer.brand}</span>}
              </div>

              <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-foreground text-balance dark:text-slate-50">
                {offer.name}
              </h1>

              <div className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-3 text-sm text-muted dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                <Calendar size={16} className="text-accent" />
                Dernier relevé : {formatDate(offer.lastUpdated)}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <section className="surface p-6">
              <p className="section-label">Offre</p>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <p className="font-display text-4xl font-semibold tracking-tight text-accent tabular-nums">{formatPrice(offer.price)}</p>
                  {offer.unitPrice && offer.unitPriceLabel && (
                    <p className="mt-2 text-sm text-muted dark:text-slate-400">
                      {formatPrice(offer.unitPrice)}
                      {offer.unitPriceLabel}
                    </p>
                  )}
                </div>
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl border border-line bg-white dark:border-slate-800 dark:bg-slate-950">
                  <Image
                    src={retailer.logo}
                    alt={retailer.name}
                    width={56}
                    height={56}
                    className="h-10 w-10 object-contain p-1.5"
                    unoptimized
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {offer.quantity && (
                  <div className="rounded-lg border border-line bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="section-label mb-2">Conditionnement</p>
                    <p className="text-sm font-semibold text-foreground dark:text-slate-100">{offer.quantity}</p>
                  </div>
                )}
                {offer.availability && (
                  <div className="rounded-lg border border-line bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950">
                    <p className="section-label mb-2">Disponibilité</p>
                    <p className="text-sm font-semibold text-foreground dark:text-slate-100">{offer.availability}</p>
                  </div>
                )}
              </div>
            </section>

            <section className="surface p-6">
              <p className="section-label">Détails</p>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-sm font-semibold text-foreground dark:text-slate-100">Description</p>
                  <p className="mt-2 text-sm leading-relaxed text-muted dark:text-slate-400">
                    {offer.description || 'Aucune description disponible pour cette offre.'}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={offer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-foreground px-4 py-3 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
                >
                  Voir la fiche enseigne
                  <ExternalLink size={14} />
                </a>
                <Link
                  href="/"
                  className="inline-flex items-center justify-center gap-2 rounded-[12px] border border-line bg-white px-4 py-3 text-sm font-semibold text-foreground dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                  <Tag size={14} />
                  Nouvelle recherche
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
