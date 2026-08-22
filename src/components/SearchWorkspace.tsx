'use client'

import { AlertTriangle, ArrowRight, Search } from 'lucide-react'

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
  const noticeLabel = error ? 'La recherche rencontre un problème' : 'Résultats de démonstration'

  return (
    <section className="border-b bg-paper">
      {!hasSearchContext ? (
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-end lg:gap-16">
            <div className="max-w-3xl">
              <p className="meta-label">ComparPrix</p>
              <h1 className="display-huge mt-4 text-balance">
                Trouvez <span className="text-navy">le bon prix.</span>
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-7 text-ink-soft sm:text-xl">
                Comparez 10 enseignes discount au même endroit et repérez rapidement le prix le plus juste.
              </p>
            </div>

            <dl className="grid grid-cols-3 gap-4 border-t pt-5 lg:block lg:border-t-0 lg:border-l lg:pl-6">
              <div>
                <dt className="meta-label">Enseignes</dt>
                <dd className="mt-1 font-mono text-lg font-semibold tabular-nums text-ink">10</dd>
              </div>
              <div className="lg:mt-5">
                <dt className="meta-label">Catégories</dt>
                <dd className="mt-1 font-mono text-lg font-semibold tabular-nums text-ink">13</dd>
              </div>
              <div className="lg:mt-5">
                <dt className="meta-label">Mise à jour</dt>
                <dd className="mt-1 font-mono text-sm font-semibold text-ink">Chaque semaine</dd>
              </div>
            </dl>
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

          <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
            <span className="meta-label">Essayez</span>
            {['Lessive', 'Brosse à dents', 'Café moulu', 'Puzzle'].map((example) => (
              <a
                key={example}
                href={`/?query=${encodeURIComponent(example)}`}
                className="font-medium text-ink underline decoration-border-strong underline-offset-4 transition-colors hover:text-navy hover:decoration-navy"
              >
                {example}
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="meta-label">Recherche</p>
          <div className="mt-4 max-w-4xl">
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

      <div className="field-shell flex min-h-14 items-center gap-3 p-1.5 sm:p-2">
        <Search className="ml-2 shrink-0 text-ink-soft" size={20} strokeWidth={1.8} />
        <input
          name="query"
          type="text"
          defaultValue={search}
          placeholder="Rechercher un produit"
          aria-label="Rechercher un produit"
          className={`min-w-0 flex-1 bg-transparent px-1 text-ink outline-none placeholder:text-ink-faint body-sans ${
            hasSearchContext ? 'py-2 text-base' : 'py-2 text-base sm:text-lg'
          }`}
          autoFocus={!hasSearchContext}
        />
        <button
          type="submit"
          className={`btn-primary inline-flex min-h-11 shrink-0 items-center justify-center gap-2 px-4 text-sm sm:px-5 ${
            hasSearchContext ? '' : 'sm:min-h-12'
          }`}
        >
          <span>Comparer</span>
          <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      {showNotice && (
        <div className="flex items-start gap-2 rounded-lg border border-rule bg-paper-2 px-3 py-2.5 text-sm text-ink-soft">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-navy" strokeWidth={1.8} aria-hidden="true" />
          <span>{error || noticeLabel}</span>
        </div>
      )}

      {hasSearchContext && (
        <RetailerFilterPanel
          selectedRetailers={selectedRetailers}
          minPrice={minPrice}
          maxPrice={maxPrice}
          sort={sort}
        />
      )}
    </form>
  )
}
