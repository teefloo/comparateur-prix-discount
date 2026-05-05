'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowDown, ExternalLink, Package, Sparkles, Tag } from 'lucide-react'

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
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className={`surface min-w-0 overflow-hidden transition-shadow duration-300 ${isBest ? 'ring-1 ring-accent/30 shadow-accent-sm' : ''}`}
    >
      <div className="grid gap-0 lg:grid-cols-[160px_minmax(0,1fr)_168px]">
        <div className="relative min-h-[170px] border-b border-line bg-surfaceSoft dark:border-slate-800 dark:bg-slate-950 lg:border-b-0 lg:border-r">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 1024px) 100vw, 160px"
              priority={isBest}
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl text-subtle dark:text-slate-600">
              <Package size={40} />
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-2">
            <span className="result-badge inline-flex items-center gap-1.5 bg-white/95 text-foreground shadow-card backdrop-blur dark:bg-slate-950/85 dark:text-slate-100">
              <Image src={retailer.logo} alt={retailer.name} width={16} height={16} className="h-4 w-4 object-contain" unoptimized />
              {retailer.name}
            </span>
            {isBest && (
              <span className="result-badge result-badge-accent shadow-card">
                <ArrowDown size={12} />
                Meilleur prix
              </span>
            )}
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            {product.category && <span className="result-badge">{product.category}</span>}
            {product.brand && <span className="result-badge">{product.brand}</span>}
            {product.isOnPromotion && (
              <span className="result-badge result-badge-accent">
                <Sparkles size={12} />
                Promotion
              </span>
            )}
            {typeof product.discount === 'number' && product.discount > 0 && (
              <span className="result-badge border-danger/20 bg-danger/10 text-danger dark:border-danger/30 dark:bg-danger/15">
                -{product.discount}%
              </span>
            )}
          </div>

          <div>
            <Link href={`/produit/${product.id}`} className="group block">
              <h3 className="font-display text-lg font-semibold tracking-tight text-foreground transition-colors group-hover:text-accent dark:text-slate-100">
                {product.name}
              </h3>
            </Link>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted dark:text-slate-400">
              {product.description || 'Fiche produit complète avec le prix, la quantité et le lien enseigne.'}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {product.quantity && showQuantity && (
              <div className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-muted dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                <span className="section-label block mb-1">Conditionnement</span>
                {product.quantity}
              </div>
            )}
            {product.unitPrice && (
              <div className="rounded-xl border border-line bg-white px-3 py-2 text-sm text-muted dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
                <span className="section-label block mb-1">Prix unitaire</span>
                <span className="font-semibold text-foreground dark:text-slate-100">
                  {formatPrice(product.unitPrice)}
                  {product.unitPriceLabel}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-row items-center justify-between gap-4 border-t border-line bg-paper/40 p-4 dark:border-slate-800 dark:bg-slate-950/40 lg:flex-col lg:justify-center lg:border-t-0 lg:border-l">
          <div className="lg:text-right">
            <p className="section-label">Prix</p>
            {product.originalPrice && product.originalPrice > product.price && (
              <p className="mt-1 text-sm text-muted line-through decoration-danger/70 decoration-2 dark:text-slate-400">
                {formatPrice(product.originalPrice)}
              </p>
            )}
            <p className={`price-figure mt-1 ${isBest ? 'text-accent' : ''}`}>{formatPrice(product.price)}</p>
            {product.lastUpdated && (
              <p className="mt-1 text-[11px] text-subtle dark:text-slate-500">
                Mis à jour le {new Date(product.lastUpdated).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>

          <div className="flex w-full flex-col gap-2 lg:items-stretch">
            <Link
              href={`/produit/${product.id}`}
              className="inline-flex items-center justify-center gap-2 rounded-[12px] bg-foreground px-4 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 dark:bg-white dark:text-slate-950"
            >
              Voir la fiche
              <Tag size={14} />
            </Link>
            {product.url && (
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-[12px] border border-line bg-white px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-accent/30 hover:text-accent dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:text-accent"
              >
                Site enseigne
                <ExternalLink size={14} />
              </a>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  )
}
