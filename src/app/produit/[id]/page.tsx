import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowUpRight, Calendar, Package, Tag } from 'lucide-react'

import Navbar from '@/components/Navbar'
import { CATEGORY_LABELS, RETAILER_INFO } from '@/lib/catalog'
import { getDemoOfferById } from '@/lib/demo-offers'
import { getOfferById } from '@/lib/db'
import { absoluteUrl } from '@/lib/site'

export const dynamic = 'force-static'
export const revalidate = 600
export const dynamicParams = true

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
    title: offer.name,
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
          url: offer.image || '/brand/comparprix-social.svg',
          width: offer.image ? 1200 : 1200,
          height: offer.image ? 1200 : 630,
          alt: offer.name,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: offer.name,
      description,
      images: [offer.image || '/brand/comparprix-social.svg'],
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
  const savingsPercent = savings && offer.originalPrice ? Math.round((savings / offer.originalPrice) * 100) : null
  const isOnPromo = Boolean(offer.isOnPromotion && savings && savings > 0)

  return (
    <>
      <Navbar />

      <section className="border-b bg-paper">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <Link href="/" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-ink-soft transition-colors hover:text-navy">
            <ArrowLeft size={16} strokeWidth={1.8} aria-hidden="true" />
            Retour à la recherche
          </Link>

          <div className="mt-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="chip">
                <span className="font-mono text-[0.65rem] uppercase text-ink-faint">Cat.</span>
                <span className="font-semibold">{categoryLabel}</span>
              </span>
              <span className="chip">
                <span className="grid h-5 w-5 place-items-center rounded-md border bg-cream">
                  <Image src={retailer.logo} alt="" width={16} height={16} className="h-4 w-4 object-contain" />
                </span>
                <span className="font-semibold">{retailer.name}</span>
              </span>
              {offer.brand && (
                <span className="chip">
                  <Tag size={13} className="text-ink-faint" strokeWidth={1.8} aria-hidden="true" />
                  <span className="font-semibold">{offer.brand}</span>
                </span>
              )}
            </div>
            <h1 className="mt-5 max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-ink text-balance sm:text-4xl">{offer.name}</h1>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.92fr)] lg:gap-8">
          <article className="surface-elevated overflow-hidden">
            <div className="relative aspect-square bg-paper-2">
              {offer.image ? (
                // Product images come from retailer sources and may use a new host over time.
                // Keep the product page resilient when a retailer changes its CDN domain.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={offer.image}
                  alt={offer.name}
                  loading="eager"
                  decoding="async"
                  className="h-full w-full object-contain p-8 sm:p-12"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-ink-faint">
                  <Tag size={72} strokeWidth={1.3} aria-hidden="true" />
                </div>
              )}
              {isOnPromo && (
                <div className="absolute bottom-5 left-5 rounded-full border border-navy/30 bg-navy/10 px-3 py-1.5 font-mono text-xs font-semibold text-navy">
                  Promo -{savingsPercent}%
                </div>
              )}
            </div>

            <div className="border-t p-5 sm:p-6">
              <div className="flex items-start gap-3 rounded-xl border bg-paper-2 p-3.5">
                <Calendar size={16} className="mt-0.5 shrink-0 text-navy" strokeWidth={1.8} aria-hidden="true" />
                <div className="leading-tight">
                  <p className="meta-label">Dernier relevé</p>
                  <p className="mt-1 text-sm font-medium text-ink">{formatDate(offer.lastUpdated)}</p>
                </div>
              </div>
            </div>
          </article>

          <div className="space-y-6">
            <section className="surface-elevated p-5 sm:p-6">
              <p className="meta-label">Prix relevé</p>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-mono text-5xl font-semibold tracking-[-0.06em] text-ink tabular-nums sm:text-6xl">{formatPrice(offer.price)}</p>
                  {offer.unitPrice && offer.unitPriceLabel && (
                    <p className="mt-3 text-sm text-ink-soft">
                      soit <span className="font-mono tabular-nums">{formatPrice(offer.unitPrice)}{offer.unitPriceLabel}</span>
                    </p>
                  )}
                </div>
                <div className="grid h-14 w-14 place-items-center rounded-lg border bg-paper-2">
                  <Image src={retailer.logo} alt={retailer.name} width={34} height={34} className="h-8 w-8 object-contain" />
                </div>
              </div>

              {isOnPromo && offer.originalPrice && (
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4 text-sm">
                  <span className="font-mono text-ink-faint line-through tabular-nums">{formatPrice(offer.originalPrice)}</span>
                  <span className="font-semibold text-navy">Économie de {formatPrice(savings!)}</span>
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {offer.quantity && (
                  <div className="surface-muted p-3.5">
                    <div className="flex items-center gap-2">
                      <Package size={15} className="text-ink-faint" strokeWidth={1.8} aria-hidden="true" />
                      <p className="meta-label">Conditionnement</p>
                    </div>
                    <p className="mt-2 text-sm font-medium text-ink">{offer.quantity}</p>
                  </div>
                )}
                {offer.availability && (
                  <div className="surface-muted p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-navy" aria-hidden="true" />
                      <p className="meta-label">Disponibilité</p>
                    </div>
                    <p className="mt-2 text-sm font-medium text-ink">{offer.availability}</p>
                  </div>
                )}
              </div>
            </section>

            <section className="surface-elevated p-5 sm:p-6">
              <p className="meta-label">Description</p>
              <p className="mt-3 text-base leading-7 text-ink-soft text-pretty">
                {offer.description || 'Aucune description disponible pour cette offre.'}
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <a href={offer.url} target="_blank" rel="noopener noreferrer" className="btn-primary inline-flex min-h-12 flex-1 items-center justify-center gap-2 px-5 text-sm">
                  Voir la fiche enseigne
                  <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
                </a>
                <Link href={`/categorie/${offer.category}`} className="btn-secondary inline-flex min-h-12 items-center justify-center gap-2 px-5 text-sm">
                  <Tag size={15} strokeWidth={1.8} aria-hidden="true" />
                  Voir le rayon
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
    </>
  )
}
