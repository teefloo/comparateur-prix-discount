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
      staggerChildren: 0.08,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export default function ProductGrid({ products, loading, hasSearched, search }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 py-12">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="animate-pulse bg-white rounded-3xl p-5 border border-slate-100 min-h-[300px]">
            <div className="aspect-square bg-slate-100 rounded-2xl mb-6 shadow-inner" />
            <div className="h-4 bg-slate-100 rounded-full w-24 mb-4" />
            <div className="h-6 bg-slate-100 rounded-full w-full" />
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
        className="text-center py-20 px-6 glass rounded-3xl my-12"
      >
        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
          🔍
        </div>
        <h3 className="text-2xl font-heading font-bold text-slate-900 mb-2">Aucun résultat trouvé</h3>
        <p className="text-slate-500 max-w-sm mx-auto">
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
    <section className="py-12">
      <div className="flex items-center justify-between mb-10">
        <h3 className="text-2xl font-heading font-bold text-slate-900">
          Résultats
          {search && <span className="text-slate-400 font-normal"> pour &quot;{search}&quot;</span>}
        </h3>
        <div className="bg-brand-cream text-brand-orange px-4 py-1.5 rounded-full text-sm font-bold border border-brand-orange/20 italic">
          {products.length} offre{products.length > 1 ? 's' : ''}
        </div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <motion.div key={product.id} variants={item}>
            <ProductCard product={product} isBest={index === 0} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}
