'use client'

import { AlertTriangle, Search, Sparkles } from 'lucide-react'

import RetailerFilterPanel from './RetailerFilterPanel'
import type { SupportedCategory } from '@/lib/catalog'
import type { PriceSortOption } from '@/lib/result-filters'
import type { SearchSource } from '@/lib/search-ui'

interface SearchWorkspaceProps {
  search: string
  selectedCategory: SupportedCategory | null
  selectedRetailers: string[]
  minPrice: number | null
  maxPrice: number | null
  sort: PriceSortOption
  source: SearchSource
  error?: string
}

export default function SearchWorkspace({
  search,
  selectedCategory,
  selectedRetailers,
  minPrice,
  maxPrice,
  sort,
  source,
  error,
}: SearchWorkspaceProps) {
  const hasSearchContext = Boolean(
    search || selectedCategory || selectedRetailers.length > 0 || minPrice !== null || maxPrice !== null || sort !== 'default',
  )
  const showNotice = Boolean(error || source === 'demo-fallback')
  const noticeLabel = error ? 'Recherche indisponible' : 'Mode demo local'

  return (
    <section
      className={`border-b border-line/70 bg-paper/95 dark:border-slate-800 dark:bg-slate-950/40 ${
        hasSearchContext ? 'pb-5 pt-20' : 'flex min-h-[calc(100vh-13rem)] items-center'
      }`}
    >
      <div className={`mx-auto w-full px-4 sm:px-6 ${hasSearchContext ? 'max-w-3xl' : 'max-w-2xl'}`}>
        <div className="space-y-4">
          <form action="/" method="get" className="space-y-3">
            {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}
            {selectedRetailers.length > 0 && <input type="hidden" name="retailer" value={selectedRetailers.join(',')} />}
            {minPrice !== null && <input type="hidden" name="minPrice" value={String(minPrice)} />}
            {maxPrice !== null && <input type="hidden" name="maxPrice" value={String(maxPrice)} />}
            {sort !== 'default' && <input type="hidden" name="sort" value={sort} />}

            <div
              className={`flex items-center gap-2 rounded-xl border border-line bg-white px-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 ${
                hasSearchContext ? 'min-h-14' : 'min-h-16 sm:min-h-[4.5rem]'
              }`}
            >
              <Search className="shrink-0 text-muted dark:text-slate-500" size={hasSearchContext ? 19 : 20} />
              <input
                name="query"
                type="text"
                defaultValue={search}
                placeholder="Rechercher un produit"
                aria-label="Rechercher un produit"
                className={`min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-subtle dark:text-slate-100 dark:placeholder:text-slate-500 ${
                  hasSearchContext ? 'py-4 text-base' : 'py-5 text-base sm:text-lg'
                }`}
                autoFocus={!hasSearchContext}
              />
              <button
                type="submit"
                className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-foreground font-semibold text-white dark:bg-white dark:text-slate-950 ${
                  hasSearchContext ? 'h-10 px-4 text-sm' : 'h-11 px-4 text-sm sm:h-12 sm:px-5'
                }`}
              >
                Comparer
              </button>
            </div>

            {showNotice && (
              <div className="flex items-center gap-1.5 px-1 text-xs font-medium text-muted dark:text-slate-400">
                {error ? <AlertTriangle size={14} className="text-danger" /> : <Sparkles size={14} className="text-warning" />}
                <span>{noticeLabel}</span>
              </div>
            )}

            {hasSearchContext && (
              <div className="w-full sm:w-auto">
                <RetailerFilterPanel
                  selectedRetailers={selectedRetailers}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  sort={sort}
                />
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}
