'use client'

import { AlertTriangle, Search, Sparkles } from 'lucide-react'

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

export default function SearchWorkspace({ search, selectedCategory, source, error }: SearchWorkspaceProps) {
  const hasSearchContext = Boolean(search || selectedCategory)
  const showNotice = Boolean(error || source === 'demo-fallback')

  return (
    <section
      className={`border-b border-line/70 bg-paper/95 dark:border-slate-800 dark:bg-slate-950/40 ${
        hasSearchContext ? 'pb-5 pt-20' : 'pb-8 pt-24 sm:pb-10 sm:pt-32'
      }`}
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="space-y-4">
          {!hasSearchContext && (
            <h1 className="text-center font-display text-4xl font-semibold tracking-tight text-foreground dark:text-slate-50 sm:text-5xl">
              ComparPrix
            </h1>
          )}

          <form action="/" method="get" className="space-y-3">
            {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}

            <div className="flex min-h-14 items-center gap-2 rounded-xl border border-line bg-white px-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <Search className="shrink-0 text-muted dark:text-slate-500" size={19} />
              <input
                name="query"
                type="text"
                defaultValue={search}
                placeholder="Rechercher un produit"
                aria-label="Rechercher un produit"
                className="min-w-0 flex-1 bg-transparent py-4 text-base text-foreground outline-none placeholder:text-subtle dark:text-slate-100 dark:placeholder:text-slate-500"
                autoFocus={!hasSearchContext}
              />
              <button
                type="submit"
                className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-foreground px-4 text-sm font-semibold text-white dark:bg-white dark:text-slate-950"
              >
                Comparer
              </button>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              {showNotice ? (
                <div className="flex items-center gap-1.5 px-1 text-xs font-medium text-muted dark:text-slate-400">
                  {error ? <AlertTriangle size={14} className="text-danger" /> : <Sparkles size={14} className="text-warning" />}
                  <span>{error ? 'Recherche indisponible' : 'Mode démo'}</span>
                </div>
              ) : (
                <div className="hidden sm:block" />
              )}
              <RetailerFilterPanel />
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
