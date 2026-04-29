'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ExternalLink, Tag, ArrowDown } from 'lucide-react'

import { RETAILER_INFO } from '@/lib/catalog'
import type { RetailerOfferCard } from '@/lib/types'

function getRetailerInfo(retailerId: string) {
  return RETAILER_INFO[retailerId as keyof typeof RETAILER_INFO] || {
    name: retailerId,
    color: '#666',
    logo: '?',
    domains: [],
  }
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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className={`group flex flex-col p-3 rounded-2xl transition-all duration-300 ${
        isBest ? 'card ring-2 ring-secondary/20' : 'card hover:shadow-card-hover'
      }`}
    >
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <span
            className="w-6 h-6 rounded-lg flex items-center justify-center overflow-hidden shadow-sm"
            style={{ backgroundColor: retailer.color }}
          >
            <Image
              src={retailer.logo}
              alt={retailer.name}
              width={24}
              height={24}
              className="object-contain"
              unoptimized
            />
          </span>
          <span className="text-[11px] font-semibold text-muted dark:text-slate-300">{retailer.name}</span>
        </div>
        {isBest && (
          <div className="bg-secondary text-white px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 text-[10px] font-bold">
            <ArrowDown size={10} />
            Meilleur prix
          </div>
        )}
      </div>

      <Link href={`/produit/${product.id}`} className="flex-1 flex flex-col">
        <div className="relative aspect-[4/3] bg-slate-50 rounded-xl overflow-hidden mb-3 flex items-center justify-center dark:bg-slate-700/50">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <span className="text-3xl opacity-20">📦</span>
          )}
        </div>

        <div className="mb-2">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-accent transition-colors min-h-[2.5rem] dark:text-slate-100 dark:group-hover:text-accent">
            {product.name}
          </h3>
        </div>

        <div className="mt-auto flex flex-col">
          <span className={`text-lg font-bold ${isBest ? 'text-secondary' : 'text-foreground dark:text-slate-100'}`}>
            {formatPrice(product.price)}
          </span>

          <div className="flex items-center gap-2 mt-0.5">
            {product.unitPrice && (
              <span className="text-[10px] font-semibold text-accent">
                {formatPrice(product.unitPrice)}
                {product.unitPriceLabel}
              </span>
            )}

            {showQuantity && product.quantity && (
              <span className="text-[10px] font-semibold text-subtle uppercase tracking-wider dark:text-slate-500">
                {product.quantity}
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-3 dark:border-slate-700">
        <Link
          href={`/produit/${product.id}`}
          className="flex items-center gap-1 text-[10px] font-semibold text-muted group-hover:text-accent transition-colors dark:text-slate-300 dark:group-hover:text-accent"
        >
          <Tag size={10} />
          <span>Voir la fiche</span>
        </Link>
        {product.url && (
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted hover:text-accent transition-colors dark:text-slate-300 dark:hover:text-accent"
          >
            <ExternalLink size={10} />
            <span>Site enseigne</span>
          </a>
        )}
      </div>
    </motion.article>
  )
}
