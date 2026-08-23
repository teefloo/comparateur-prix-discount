'use client'

import { AlertTriangle, ArrowRight, Search } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

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
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.72fr)] lg:items-end lg:gap-20">
            <div className="max-w-3xl">
              <p className="meta-label">Le bulletin des prix discount</p>
              <h1 className="display-huge mt-4 max-w-[10ch] text-balance">
                Trouvez <span className="text-navy">le bon prix.</span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-ink-soft sm:text-lg">
                Comparez les offres de 10 enseignes au même endroit, puis choisissez en quelques secondes.
              </p>

              <div className="mt-8 max-w-4xl">
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

              <div className="mt-5 flex flex-wrap items-center gap-2.5 text-sm">
                <span className="meta-label mr-1">Essayez</span>
                {['Lessive', 'Brosse à dents', 'Café moulu', 'Puzzle'].map((example) => (
                  <Link
                    key={example}
                    href={`/?query=${encodeURIComponent(example)}`}
                    className="chip bg-cream font-medium text-ink-soft hover:border-navy hover:text-navy"
                  >
                    {example}
                  </Link>
                ))}
              </div>
            </div>

            <aside className="surface-elevated relative overflow-hidden p-5 sm:p-6">
              <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-navy/5" aria-hidden="true" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="meta-label">ComparPrix</p>
                  <p className="mt-2 max-w-[13rem] text-sm font-semibold leading-5 text-ink">Une lecture claire avant de passer en caisse.</p>
                </div>
                <Image
                  src="/brand/comparprix-icon.svg"
                  alt=""
                  width={52}
                  height={52}
                  className="h-12 w-12 shrink-0"
                  priority
                />
              </div>

              <dl className="relative mt-8 grid grid-cols-3 gap-3 border-t pt-4">
                <div>
                  <dt className="meta-label">Enseignes</dt>
                  <dd className="mt-1 font-mono text-xl font-semibold tabular-nums text-ink">10</dd>
                </div>
                <div>
                  <dt className="meta-label">Rayons</dt>
                  <dd className="mt-1 font-mono text-xl font-semibold tabular-nums text-ink">13</dd>
                </div>
                <div>
                  <dt className="meta-label">Rythme</dt>
                  <dd className="mt-1 text-sm font-semibold leading-5 text-ink">Chaque semaine</dd>
                </div>
              </dl>
            </aside>
          </div>
        </div>
      ) : (
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="meta-label">Votre recherche</p>
              <p className="mt-1 text-sm text-ink-soft">Affinez les offres avant de les comparer.</p>
            </div>
            <Link href="/" className="text-sm font-semibold text-navy underline decoration-navy/25 underline-offset-4 hover:decoration-navy">
              Nouvelle recherche
            </Link>
          </div>

          <div className="mt-5 max-w-5xl">
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

      <div className="field-shell flex min-h-16 items-center gap-3 p-1.5 sm:p-2">
        <Search className="ml-2 shrink-0 text-navy" size={20} strokeWidth={1.8} />
        <input
          name="query"
          type="text"
          defaultValue={search}
          placeholder="Ex. lessive ou puzzle"
          aria-label="Rechercher un produit"
          className="min-w-0 flex-1 bg-transparent px-1 py-2 text-base text-ink outline-none placeholder:text-ink-faint body-sans sm:text-lg"
          autoFocus={!hasSearchContext}
        />
        <button
          type="submit"
          className="btn-primary inline-flex min-h-12 shrink-0 items-center justify-center gap-2 px-4 text-sm sm:px-6"
        >
          <span>Comparer</span>
          <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      {showNotice && (
        <div role="status" className="flex items-start gap-2 rounded-xl border border-rule bg-paper-2 px-3 py-2.5 text-sm text-ink-soft">
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
