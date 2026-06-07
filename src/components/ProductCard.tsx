import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight, Package, Sparkles } from 'lucide-react'

import { RETAILER_INFO } from '@/lib/catalog'
import BLUR_DATA_URL from '@/lib/blur-placeholder'
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
  index = 0,
}: {
  product: RetailerOfferCard
  isBest?: boolean
  showQuantity?: boolean
  index?: number
}) {
  const retailer = getRetailerInfo(product.retailer)
  const number = String((index % 99) + 1).padStart(2, '0')
  const hasDiscount = typeof product.discount === 'number' && product.discount > 0
  const rotationClass = index % 3 === 0 ? 'stamp-rotate-1' : index % 3 === 1 ? 'stamp-rotate-2' : 'stamp-rotate-3'

  return (
    <article
      className={`group relative min-w-0 border-2 border-ink bg-cream p-3 transition-all duration-200 hover:-translate-x-[3px] hover:-translate-y-[3px] hover:shadow-[6px_6px_0_var(--ink)] ${
        isBest ? 'shadow-[5px_5px_0_var(--navy)]' : 'shadow-[4px_4px_0_var(--ink)]'
      }`}
    >
      <div className="absolute -top-3 -left-2 mono text-[10px] font-bold text-ink-faint">№ {number}</div>

      {isBest && (
        <div className="absolute -top-3 -right-2 z-10">
          <div className="yellow-stamp mono text-[10px] uppercase">
            <Sparkles size={10} strokeWidth={2.5} />
            Meilleur prix
          </div>
        </div>
      )}

      {hasDiscount && !isBest && (
        <div className="absolute -top-2.5 -right-2 z-10 price-stamp mono text-[11px]">
          -{product.discount}%
        </div>
      )}

      <Link
        href={`/produit/${product.id}`}
        className="flex min-w-0 gap-3"
        aria-label={`Voir le détail de ${product.name}`}
      >
        <div className="relative h-32 w-32 shrink-0 overflow-hidden border-2 border-ink bg-paper-2 sm:h-36 sm:w-36">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              width={144}
              height={144}
              sizes="(max-width:640px) 128px, 144px"
              priority={isBest}
              loading={!isBest ? 'lazy' : undefined}
              fetchPriority={isBest ? 'high' : 'low'}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5">
              <Package size={28} className="text-ink-faint" strokeWidth={1.5} />
              <span className="mono text-[9px] uppercase tracking-wider text-ink-faint">Visuel</span>
              <span className="mono text-[9px] uppercase tracking-wider text-ink-faint">à venir</span>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between gap-2 pr-9">
          <div className="min-w-0 space-y-1.5">
            <div className="flex min-w-0 items-center gap-1.5">
              <span
                className="inline-flex h-5 w-5 shrink-0 items-center justify-center border border-ink/70 bg-cream"
                style={{ backgroundColor: retailer.color + '22' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={retailer.logo}
                  alt={retailer.name}
                  width={12}
                  height={12}
                  loading="lazy"
                  decoding="async"
                  className="h-3 w-3 object-contain"
                />
              </span>
              <span className="eyebrow text-ink-faint truncate">{retailer.name}</span>
            </div>

            <h3 className="editorial line-clamp-2 text-lg font-medium leading-tight text-ink transition-colors group-hover:text-navy text-pretty">
              {product.name}
            </h3>

            {showQuantity && product.quantity && (
              <p className="mono text-xs text-ink-faint line-clamp-1">
                {product.quantity}
                {product.unitPrice !== undefined && product.unitPriceLabel && (
                  <span className="ml-1.5 opacity-80">
                    · {formatPrice(product.unitPrice)}
                    {product.unitPriceLabel}
                  </span>
                )}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 pt-1">
            <span className={`price-stamp mono text-2xl ${rotationClass}`}>
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="mono text-xs font-medium text-ink-faint line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {product.url && (
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-3 grid h-9 w-9 shrink-0 place-items-center border-2 border-ink bg-cream text-ink shadow-[2px_2px_0_var(--ink)] transition-all hover:-translate-x-[1px] hover:-translate-y-[1px] hover:bg-ink hover:text-cream hover:shadow-[3px_3px_0_var(--ink)]"
          aria-label={`Voir ${product.name} sur le site ${retailer.name}`}
        >
          <ArrowUpRight size={14} strokeWidth={2.5} />
        </a>
      )}
    </article>
  )
}
