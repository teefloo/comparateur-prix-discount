'use client'

import Image from 'next/image'
import { useId, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react'

import { RETAILERS, RETAILER_INFO } from '@/lib/catalog'
import { normalizePriceRange, type PriceSortOption } from '@/lib/result-filters'

interface RetailerFilterPanelProps {
  selectedRetailers: string[]
  minPrice: number | null
  maxPrice: number | null
  sort: PriceSortOption
}

interface RetailerFilterPanelFormProps extends RetailerFilterPanelProps {
  pathname: string
  searchParamsKey: string
}

function formatPriceInput(value: number | null) {
  return value === null ? '' : String(value)
}

function countActiveFilters(retailers: string[], minPrice: string, maxPrice: string, sort: PriceSortOption) {
  return (retailers.length > 0 ? 1 : 0) + (minPrice !== '' ? 1 : 0) + (maxPrice !== '' ? 1 : 0) + (sort !== 'default' ? 1 : 0)
}

function RetailerFilterPanelForm({
  selectedRetailers,
  minPrice,
  maxPrice,
  sort,
  pathname,
  searchParamsKey,
}: RetailerFilterPanelFormProps) {
  const router = useRouter()
  const advancedPanelId = useId()
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)

  const [draftRetailers, setDraftRetailers] = useState<string[]>(selectedRetailers)
  const [draftMinPrice, setDraftMinPrice] = useState(formatPriceInput(minPrice))
  const [draftMaxPrice, setDraftMaxPrice] = useState(formatPriceInput(maxPrice))
  const [draftSort, setDraftSort] = useState<PriceSortOption>(sort)
  const activeFilterCount = countActiveFilters(draftRetailers, draftMinPrice, draftMaxPrice, draftSort)

  function buildNextUrl(nextValues?: {
    retailers?: string[]
    minPrice?: string
    maxPrice?: string
    sort?: PriceSortOption
  }) {
    const params = new URLSearchParams(searchParamsKey)
    const nextRetailers = nextValues?.retailers ?? draftRetailers
    const nextMinPrice = nextValues?.minPrice ?? draftMinPrice
    const nextMaxPrice = nextValues?.maxPrice ?? draftMaxPrice
    const nextSort = nextValues?.sort ?? draftSort

    if (nextRetailers.length > 0) {
      params.set('retailer', nextRetailers.join(','))
    } else {
      params.delete('retailer')
    }

    const { minPrice: normalizedMinPrice, maxPrice: normalizedMaxPrice } = normalizePriceRange(nextMinPrice, nextMaxPrice)

    if (normalizedMinPrice !== null) {
      params.set('minPrice', String(normalizedMinPrice))
    } else {
      params.delete('minPrice')
    }

    if (normalizedMaxPrice !== null) {
      params.set('maxPrice', String(normalizedMaxPrice))
    } else {
      params.delete('maxPrice')
    }

    if (nextSort !== 'default') {
      params.set('sort', nextSort)
    } else {
      params.delete('sort')
    }

    const queryString = params.toString()
    return queryString ? `${pathname}?${queryString}` : pathname
  }

  function applyFilters() {
    router.push(
      buildNextUrl({
        retailers: draftRetailers,
        minPrice: draftMinPrice,
        maxPrice: draftMaxPrice,
        sort: draftSort,
      }),
    )
  }

  function resetFilters() {
    setDraftRetailers([])
    setDraftMinPrice('')
    setDraftMaxPrice('')
    setDraftSort('default')
    router.push(buildNextUrl({ retailers: [], minPrice: '', maxPrice: '', sort: 'default' }))
  }

  function toggleRetailer(retailerId: string) {
    setDraftRetailers((current) =>
      current.includes(retailerId) ? current.filter((retailer) => retailer !== retailerId) : [...current, retailerId],
    )
  }

  const sortButtonClass = (active: boolean) =>
    `inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-md border px-3 text-xs font-medium transition-colors ${
      active
        ? 'border-foreground bg-foreground text-background dark:border-white dark:bg-white dark:text-slate-950'
        : 'border-line bg-white text-muted hover:border-accent hover:text-foreground dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
    }`

  return (
    <div className="rounded-xl border border-line/70 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <button
        type="button"
        onClick={() => setIsAdvancedOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 rounded-lg text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5"
        aria-expanded={isAdvancedOpen}
        aria-controls={advancedPanelId}
      >
        <div>
          <h2 className="text-sm font-semibold text-foreground dark:text-slate-100">Avancé</h2>
          <p className="mt-0.5 text-xs text-muted dark:text-slate-400">Enseignes, prix et tri</p>
        </div>

        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-accent-subtle px-2 text-xs font-semibold text-accent dark:bg-accent/15 dark:text-slate-100">
              {activeFilterCount}
            </span>
          )}
          {isAdvancedOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {isAdvancedOpen && (
        <div id={advancedPanelId} className="mt-4 space-y-4 border-t border-line/70 pt-4 dark:border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground dark:text-slate-100">Filtres avancés</h3>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex min-h-9 items-center gap-2 rounded-md px-2 text-xs font-medium text-muted transition-colors hover:text-foreground dark:text-slate-400 dark:hover:text-slate-100"
            >
              <RotateCcw size={14} />
              Réinitialiser
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted dark:text-slate-400">Enseignes</p>
              <div className="flex flex-wrap gap-2">
                {RETAILERS.map((retailerId) => {
                  const retailer = RETAILER_INFO[retailerId]
                  const isSelected = draftRetailers.includes(retailerId)

                  return (
                    <button
                      key={retailerId}
                      type="button"
                      onClick={() => toggleRetailer(retailerId)}
                      className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
                        isSelected
                          ? 'border-accent/30 bg-accent-subtle text-accent dark:bg-accent/15 dark:text-slate-100'
                          : 'border-line text-muted hover:text-foreground dark:border-slate-700 dark:text-slate-300'
                      }`}
                      aria-pressed={isSelected}
                    >
                      <Image src={retailer.logo} alt={retailer.name} width={16} height={16} className="h-4 w-4 object-contain" unoptimized />
                      <span>{retailer.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted dark:text-slate-400">Prix min</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={draftMinPrice}
                  onChange={(event) => setDraftMinPrice(event.target.value)}
                  placeholder="0"
                  className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm outline-none placeholder:text-subtle focus:border-accent dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </label>

              <label className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-muted dark:text-slate-400">Prix max</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  value={draftMaxPrice}
                  onChange={(event) => setDraftMaxPrice(event.target.value)}
                  placeholder="0"
                  className="h-11 w-full rounded-md border border-line bg-white px-3 text-sm outline-none placeholder:text-subtle focus:border-accent dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </label>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted dark:text-slate-400">Tri</p>
              <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Tri des résultats">
                <button
                  type="button"
                  onClick={() => setDraftSort('default')}
                  className={sortButtonClass(draftSort === 'default')}
                  aria-pressed={draftSort === 'default'}
                >
                  <ArrowUpDown size={14} />
                  <span>Par défaut</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDraftSort('price-asc')}
                  className={sortButtonClass(draftSort === 'price-asc')}
                  aria-pressed={draftSort === 'price-asc'}
                >
                  <ArrowUp size={14} />
                  <span>Croissant</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDraftSort('price-desc')}
                  className={sortButtonClass(draftSort === 'price-desc')}
                  aria-pressed={draftSort === 'price-desc'}
                >
                  <ArrowDown size={14} />
                  <span>Décroissant</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={applyFilters}
                className="inline-flex min-h-10 items-center gap-2 rounded-md bg-foreground px-4 text-sm font-semibold text-white transition-colors hover:opacity-90 dark:bg-white dark:text-slate-950"
              >
                <Check size={14} />
                Appliquer
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex min-h-10 items-center gap-2 rounded-md border border-line bg-white px-4 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-foreground dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                <RotateCcw size={14} />
                Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function RetailerFilterPanel(props: RetailerFilterPanelProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsKey = searchParams.toString()
  const formKey = searchParamsKey ? `${pathname}?${searchParamsKey}` : pathname

  return <RetailerFilterPanelForm key={formKey} pathname={pathname} searchParamsKey={searchParamsKey} {...props} />
}
