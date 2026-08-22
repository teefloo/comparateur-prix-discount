'use client'

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
    `inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-semibold transition-colors ${
      active
        ? 'border-navy bg-navy text-white'
        : 'border-rule bg-cream text-ink-soft hover:border-navy hover:text-navy'
    }`

  return (
    <div className="surface-elevated">
      <button
        type="button"
        onClick={() => setIsAdvancedOpen((value) => !value)}
        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-xl px-4 py-3.5 text-left transition-colors hover:bg-paper-2"
        aria-expanded={isAdvancedOpen}
        aria-controls={advancedPanelId}
      >
        <div className="flex items-center gap-3">
          <SlidersHorizontal size={17} className="text-navy" strokeWidth={1.8} />
          <div>
            <h2 className="text-sm font-semibold text-ink">Filtres avancés</h2>
            <p className="mt-0.5 text-xs text-ink-faint">Enseignes, prix et tri</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeFilterCount > 0 && (
            <span className="rounded-full border border-navy/30 bg-navy/10 px-2 py-1 font-mono text-[10px] font-semibold text-navy">{activeFilterCount}</span>
          )}
          {isAdvancedOpen ? <ChevronUp size={17} className="text-ink-soft" /> : <ChevronDown size={17} className="text-ink-soft" />}
        </div>
      </button>

      {isAdvancedOpen && (
        <div id={advancedPanelId} className="space-y-5 border-t p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink">Configuration</p>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-xs font-semibold text-ink-soft transition-colors hover:text-navy"
            >
              <RotateCcw size={13} strokeWidth={1.8} />
              Tout effacer
            </button>
          </div>

          <div className="space-y-5">
            <div className="space-y-2.5">
              <p className="meta-label">Enseignes suivies</p>
              <div className="flex flex-wrap gap-2">
                {RETAILERS.map((retailerId) => {
                  const retailer = RETAILER_INFO[retailerId]
                  const isSelected = draftRetailers.includes(retailerId)

                  return (
                    <button
                      key={retailerId}
                      type="button"
                      onClick={() => toggleRetailer(retailerId)}
                      className={`inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold transition-colors ${
                        isSelected
                          ? 'border-navy bg-navy text-white'
                          : 'border-rule bg-cream text-ink-soft hover:border-navy hover:text-navy'
                      }`}
                      aria-pressed={isSelected}
                    >
                      <span
                        className="grid h-5 w-5 shrink-0 place-items-center rounded-md border bg-paper-2"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={retailer.logo} alt={retailer.name} width={12} height={12} loading="lazy" decoding="async" className="h-2.5 w-2.5 object-contain" />
                      </span>
                      <span>{retailer.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="meta-label">Prix minimum</span>
                <div className="input-shell flex min-h-11 items-center">
                  <span className="mono px-3 text-ink-faint">€</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={draftMinPrice}
                    onChange={(event) => setDraftMinPrice(event.target.value)}
                    placeholder="0,00"
                    className="h-11 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint body-sans"
                  />
                </div>
              </label>

              <label className="space-y-1.5">
                <span className="meta-label">Prix maximum</span>
                <div className="input-shell flex min-h-11 items-center">
                  <span className="mono px-3 text-ink-faint">€</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    value={draftMaxPrice}
                    onChange={(event) => setDraftMaxPrice(event.target.value)}
                    placeholder="99,00"
                    className="h-11 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-faint body-sans"
                  />
                </div>
              </label>
            </div>

            <div className="space-y-2.5">
              <p className="meta-label">Tri des résultats</p>
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
              <button type="button" onClick={applyFilters} className="btn-primary inline-flex min-h-11 items-center gap-2 px-5 text-sm">
                <Check size={14} strokeWidth={1.8} />
                Appliquer les filtres
              </button>
              <button type="button" onClick={resetFilters} className="btn-secondary inline-flex min-h-11 items-center gap-2 px-4 text-sm">
                <RotateCcw size={14} strokeWidth={1.8} />
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
