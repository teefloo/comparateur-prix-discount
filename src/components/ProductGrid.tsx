'use client'

import type { CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { SearchX, Sparkles } from 'lucide-react'

import ProductCard from './ProductCard'
import type { RetailerOfferCard } from '@/lib/types'

interface ProductGridProps {
  products: RetailerOfferCard[]
  loading: boolean
  hasSearched: boolean
  search: string
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

const cardGridStyle: CSSProperties = {
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 38rem), 1fr))',
}

export default function ProductGrid({ products, loading, hasSearched, search }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid gap-4" style={cardGridStyle}>
        {[...Array(6)].map((_, index) => (
          <div key={index} className="surface overflow-hidden">
            <div className="grid gap-0 lg:grid-cols-[160px_minmax(0,1fr)_168px]">
              <div className="min-h-[170px] border-b border-line bg-surfaceSoft animate-pulse dark:border-slate-800 dark:bg-slate-800/70 lg:border-b-0 lg:border-r" />
              <div className="p-5">
                <div className="h-4 w-24 rounded-full bg-line animate-pulse dark:bg-slate-700" />
                <div className="mt-5 h-6 w-4/5 rounded-full bg-line animate-pulse dark:bg-slate-700" />
                <div className="mt-3 h-4 w-full rounded-full bg-line animate-pulse dark:bg-slate-700" />
                <div className="mt-2 h-4 w-2/3 rounded-full bg-line animate-pulse dark:bg-slate-700" />
              </div>
              <div className="border-t border-line bg-paper/40 p-4 dark:border-slate-800 dark:bg-slate-950/40 lg:border-t-0 lg:border-l">
                <div className="h-3 w-12 rounded-full bg-line animate-pulse dark:bg-slate-700" />
                <div className="mt-3 h-9 w-24 rounded-[12px] bg-line animate-pulse dark:bg-slate-700" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (hasSearched && products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="surface mx-auto my-8 max-w-2xl px-6 py-10 text-center"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-line bg-accent-subtle text-accent dark:border-slate-700 dark:bg-accent/15">
          <SearchX size={24} />
        </div>
        <h3 className="font-display mt-5 text-2xl font-semibold tracking-tight text-foreground dark:text-slate-100">
          Aucun résultat trouvé
        </h3>
        <p className="support-copy mx-auto mt-3 max-w-lg">
          Nous n&apos;avons rien trouvé pour &quot;{search}&quot;. Essayez un terme plus large ou passez par une catégorie pour relancer l&apos;exploration.
        </p>
      </motion.div>
    )
  }

  if (!hasSearched && products.length === 0) {
    return null
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label">Résultats</p>
          <h2 className="font-display mt-1 text-2xl font-semibold tracking-tight text-foreground dark:text-slate-100">
            {search ? `Offres pour "${search}"` : 'Offres disponibles'}
          </h2>
        </div>
        <div className="result-badge result-badge-accent">
          <Sparkles size={12} />
          {products.length} offre{products.length > 1 ? 's' : ''}
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid gap-4" style={cardGridStyle}>
        {products.map((product, index) => (
          <motion.div key={product.id} variants={item} className="min-w-0">
            <ProductCard product={product} isBest={index === 0} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
