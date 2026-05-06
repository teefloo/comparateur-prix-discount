'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowDown, Package, ExternalLink } from 'lucide-react'

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
      className={`group relative flex flex-col sm:flex-row gap-4 sm:gap-6 rounded-[24px] bg-white p-4 transition-all hover:shadow-lg dark:bg-slate-900 ${isBest ? 'ring-2 ring-accent/50 shadow-accent-sm' : 'border border-line/40 dark:border-slate-800'}`}
    >
      <div className="relative h-48 w-full shrink-0 overflow-hidden rounded-[16px] bg-slate-50 dark:bg-slate-950 sm:h-auto sm:w-48">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 100vw, 192px"
            priority={isBest}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300 dark:text-slate-700">
            <Package size={32} />
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-col gap-1.5">
          <span className="flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur-md dark:bg-slate-950/90 dark:text-slate-100">
            <Image src={retailer.logo} alt={retailer.name} width={14} height={14} className="h-3.5 w-3.5 object-contain" unoptimized />
            {retailer.name}
          </span>
          {isBest && (
            <span className="flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
              <ArrowDown size={12} />
              Moins cher
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div className="space-y-1">
          <div className="flex flex-wrap gap-2 text-[11px] font-medium text-subtle dark:text-slate-500">
            {product.category && <span>{product.category}</span>}
            {product.category && product.brand && <span>·</span>}
            {product.brand && <span>{product.brand}</span>}
          </div>
          
          <Link href={`/produit/${product.id}`} className="block">
            <h3 className="text-lg font-semibold leading-tight text-foreground line-clamp-2 dark:text-slate-50 group-hover:text-accent transition-colors">
              {product.name}
            </h3>
          </Link>
          
          {showQuantity && product.quantity && (
            <p className="text-sm text-muted dark:text-slate-400 mt-1">
              {product.quantity}
              {product.unitPrice && <span className="opacity-70 ml-1">({formatPrice(product.unitPrice)}{product.unitPriceLabel})</span>}
            </p>
          )}
        </div>

        <div className="mt-4 flex items-end justify-between border-t border-line/40 dark:border-slate-800 pt-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl font-bold tracking-tight ${isBest ? 'text-accent' : 'text-foreground dark:text-slate-50'}`}>
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span className="text-sm font-medium text-subtle line-through dark:text-slate-500">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            {typeof product.discount === 'number' && product.discount > 0 && (
              <span className="inline-block mt-0.5 rounded text-[10px] font-bold text-danger">
                -{product.discount}% de réduction
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <Link
              href={`/produit/${product.id}`}
              className="flex h-10 items-center justify-center rounded-xl bg-foreground/5 px-4 text-sm font-semibold text-foreground transition-colors hover:bg-foreground/10 dark:bg-white/10 dark:text-slate-100 dark:hover:bg-white/20"
            >
              Détails
            </Link>
            {product.url && (
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-line/50 text-muted transition-colors hover:border-foreground hover:text-foreground dark:border-slate-700 dark:hover:border-slate-400 dark:hover:text-slate-100"
                aria-label="Voir sur le site marchand"
              >
                <ExternalLink size={16} />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  )
}

