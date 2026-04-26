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
    } catch (_error) {
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
    <div className="grain min-h-screen">
      <Navbar />

      <Hero search={search} setSearch={setSearch} onSubmit={handleSubmit} loading={loading} />

      <main className="max-w-7xl mx-auto px-6 pb-20">
        <CategoryBar selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />

        {hasSearched && !loading && (
          <div className="mb-6">
            <RetailerFilter selectedRetailers={selectedRetailers} onChange={setSelectedRetailers} />
          </div>
        )}

        {error && (
          <div className="max-w-3xl mx-auto mb-12 bg-red-50 border border-red-100 text-red-600 px-8 py-6 rounded-3xl flex items-center gap-4 shadow-sm animate-fade-in">
            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
              ⚠️
            </div>
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {hasSearched && source && (
          <div className="mb-8 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest border border-slate-200">
              <span className="w-1.5 h-1.5 bg-brand-orange rounded-full animate-pulse" />
              Source: {sourceLabel[source]}
            </span>
          </div>
        )}

        <ProductGrid products={filterProducts(products)} loading={loading} hasSearched={hasSearched} search={search} />

        {lastUpdate && !loading && (
          <div className="mt-20 text-center glass p-8 rounded-3xl max-w-2xl mx-auto">
            <p className="text-slate-400 text-sm font-medium flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-brand-orange rounded-full" />
              Dernier relevé des prix :{' '}
              {new Date(lastUpdate).toLocaleString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p className="text-slate-400 text-[10px] mt-2 italic px-12">
              Les prix sont relevés directement sur les plateformes digitales de chaque enseigne. Vérifiez la
              disponibilité en magasin.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
