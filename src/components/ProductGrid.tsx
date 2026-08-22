'use client'

import type { Variants } from 'framer-motion'
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

const container: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.04,
    },
  },
}

const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] },
  },
}

export default function ProductGrid({ products, loading, hasSearched, search, sort, error }: ProductGridProps) {
  const highlightTopResult = sort !== 'price-desc'

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[...Array(3)].map((_, index) => (
          <div key={index} className="surface-elevated p-4">
            <div className="h-7 w-28 rounded-md bg-paper-2" />
            <div className="mt-4 aspect-square rounded-lg bg-paper-2" />
            <div className="mt-4 h-5 w-4/5 rounded bg-paper-2" />
            <div className="mt-3 h-4 w-2/5 rounded bg-paper-2" />
            <div className="mt-6 h-7 w-28 rounded bg-paper-2" />
          </div>
        ))}
      </div>
    )
  }

  if (error && hasSearched && products.length === 0) {
    return (
      <StateMessage
        icon={<AlertTriangle size={20} strokeWidth={1.8} aria-hidden="true" />}
        title="Recherche indisponible"
        description={error}
      />
    )
  }

  if (hasSearched && products.length === 0) {
    return (
      <StateMessage
        icon={<SearchX size={20} strokeWidth={1.8} aria-hidden="true" />}
        title="Aucun résultat"
        description={search ? `Pas d'offre relevée pour « ${search} ».` : 'Aucune offre disponible pour le moment.'}
      />
    )
  }

  if (!hasSearched && products.length === 0) {
    return null
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b pb-5">
        <div>
          <p className="font-mono text-4xl font-semibold tracking-tight text-ink tabular-nums sm:text-5xl">{products.length}</p>
          <p className="mt-1 text-sm text-ink-soft">
            offre{products.length > 1 ? 's' : ''}
            {search ? <> pour <span className="font-semibold text-navy">« {search} »</span></> : null}
          </p>
        </div>
        <p className="text-xs font-medium text-ink-faint">Triées par prix croissant</p>
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
      >
        {products.map((product, index) => (
          <motion.div key={product.id} variants={item} className="min-w-0">
            <ProductCard product={product} isBest={index === 0 && highlightTopResult} index={index} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

function StateMessage({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="surface-elevated mx-auto my-8 flex max-w-xl items-start gap-3 p-6">
      <span className="mt-0.5 shrink-0 text-navy">{icon}</span>
      <div>
        <h3 className="text-lg font-semibold text-ink">{title}</h3>
        <p className="mt-1.5 text-sm leading-6 text-ink-soft">{description}</p>
      </div>
    </div>
  )
}
