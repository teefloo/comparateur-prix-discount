'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowRight, BadgeCheck, Search, Sparkles } from 'lucide-react'

import RetailerFilterPanel from './RetailerFilterPanel'
import type { SupportedCategory } from '@/lib/catalog'
import type { SearchSource } from '@/lib/search-ui'

interface SearchWorkspaceProps {
  search: string
  selectedCategory: SupportedCategory | null
  source: SearchSource
  lastUpdate: string | null
  error?: string
}

export default function SearchWorkspace({ search, selectedCategory, source, lastUpdate, error }: SearchWorkspaceProps) {
  const hasSearchContext = Boolean(search || selectedCategory)

  const statusMessage = (() => {
    if (error) {
      return 'Erreur de chargement. Réessayez.'
    }

    if (source === 'demo-fallback') {
      return 'Mode démo activé.'
    }

    if (lastUpdate) {
      return `À jour (${new Date(lastUpdate).toLocaleString('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })})`
    }

    return 'Prêt'
  })()

  return (
    <section className={`border-b border-line/70 bg-paper/90 dark:border-slate-800 dark:bg-slate-950/30 transition-all duration-500 ease-in-out ${hasSearchContext ? 'pt-20 pb-8' : 'pt-32 pb-24 sm:pt-48 sm:pb-36'}`}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="space-y-6">
          {!hasSearchContext && (
            <div className="text-center space-y-3 mb-8">
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground dark:text-slate-50">
                ComparPrix
              </h1>
              <p className="text-muted text-lg">
                La recherche ultra-rapide
              </p>
            </div>
          )}

          <div className={`transition-all duration-300 ${!hasSearchContext ? 'scale-100 opacity-100' : 'scale-100'}`}>
            <form action="/" method="get" className="space-y-4">
              {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}

              <div className="relative group shadow-sm hover:shadow-md transition-shadow rounded-2xl bg-white dark:bg-slate-900 border border-line dark:border-slate-800">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-muted dark:text-slate-500 group-focus-within:text-accent transition-colors" size={20} />
                <input
                  name="query"
                  type="text"
                  defaultValue={search}
                  placeholder="Rechercher un produit..."
                  aria-label="Rechercher un produit"
                  className="w-full rounded-2xl bg-transparent py-5 pl-14 pr-[120px] text-lg text-foreground outline-none placeholder:text-subtle dark:text-slate-100 dark:placeholder:text-slate-500"
                  autoFocus={!hasSearchContext}
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <button
                    type="submit"
                    className="inline-flex h-11 items-center justify-center rounded-xl bg-foreground px-5 text-sm font-semibold text-white transition-transform hover:scale-105 active:scale-95 dark:bg-white dark:text-slate-950"
                  >
                    Comparer
                  </button>
                </div>
              </div>

              {hasSearchContext && (
                <div className="flex items-center justify-between text-xs text-muted dark:text-slate-400 px-2">
                  <div className="flex items-center gap-1.5">
                    {error ? <AlertTriangle size={14} className="text-danger" /> : source === 'demo-fallback' ? <Sparkles size={14} className="text-warning" /> : <BadgeCheck size={14} className="text-accent" />}
                    <span>{statusMessage}</span>
                  </div>
                  <RetailerFilterPanel />
                </div>
              )}
            </form>
          </div>

          {!hasSearchContext && (
            <div className="flex justify-center mt-6">
               <RetailerFilterPanel />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
