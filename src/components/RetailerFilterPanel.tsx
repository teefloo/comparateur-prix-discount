'use client'

import Image from 'next/image'
import { useId, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ArrowDown, ArrowUp, ArrowUpDown, Check, ChevronDown, ChevronUp, RotateCcw, SlidersHorizontal } from 'lucide-react'

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
    `inline-flex min-h-11 flex-1 items-center justify-center gap-2 border-2 px-3 text-xs font-semibold transition-all ${
      active
        ? 'border-ink bg-ink text-cream shadow-[3px_3px_0_var(--navy)]'
        : 'border-ink/60 bg-cream text-ink-soft shadow-[3px_3px_0_var(--ink)] hover:-translate-x-[1.5px] hover:-translate-y-[1.5px] hover:border-ink hover:bg-cream hover:text-ink hover:shadow-[4.5px_4.5px_0_var(--ink)]'
    }`

  return (
    <div className="border-2 border-ink bg-cream shadow-[4px_4px_0_var(--ink)]">
      <button
        type="button"
        onClick={() => setIsAdvancedOpen((value) => !value)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-paper-2"
        aria-expanded={isAdvancedOpen}
        aria-controls={advancedPanelId}
      >
        <div className="flex items-center gap-3">
          <SlidersHorizontal size={16} className="text-navy" strokeWidth={2.5} />
          <div>
            <h2 className="display-md text-lg text-ink leading-none">Filtres avancés</h2>
            <p className="mt-0.5 eyebrow text-ink-faint">Enseignes · prix · tri</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <span className="price-stamp mono text-[10px]">{activeFilterCount}</span>
          )}
          {isAdvancedOpen ? <ChevronUp size={16} className="text-ink" /> : <ChevronDown size={16} className="text-ink" />}
        </div>
      </button>

      {isAdvancedOpen && (
        <div id={advancedPanelId} className="border-t-2 border-ink p-4 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <p className="eyebrow text-ink-faint">Configuration</p>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex min-h-9 items-center gap-1.5 px-2 text-xs font-semibold text-ink-soft transition-colors hover:text-navy"
            >
              <RotateCcw size={13} strokeWidth={2.5} />
              Tout effacer
            </button>
          </div>

          <div className="space-y-5">
            <div className="space-y-2.5">
              <p className="eyebrow text-ink-faint">Enseignes suivies</p>
              <div className="flex flex-wrap gap-2">
                {RETAILERS.map((retailerId) => {
                  const retailer = RETAILER_INFO[retailerId]
                  const isSelected = draftRetailers.includes(retailerId)

                  return (
                    <button
                      key={retailerId}
                      type="button"
                      onClick={() => toggleRetailer(retailerId)}
                      className={`inline-flex min-h-10 items-center gap-1.5 border-2 px-3 text-xs font-semibold transition-all ${
                        isSelected
                          ? 'border-ink bg-ink text-cream shadow-[2px_2px_0_var(--navy)]'
                          : 'border-ink/60 bg-cream text-ink-soft shadow-[2px_2px_0_var(--ink)] hover:-translate-x-[1px] hover:-translate-y-[1px] hover:border-ink hover:bg-cream hover:text-ink hover:shadow-[3px_3px_0_var(--ink)]'
                      }`}
                      aria-pressed={isSelected}
                    >
                      <span
                        className="grid h-4 w-4 shrink-0 place-items-center border border-ink/60"
                        style={{ backgroundColor: retailer.color + '33' }}
                      >
                        <Image src={retailer.logo} alt={retailer.name} width={12} height={12} className="h-2.5 w-2.5 object-contain" unoptimized />
                      </span>
                      <span>{retailer.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="eyebrow text-ink-faint">Prix minimum</span>
                <div className="flex items-center border-2 border-ink/70 bg-cream shadow-[2px_2px_0_var(--ink)] focus-within:border-ink focus-within:shadow-[3px_3px_0_var(--ink)]">
                  <span className="mono px-3 text-ink-faint">€</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={draftMinPrice}
                    onChange={(event) => setDraftMinPrice(event.target.value)}
                    placeholder="0,00"
                    className="h-11 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-mute body-sans"
                  />
                </div>
              </label>

              <label className="space-y-1.5">
                <span className="eyebrow text-ink-faint">Prix maximum</span>
                <div className="flex items-center border-2 border-ink/70 bg-cream shadow-[2px_2px_0_var(--ink)] focus-within:border-ink focus-within:shadow-[3px_3px_0_var(--ink)]">
                  <span className="mono px-3 text-ink-faint">€</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={draftMaxPrice}
                    onChange={(event) => setDraftMaxPrice(event.target.value)}
                    placeholder="99,00"
                    className="h-11 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-mute body-sans"
                  />
                </div>
              </label>
            </div>

            <div className="space-y-2.5">
              <p className="eyebrow text-ink-faint">Tri des résultats</p>
              <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Tri des résultats">
                <button
                  type="button"
                  onClick={() => setDraftSort('default')}
                  className={sortButtonClass(draftSort === 'default')}
                  aria-pressed={draftSort === 'default'}
                >
                  <ArrowUpDown size={14} strokeWidth={2.5} />
                  <span>Défaut</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDraftSort('price-asc')}
                  className={sortButtonClass(draftSort === 'price-asc')}
                  aria-pressed={draftSort === 'price-asc'}
                >
                  <ArrowUp size={14} strokeWidth={2.5} />
                  <span>Croissant</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDraftSort('price-desc')}
                  className={sortButtonClass(draftSort === 'price-desc')}
                  aria-pressed={draftSort === 'price-desc'}
                >
                  <ArrowDown size={14} strokeWidth={2.5} />
                  <span>Décroissant</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" onClick={applyFilters} className="btn-ink inline-flex min-h-11 items-center gap-2 px-5 text-sm">
                <Check size={14} strokeWidth={2.5} />
                Appliquer les filtres
              </button>
              <button type="button" onClick={resetFilters} className="btn-paper inline-flex min-h-11 items-center gap-2 px-4 text-sm">
                <RotateCcw size={14} strokeWidth={2.5} />
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
