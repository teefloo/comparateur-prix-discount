'use client'

import { AlertTriangle, ArrowDown, Search, Sparkles } from 'lucide-react'

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

const STAMP_WORDS = ['moins cher', 'plus malin', 'mieux placé']

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
  const noticeLabel = error ? 'Recherche indisponible' : 'Mode démo local'

  return (
    <section
      className={`relative border-b-2 border-ink ${
        hasSearchContext ? 'pt-32 pb-8' : 'pt-32 pb-20 md:pt-40 md:pb-32'
      }`}
    >
      <div className="absolute inset-0 -z-10 paper-fold grain" aria-hidden />

      {!hasSearchContext ? (
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-end gap-8 md:grid-cols-[1fr_auto]">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="eyebrow text-ink-faint">№ 01 — Bulletin des prix discount</span>
                <span className="dotline h-px w-12 bg-ink/40" />
                <span className="eyebrow text-navy">10 enseignes</span>
              </div>

              <h1 className="display-huge text-fluid-hero text-ink">
                Trouvez
                <span className="block text-navy stamp-rotate-1">le bon prix.</span>
              </h1>

              <p className="editorial text-2xl leading-snug text-ink-soft max-w-2xl text-pretty sm:text-3xl">
                Dix enseignes discount lues en parallèle,{' '}
                <span className="editorial-italic text-navy">une seule réponse claire</span> : le juste prix,
                là où il se trouve, cette semaine.
              </p>
            </div>

            <div className="hidden md:flex flex-col items-end gap-2">
              <span className="yellow-stamp mono uppercase tracking-widest text-xs">10 enseignes</span>
              <span className="price-stamp-lg mono text-4xl">-78%</span>
              <span className="eyebrow text-ink-faint mt-1">réduction max relevée</span>
            </div>
          </div>

          <div className="mt-10 max-w-4xl">
            <SearchForm
              hasSearchContext={hasSearchContext}
              search={search}
              selectedCategory={selectedCategory}
              selectedRetailers={selectedRetailers}
              minPrice={minPrice}
              maxPrice={maxPrice}
              sort={sort}
              showNotice={showNotice}
              noticeLabel={noticeLabel}
              error={error}
            />
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <span className="eyebrow text-ink-faint">Essayez</span>
            {['Lessive', 'Brosse à dents', 'Café moulu', 'Puzzle'].map((example) => (
              <a
                key={example}
                href={`/?query=${encodeURIComponent(example)}`}
                className="editorial text-lg text-ink underline decoration-ink/30 decoration-1 underline-offset-4 transition-colors hover:decoration-navy hover:text-navy"
              >
                {example}
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="mb-4 flex items-center gap-3">
            <span className="eyebrow text-ink-faint">Recherche en cours</span>
            <span className="dotline h-px flex-1 bg-ink/30" />
          </div>
          <SearchForm
            hasSearchContext={hasSearchContext}
            search={search}
            selectedCategory={selectedCategory}
            selectedRetailers={selectedRetailers}
            minPrice={minPrice}
            maxPrice={maxPrice}
            sort={sort}
            showNotice={showNotice}
            noticeLabel={noticeLabel}
            error={error}
          />
        </div>
      )}
    </section>
  )
}

function SearchForm({
  hasSearchContext,
  search,
  selectedCategory,
  selectedRetailers,
  minPrice,
  maxPrice,
  sort,
  showNotice,
  noticeLabel,
  error,
}: {
  hasSearchContext: boolean
  search: string
  selectedCategory: SupportedCategory | null
  selectedRetailers: string[]
  minPrice: number | null
  maxPrice: number | null
  sort: PriceSortOption
  showNotice: boolean
  noticeLabel: string
  error?: string
}) {
  return (
    <form action="/" method="get" className="space-y-3">
      {selectedCategory && <input type="hidden" name="category" value={selectedCategory} />}
      {selectedRetailers.length > 0 && <input type="hidden" name="retailer" value={selectedRetailers.join(',')} />}
      {minPrice !== null && <input type="hidden" name="minPrice" value={String(minPrice)} />}
      {maxPrice !== null && <input type="hidden" name="maxPrice" value={String(maxPrice)} />}
      {sort !== 'default' && <input type="hidden" name="sort" value={sort} />}

      <div className="field-shell flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-4">
        <Search className="shrink-0 text-ink" size={hasSearchContext ? 20 : 24} strokeWidth={2.5} />
        <input
          name="query"
          type="text"
          defaultValue={search}
          placeholder="Recherchez…"
          aria-label="Rechercher un produit"
          className={`min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-ink-mute body-sans ${
            hasSearchContext ? 'py-2 text-lg' : 'py-2 text-base sm:text-2xl'
          }`}
          autoFocus={!hasSearchContext}
        />
        <button
          type="submit"
          className={`btn-ink inline-flex shrink-0 items-center justify-center gap-2 ${
            hasSearchContext ? 'h-11 px-4 text-sm' : 'h-12 px-4 text-sm sm:h-14 sm:px-7 sm:text-lg'
          }`}
        >
          <span className="display-md leading-none">Comparer</span>
          {!hasSearchContext && <ArrowDown size={18} className="hidden sm:block" strokeWidth={2.5} />}
        </button>
      </div>

      {showNotice && (
        <div className="flex items-center gap-2 px-1 text-sm">
          {error ? <AlertTriangle size={15} className="text-navy" /> : <Sparkles size={15} className="text-yellow" />}
          <span className="eyebrow text-ink-faint">{noticeLabel}</span>
        </div>
      )}

      {hasSearchContext && (
        <div className="pt-1">
          <RetailerFilterPanel
            selectedRetailers={selectedRetailers}
            minPrice={minPrice}
            maxPrice={maxPrice}
            sort={sort}
          />
        </div>
      )}
    </form>
  )
}
