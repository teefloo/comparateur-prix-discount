import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, Calendar, Package, Tag } from 'lucide-react'

import Navbar from '@/components/Navbar'
import { CATEGORY_LABELS, RETAILER_INFO } from '@/lib/catalog'
import { getDemoOfferById } from '@/lib/demo-offers'
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
  const offer = (await getOfferById(resolvedParams.id)) || getDemoOfferById(resolvedParams.id)

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
  const offer = (await getOfferById(resolvedParams.id)) || getDemoOfferById(resolvedParams.id)

  if (!offer) {
    notFound()
  }

  const retailer = RETAILER_INFO[offer.retailer]
  const categoryLabel = CATEGORY_LABELS[offer.category]
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

  const savings = offer.originalPrice && offer.originalPrice > offer.price ? offer.originalPrice - offer.price : null
  const savingsPercent =
    savings && offer.originalPrice ? Math.round((savings / offer.originalPrice) * 100) : null
  const isOnPromo = Boolean(offer.isOnPromotion && savings && savings > 0)

  return (
    <>
      <Navbar />

      <section className="relative border-b-2 border-ink bg-cream pt-28 pb-12 sm:pt-32">
        <div className="absolute inset-0 -z-10 grain" aria-hidden />
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft transition-colors hover:text-navy"
          >
            <ArrowLeft size={15} strokeWidth={2.5} />
            Retour à la recherche
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="chip">
              <span className="mono text-ink-faint uppercase">cat.</span>
              <span className="font-semibold text-ink">{categoryLabel}</span>
            </span>
            <span
              className="chip"
              style={{ backgroundColor: retailer.color + '26' }}
            >
              <span
                className="grid h-5 w-5 place-items-center border-2 border-ink"
                style={{ backgroundColor: retailer.color }}
              >
                <span className="mono text-[8px] font-bold text-cream">
                  {retailer.name.slice(0, 2).toUpperCase()}
                </span>
              </span>
              <span className="font-semibold text-ink">{retailer.name}</span>
            </span>
            {offer.brand && (
              <span className="chip">
                <Tag size={12} className="text-ink-faint" strokeWidth={2.5} />
                <span className="font-semibold text-ink">{offer.brand}</span>
              </span>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-20 pt-8 sm:px-6">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <article className="relative border-2 border-ink bg-cream shadow-[5px_5px_0_var(--ink)]">
            <div className="paper-fold pointer-events-none absolute top-0 right-0 z-10 h-10 w-10 border-b-2 border-l-2 border-ink bg-paper" />
            <div className="relative aspect-square border-b-2 border-ink bg-paper">
              {offer.image ? (
                <Image
                  src={offer.image}
                  alt={offer.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 45vw"
                  priority
                  className="object-contain p-8"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-ink-faint">
                  <Tag size={80} strokeWidth={1.5} />
                </div>
              )}
              {isOnPromo && (
                <div className="absolute bottom-4 left-4 -rotate-3 border-2 border-ink bg-yellow px-3 py-1.5 shadow-[3px_3px_0_var(--ink)]">
                  <span className="mono text-xs font-bold uppercase tracking-wider text-ink">Promo −{savingsPercent}%</span>
                </div>
              )}
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="eyebrow text-ink-faint">№ Produit</span>
                <span className="dotline h-px flex-1 bg-ink/30" />
                <span className="mono text-[10px] text-ink-faint uppercase tracking-wider truncate max-w-[140px]">
                  {offer.id}
                </span>
              </div>
              <h1 className="display-md text-3xl leading-tight text-ink text-balance sm:text-4xl">
                {offer.name}
              </h1>

              <div className="mt-5 flex items-start gap-3 border-2 border-ink/70 bg-paper p-3.5">
                <Calendar size={16} className="mt-0.5 shrink-0 text-navy" strokeWidth={2.5} />
                <div className="leading-tight">
                  <p className="eyebrow text-ink-faint">Dernier relevé</p>
                  <p className="editorial text-base font-medium text-ink">{formatDate(offer.lastUpdated)}</p>
                </div>
              </div>
            </div>
          </article>

          <div className="space-y-5">
            <section className="relative border-2 border-ink bg-cream p-6 shadow-[5px_5px_0_var(--ink)]">
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="eyebrow text-ink-faint">Étiquette de prix</span>
                  <span className="dotline h-px w-10 bg-ink/30" />
                </div>
                {isOnPromo && offer.originalPrice && (
                  <div className="flex items-center gap-2">
                    <span className="mono text-xs text-ink-faint line-through tabular-nums">
                      {formatPrice(offer.originalPrice)}
                    </span>
                    <span className="mono text-[10px] font-bold uppercase text-navy">Économisez {formatPrice(savings!)}</span>
                  </div>
                )}
              </div>

              <div className="mt-5 flex items-end justify-between gap-4">
                <div>
                  <p className="display-huge text-[12vw] sm:text-[8rem] text-navy leading-[0.85] tabular-nums stamp-rotate-1">
                    {formatPrice(offer.price)}
                  </p>
                  {offer.unitPrice && offer.unitPriceLabel && (
                    <p className="mt-3 mono text-sm text-ink-soft">
                      soit {formatPrice(offer.unitPrice)}
                      {offer.unitPriceLabel}
                    </p>
                  )}
                </div>
                <div className="grid h-16 w-16 place-items-center border-2 border-ink bg-cream shadow-[3px_3px_0_var(--ink)]">
                  <Image
                    src={retailer.logo}
                    alt={retailer.name}
                    width={48}
                    height={48}
                    className="h-10 w-10 object-contain p-1.5"
                    unoptimized
                  />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {offer.quantity && (
                  <div className="border-2 border-ink/70 bg-paper p-3.5">
                    <div className="flex items-center gap-2">
                      <Package size={14} className="text-ink-faint" strokeWidth={2.5} />
                      <p className="eyebrow text-ink-faint">Conditionnement</p>
                    </div>
                    <p className="editorial mt-1.5 text-base font-medium text-ink">{offer.quantity}</p>
                  </div>
                )}
                {offer.availability && (
                  <div className="border-2 border-ink/70 bg-paper p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-navy" aria-hidden />
                      <p className="eyebrow text-ink-faint">Disponibilité</p>
                    </div>
                    <p className="editorial mt-1.5 text-base font-medium text-ink">{offer.availability}</p>
                  </div>
                )}
              </div>
            </section>

            <section className="border-2 border-ink bg-cream p-6 shadow-[4px_4px_0_var(--ink)]">
              <div className="flex items-center gap-3">
                <span className="eyebrow text-ink-faint">Description</span>
                <span className="dotline h-px flex-1 bg-ink/30" />
              </div>
              <p className="editorial mt-3 text-base leading-relaxed text-ink-soft text-pretty">
                {offer.description || 'Aucune description disponible pour cette offre.'}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a
                  href={offer.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ink inline-flex min-h-12 flex-1 items-center justify-center gap-2 px-5 text-sm"
                >
                  <span className="display-md leading-none">Voir la fiche enseigne</span>
                  <ArrowUpRight size={15} strokeWidth={2.5} />
                </a>
                <Link
                  href={`/categorie/${offer.category}`}
                  className="btn-paper inline-flex min-h-12 items-center justify-center gap-2 px-5 text-sm"
                >
                  <Tag size={14} strokeWidth={2.5} />
                  <span>Voir le rayon {categoryLabel.toLowerCase()}</span>
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
