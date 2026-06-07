'use client'

import type { CSSProperties } from 'react'
import type { Variants } from 'framer-motion'
import { motion } from 'framer-motion'
import { AlertTriangle, SearchX, Sparkles } from 'lucide-react'

import ProductCard from './ProductCard'
import type { PriceSortOption } from '@/lib/result-filters'
import type { RetailerOfferCard } from '@/lib/types'

interface ProductGridProps {
  products: RetailerOfferCard[]
  loading: boolean
  hasSearched: boolean
  search: string
  sort: PriceSortOption
  error?: string
}

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.08,
    },
  },
}

const item: Variants = {
  hidden: { opacity: 0, y: 14, rotate: -1 },
  show: {
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: { duration: 0.4, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] },
  },
}

const cardGridStyle: CSSProperties = {
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 22rem), 1fr))',
}

export default function ProductGrid({ products, loading, hasSearched, search, sort, error }: ProductGridProps) {
  const highlightTopResult = sort !== 'price-desc'

  if (loading) {
    return (
      <div className="grid gap-5" style={cardGridStyle}>
        {[...Array(3)].map((_, index) => (
          <div key={index} className="border-2 border-ink/30 bg-cream p-3 shadow-[4px_4px_0_var(--ink)]">
            <div className="flex gap-3">
              <div className="h-32 w-32 shrink-0 animate-pulse border-2 border-ink/40 bg-paper-2 sm:h-36 sm:w-36" />
              <div className="flex flex-1 flex-col justify-between py-1 pr-9">
                <div className="space-y-2.5">
                  <div className="h-3 w-24 animate-pulse bg-ink/15" />
                  <div className="h-5 w-4/5 animate-pulse bg-ink/15" />
                  <div className="h-3 w-1/2 animate-pulse bg-ink/15" />
                </div>
                <div className="h-8 w-32 animate-pulse bg-navy/30" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error && hasSearched && products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto my-8 flex max-w-xl gap-3 border-2 border-ink bg-cream p-5 text-sm shadow-[5px_5px_0_var(--navy)]"
      >
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-navy" strokeWidth={2.5} />
        <div>
          <h3 className="display-md text-xl text-ink">Recherche indisponible</h3>
          <p className="mt-1.5 text-ink-soft leading-relaxed">{error}</p>
        </div>
      </motion.div>
    )
  }

  if (hasSearched && products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto my-8 flex max-w-xl gap-3 border-2 border-ink bg-cream p-5 text-sm shadow-[5px_5px_0_var(--ink)]"
      >
        <SearchX size={20} className="mt-0.5 shrink-0 text-navy" strokeWidth={2.5} />
        <div>
          <h3 className="display-md text-xl text-ink">Aucun résultat</h3>
          <p className="mt-1.5 text-ink-soft leading-relaxed">
            {search ? `Pas d'offre relevée pour "${search}".` : 'Aucune offre disponible pour le moment.'}
          </p>
        </div>
      </motion.div>
    )
  }

  if (!hasSearched && products.length === 0) {
    return null
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-ink pb-4">
        <div className="flex items-baseline gap-3">
          <span className="display-md text-5xl text-ink tabular-nums">{products.length}</span>
          <div className="leading-tight">
            <p className="eyebrow text-ink-faint">offres</p>
            {search && (
              <p className="editorial text-lg text-ink-soft">
                pour <span className="text-navy italic">«&nbsp;{search}&nbsp;»</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-yellow" strokeWidth={2.5} />
          <span className="eyebrow text-ink-faint">Tri par meilleur prix</span>
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-5" style={cardGridStyle}>
        {products.map((product, index) => (
          <motion.div key={product.id} variants={item} className="min-w-0">
            <ProductCard product={product} isBest={index === 0 && highlightTopResult} index={index} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
