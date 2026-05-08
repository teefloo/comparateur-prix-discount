'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ExternalLink, Package } from 'lucide-react'

import { RETAILER_INFO } from '@/lib/catalog'
import type { RetailerOfferCard } from '@/lib/types'

function getRetailerInfo(retailerId: string) {
  return (
    RETAILER_INFO[retailerId as keyof typeof RETAILER_INFO] || {
      name: retailerId,
      color: '#666',
      logo: '?',
      domains: [],
    }
  )
}

export default function ProductCard({
  product,
  isBest = false,
  showQuantity = true,
}: {
  product: RetailerOfferCard
  isBest?: boolean
  showQuantity?: boolean
}) {
  const formatPrice = (value: number) =>
    new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value)

  const retailer = getRetailerInfo(product.retailer)

  return (
    <article
      className={`group relative min-w-0 rounded-lg border bg-white p-3 transition-colors hover:border-subtle dark:bg-slate-900 ${
        isBest ? 'border-accent/35 dark:border-accent/45' : 'border-line/70 dark:border-slate-800'
      }`}
    >
      <Link href={`/produit/${product.id}`} className="flex min-w-0 gap-3" aria-label={`Voir le détail de ${product.name}`}>
        <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-md bg-slate-50 dark:bg-slate-950 sm:h-32 sm:w-32">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 112px, 128px"
              priority={isBest}
              className="object-contain p-2"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-slate-300 dark:text-slate-700">
              <Package size={32} />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-3 pr-11">
          <div className="min-w-0 space-y-1.5">
            <div className="flex min-w-0 items-center gap-1.5 text-xs font-medium text-muted dark:text-slate-400">
              <Image
                src={retailer.logo}
                alt={retailer.name}
                width={14}
                height={14}
                className="h-3.5 w-3.5 shrink-0 object-contain"
                unoptimized
              />
              <span className="truncate">{retailer.name}</span>
              {isBest && <span className="shrink-0 text-accent">Meilleur prix</span>}
            </div>

            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-accent dark:text-slate-50 sm:text-base">
              {product.name}
            </h3>

            {showQuantity && product.quantity && (
              <p className="line-clamp-1 text-xs text-muted dark:text-slate-400 sm:text-sm">
                {product.quantity}
                {product.unitPrice && (
                  <span className="ml-1 opacity-70">
                    ({formatPrice(product.unitPrice)}
                    {product.unitPriceLabel})
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className={`text-xl font-bold tracking-tight sm:text-2xl ${isBest ? 'text-accent' : 'text-foreground dark:text-slate-50'}`}>
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-xs font-medium text-subtle line-through dark:text-slate-500">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            {typeof product.discount === 'number' && product.discount > 0 && (
              <span className="mt-0.5 block text-xs font-semibold text-danger">-{product.discount}% de réduction</span>
            )}
          </div>
        </div>
      </Link>

      {product.url && (
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-line/70 text-muted transition-colors hover:border-foreground hover:text-foreground dark:border-slate-700 dark:hover:border-slate-400 dark:hover:text-slate-100"
          aria-label={`Voir ${product.name} sur le site ${retailer.name}`}
        >
          <ExternalLink size={15} />
        </a>
      )}
    </article>
  )
}
