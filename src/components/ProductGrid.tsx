'use client'

import { motion } from 'framer-motion'

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
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
}

export default function ProductGrid({ products, loading, hasSearched, search }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 py-10">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="card p-4 min-h-[280px] animate-pulse">
            <div className="aspect-[4/3] bg-slate-100 rounded-xl mb-4 dark:bg-slate-700" />
            <div className="h-3 bg-slate-100 rounded w-20 mb-2 dark:bg-slate-700" />
            <div className="h-4 bg-slate-100 rounded w-full mb-1 dark:bg-slate-700" />
            <div className="h-4 bg-slate-100 rounded w-3/4 dark:bg-slate-700" />
          </div>
        ))}
      </div>
    )
  }

  if (hasSearched && products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-20 px-6 card max-w-lg mx-auto my-10"
      >
        <div className="w-16 h-16 bg-slate-50 border border-slate-200 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl dark:bg-slate-700 dark:border-slate-600">
          🔍
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2 dark:text-slate-100">Aucun résultat trouvé</h3>
        <p className="text-muted text-sm dark:text-slate-400">
          Nous n&apos;avons pas trouvé de correspondance pour &quot;{search}&quot;. Tentez une recherche plus large comme
          &quot;lessive&quot; ou &quot;chocolat&quot;.
        </p>
      </motion.div>
    )
  }

  if (!hasSearched && products.length === 0) {
    return null
  }

  return (
    <section className="py-10">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-foreground dark:text-slate-100">
          Résultats
          {search && <span className="text-muted font-normal dark:text-slate-400"> pour &quot;{search}&quot;</span>}
        </h3>
        <div className="bg-accent-subtle border border-accent/20 text-accent px-3.5 py-1 rounded-full text-sm font-semibold dark:bg-accent/15">
          {products.length} offre{products.length > 1 ? 's' : ''}
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
        {products.map((product, index) => (
          <motion.div key={product.id} variants={item}>
            <ProductCard product={product} isBest={index === 0} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
