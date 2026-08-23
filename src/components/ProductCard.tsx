import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight, Package } from 'lucide-react'

import { RETAILER_INFO } from '@/lib/catalog'
import type { RetailerOfferCard } from '@/lib/types'

const priceFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function formatPrice(value: number) {
  return priceFormatter.format(value)
}

function getRetailerInfo(retailerId: string) {
  return (
    RETAILER_INFO[retailerId as keyof typeof RETAILER_INFO] || {
      name: retailerId,
      color: '#566375',
      logo: '',
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
  index?: number
}) {
  const retailer = getRetailerInfo(product.retailer)
  const hasDiscount = typeof product.discount === 'number' && product.discount > 0

  return (
    <article
      className={`surface-elevated group flex min-w-0 h-full flex-col p-3.5 transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-navy/50 sm:p-4 ${
        isBest ? 'border-navy/70 shadow-[0_20px_46px_-32px_rgb(var(--accent)/0.75)]' : ''
      }`}
    >
      <div className="flex min-h-8 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border bg-paper-2">
            {retailer.logo ? (
              <Image src={retailer.logo} alt="" width={18} height={18} loading="lazy" className="h-4 w-4 object-contain" />
            ) : (
              <span className="font-mono text-[0.6rem] font-semibold text-ink-faint">{retailer.name.slice(0, 2).toUpperCase()}</span>
            )}
          </span>
          <span className="truncate text-xs font-semibold text-ink-soft">{retailer.name}</span>
        </div>

        {isBest ? (
          <span className="shrink-0 rounded-full border border-navy bg-navy px-2.5 py-1 font-mono text-[0.625rem] font-semibold uppercase tracking-[0.08em] text-white">
            Meilleur prix
          </span>
        ) : hasDiscount ? (
          <span className="shrink-0 rounded-full border border-navy/25 bg-navy/10 px-2.5 py-1 font-mono text-[0.625rem] font-semibold text-navy">
            -{product.discount}%
          </span>
        ) : null}
      </div>

      <Link
        href={`/produit/${product.id}`}
        className="mt-4 flex min-w-0 flex-1 flex-col"
        aria-label={`Voir le détail de ${product.name}`}
      >
        <div className="relative aspect-square overflow-hidden rounded-xl border bg-paper-2">
          {product.image ? (
            // Product images come from retailer sources and may use a new host over time.
            // Keep the existing remote-image behavior without restricting the catalog to a fixed allow-list.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.name}
              loading={isBest ? 'eager' : 'lazy'}
              decoding="async"
              className="h-full w-full object-contain p-5 transition-transform duration-300 group-hover:scale-[1.035] sm:p-6"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-ink-faint">
              <Package size={30} strokeWidth={1.5} aria-hidden="true" />
              <span className="text-xs">Visuel à venir</span>
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-1 flex-col">
          <h3 className="line-clamp-2 text-[1.02rem] font-semibold leading-6 text-ink transition-colors group-hover:text-navy text-pretty">
            {product.name}
          </h3>

          {showQuantity && product.quantity && (
            <p className="mt-2 line-clamp-1 text-xs text-ink-faint">
              {product.quantity}
              {product.unitPrice !== undefined && product.unitPriceLabel && (
                <span className="ml-1.5 font-mono tabular-nums">
                  {formatPrice(product.unitPrice)}{product.unitPriceLabel}
                </span>
              )}
            </p>
          )}

          <div className="mt-auto flex flex-wrap items-baseline gap-x-2.5 gap-y-1 pt-5">
            <span className="font-mono text-[1.7rem] font-semibold tracking-[-0.06em] text-ink tabular-nums">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="font-mono text-xs text-ink-faint line-through tabular-nums">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          {hasDiscount && product.originalPrice && product.originalPrice > product.price && (
            <p className="mt-1 text-xs font-semibold text-navy">Économie de {formatPrice(product.originalPrice - product.price)}</p>
          )}
        </div>
      </Link>

      {product.url && (
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-10 items-center justify-between gap-1.5 border-t pt-3 text-xs font-semibold text-ink-soft transition-colors hover:text-navy"
          aria-label={`Voir ${product.name} sur le site ${retailer.name}`}
        >
          Voir chez {retailer.name}
          <ArrowUpRight size={14} strokeWidth={1.8} aria-hidden="true" />
        </a>
      )}
    </article>
  )
}
