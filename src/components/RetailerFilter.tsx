'use client'

import Image from 'next/image'
import { ChevronDown, ChevronUp, Check, X } from 'lucide-react'
import { useState } from 'react'

import { RETAILERS, RETAILER_INFO } from '@/lib/catalog'

interface RetailerFilterProps {
  selectedRetailers: string[]
  onChange: (retailers: string[]) => void
  defaultExpanded?: boolean
}

export default function RetailerFilter({ selectedRetailers, onChange, defaultExpanded = false }: RetailerFilterProps) {
  const hasFilter = selectedRetailers.length > 0
  const [manualExpanded, setManualExpanded] = useState(defaultExpanded)
  const isExpanded = hasFilter || manualExpanded

  const toggleRetailer = (retailerId: string) => {
    if (selectedRetailers.includes(retailerId)) {
      onChange(selectedRetailers.filter((retailer) => retailer !== retailerId))
      return
    }

    onChange([...selectedRetailers, retailerId])
  }

  return (
    <div className="surface px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={() => setManualExpanded((value) => !value)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full px-0 py-2 text-left text-sm font-semibold text-foreground transition-colors hover:text-accent dark:text-slate-100"
              aria-expanded={isExpanded}
            >
              <span>Filtrer par enseigne</span>
              {hasFilter && (
                <span className="result-badge result-badge-accent px-2 py-1 text-[11px]">
                  {selectedRetailers.length} sélection{selectedRetailers.length > 1 ? 's' : ''}
                </span>
              )}
              {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            <p className="mt-1 text-sm text-muted dark:text-slate-400">
              Gardez toutes les enseignes ou choisissez seulement celles qui vous intéressent.
            </p>
          </div>

          {hasFilter && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="inline-flex items-center gap-2 self-start text-sm font-semibold text-accent transition-colors hover:text-accent-muted"
            >
              <X size={14} />
              Réinitialiser
            </button>
          )}
        </div>

        {isExpanded && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onChange([])}
              className={`control-chip min-h-11 ${!hasFilter ? 'control-chip-active' : ''}`}
              aria-pressed={!hasFilter}
            >
              <Check size={14} />
              Toutes les enseignes
            </button>

            {RETAILERS.map((retailerId) => {
              const retailer = RETAILER_INFO[retailerId]
              const isSelected = !hasFilter || selectedRetailers.includes(retailerId)

              return (
                <button
                  key={retailerId}
                  type="button"
                  onClick={() => toggleRetailer(retailerId)}
                  className={`control-chip min-h-11 ${isSelected ? 'control-chip-active' : ''}`}
                  aria-pressed={isSelected}
                >
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-line bg-white"
                    style={{ borderColor: retailer.color }}
                  >
                    <Image src={retailer.logo} alt={retailer.name} width={16} height={16} className="h-4 w-4 object-contain" unoptimized />
                  </span>
                  <span>{retailer.name}</span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
