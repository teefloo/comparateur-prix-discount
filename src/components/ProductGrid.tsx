'use client'

import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, SearchX } from 'lucide-react'

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

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0 },
}

const cardGridStyle: CSSProperties = {
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 28rem), 1fr))',
}

export default function ProductGrid({ products, loading, hasSearched, search, sort, error }: ProductGridProps) {
  const highlightTopResult = sort !== 'price-desc'

  if (loading) {
    return (
      <div className="grid gap-3" style={cardGridStyle}>
        {[...Array(6)].map((_, index) => (
          <div key={index} className="flex gap-3 rounded-lg border border-line/70 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
            <div className="h-28 w-28 shrink-0 animate-pulse rounded-md bg-line dark:bg-slate-800 sm:h-32 sm:w-32" />
            <div className="flex flex-1 flex-col justify-between py-1 pr-10">
              <div className="space-y-2.5">
                <div className="h-3 w-24 animate-pulse rounded-full bg-line dark:bg-slate-800" />
                <div className="h-4 w-4/5 animate-pulse rounded-full bg-line dark:bg-slate-800" />
                <div className="h-3 w-1/2 animate-pulse rounded-full bg-line dark:bg-slate-800" />
              </div>
              <div className="h-6 w-24 animate-pulse rounded-full bg-line dark:bg-slate-800" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error && hasSearched && products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto my-8 flex max-w-xl gap-3 rounded-lg border border-danger/20 bg-white px-4 py-5 text-sm text-muted dark:border-danger/30 dark:bg-slate-900 dark:text-slate-300"
      >
        <AlertTriangle size={18} className="mt-0.5 shrink-0 text-danger" />
        <div>
          <h3 className="font-semibold text-foreground dark:text-slate-100">Recherche indisponible</h3>
          <p className="mt-1">{error}</p>
        </div>
      </motion.div>
    )
  }

  if (hasSearched && products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto my-8 flex max-w-xl gap-3 rounded-lg border border-line/70 bg-white px-4 py-5 text-sm text-muted dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
      >
        <SearchX size={18} className="mt-0.5 shrink-0 text-accent" />
        <div>
          <h3 className="font-semibold text-foreground dark:text-slate-100">Aucun résultat</h3>
          <p className="mt-1">{search ? `Rien trouvé pour "${search}".` : 'Aucune offre disponible pour le moment.'}</p>
        </div>
      </motion.div>
    )
  }

  if (!hasSearched && products.length === 0) {
    return null
  }

  return (
    <section className="space-y-3">
      <p className="text-sm font-medium text-muted dark:text-slate-400">
        {products.length} offre{products.length > 1 ? 's' : ''}
        {search ? ` pour "${search}"` : ''}
      </p>

      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-3" style={cardGridStyle}>
        {products.map((product, index) => (
          <motion.div key={product.id} variants={item} className="min-w-0">
            <ProductCard product={product} isBest={index === 0 && highlightTopResult} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
