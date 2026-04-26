'use client'

import { motion } from 'framer-motion'
import { ExternalLink, Tag, Trophy } from 'lucide-react'

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
    <motion.a
      href={product.url || '#'}
      target={product.url ? '_blank' : '_self'}
      rel="noopener noreferrer"
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className={`
        group flex flex-col p-4 rounded-2xl border transition-all duration-300
        ${
          isBest
            ? 'border-brand-orange bg-brand-cream ring-2 ring-brand-orange/20 shadow-sm hover:shadow-lg hover:shadow-brand-orange/20'
            : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-md'
        }
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white"
            style={{ backgroundColor: retailer.color }}
          >
            {retailer.logo}
          </span>
          <span className="text-xs font-bold text-slate-600">{retailer.name}</span>
        </div>
        {isBest && (
          <div className="bg-brand-orange text-white p-1 rounded-lg">
            <Trophy size={12} />
          </div>
        )}
        {product.url && (
          <ExternalLink size={12} className="text-slate-300 group-hover:text-brand-orange transition-colors" />
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="relative aspect-square bg-slate-50 rounded-xl overflow-hidden mb-3 flex items-center justify-center">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-contain p-2 group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <span className="text-2xl opacity-30">📦</span>
          )}
        </div>

        <div className="mb-2">
          <h4 className="text-sm font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-brand-orange transition-colors h-10">
            {product.name}
          </h4>
        </div>

        <div className="mt-auto flex flex-col">
          <span className={`text-xl font-black ${isBest ? 'text-brand-orange' : 'text-slate-900'}`}>
            {formatPrice(product.price)}
          </span>

          <div className="flex items-center gap-2 mt-0.5">
            {product.unitPrice && (
              <span className="text-[10px] font-bold text-brand-orange">
                {formatPrice(product.unitPrice)}
                {product.unitPriceLabel}
              </span>
            )}

            {showQuantity && product.quantity && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {product.quantity}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-center gap-1 text-[10px] font-semibold text-slate-400">
        <Tag size={10} />
        <span>Voir l&apos;offre</span>
      </div>
    </motion.a>
  )
}
