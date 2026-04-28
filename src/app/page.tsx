'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import CategoryBar from '@/components/CategoryBar'
import Hero from '@/components/Hero'
import Navbar from '@/components/Navbar'
import ProductGrid from '@/components/ProductGrid'
import RetailerFilter from '@/components/RetailerFilter'
import type { RetailerOfferCard, SupportedCategory } from '@/lib/types'

type SearchSource = 'database' | 'real-time' | 'demo-fallback' | null

export default function Home() {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<SupportedCategory | null>(null)
  const [selectedRetailers, setSelectedRetailers] = useState<string[]>([])
  const [products, setProducts] = useState<RetailerOfferCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const [source, setSource] = useState<SearchSource>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const latestSearchRef = useRef(search)

  const sourceLabel: Record<Exclude<SearchSource, null>, string> = {
    database: 'Base de données officielle',
    'real-time': 'Direct live scraping',
    'demo-fallback': 'Mode dégradé (Demo)',
  }

  useEffect(() => {
    latestSearchRef.current = search
  }, [search])

  const searchProducts = useCallback(async (queryValue: string, categoryValue: SupportedCategory | null) => {
    if (!queryValue.trim() && !categoryValue) return

    setLoading(true)
    setError(null)
    setProducts([])
    setHasSearched(true)

    try {
      const params = new URLSearchParams({
        ...(queryValue.trim() && { query: queryValue }),
        ...(categoryValue && { category: categoryValue }),
      })

      const response = await fetch(`/api/search?${params}`)
      const data = await response.json()
      setLastUpdate(data?.lastUpdate ?? null)

      if (data.error) {
        setError(data.error)
      } else {
        setProducts((data.products || []) as RetailerOfferCard[])
        setSource((data.source || null) as SearchSource)
      }
    } catch {
      setLastUpdate(null)
      setError('Impossible de se connecter au serveur. Veuillez vérifier votre connexion.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      void searchProducts(latestSearchRef.current, selectedCategory)
    }
  }, [selectedCategory, searchProducts])

  const filterProducts = useCallback(
    (value: RetailerOfferCard[]) => {
      if (selectedRetailers.length === 0) return value
      return value.filter((product) => selectedRetailers.includes(product.retailer))
    },
    [selectedRetailers],
  )

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    void searchProducts(search, selectedCategory)
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 pb-20 md:pb-0">
      <Navbar />

      <Hero search={search} setSearch={setSearch} onSubmit={handleSubmit} loading={loading} />

      <main className="max-w-7xl mx-auto px-6 pb-16">
        <CategoryBar selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />

        {hasSearched && !loading && (
          <div className="mb-6 card p-4">
            <RetailerFilter selectedRetailers={selectedRetailers} onChange={setSelectedRetailers} />
          </div>
        )}

        {error && (
          <div className="max-w-3xl mx-auto mb-10 card p-5 flex items-center gap-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <div className="w-10 h-10 bg-red-100 border border-red-200 rounded-xl flex items-center justify-center flex-shrink-0 text-xl dark:bg-red-900/30 dark:border-red-800">
              ⚠️
            </div>
            <p className="font-semibold text-red-600 text-sm dark:text-red-400">{error}</p>
          </div>
        )}

        {hasSearched && source && (
          <div className="mb-6 text-center">
            <span className="source-badge">
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
              Source: {sourceLabel[source]}
            </span>
          </div>
        )}

        <ProductGrid products={filterProducts(products)} loading={loading} hasSearched={hasSearched} search={search} />

        {lastUpdate && !loading && (
          <div className="mt-16 text-center card p-8 max-w-lg mx-auto">
            <p className="text-muted text-sm font-medium flex items-center justify-center gap-2 dark:text-slate-400">
              <span className="w-2 h-2 bg-accent rounded-full" />
              Dernier relevé des prix :{' '}
              {new Date(lastUpdate).toLocaleString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p className="text-subtle text-[10px] mt-2 italic dark:text-slate-500">
              Les prix sont relevés directement sur les plateformes digitales de chaque enseigne. Vérifiez la disponibilité en magasin.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
