'use client'

import Image from 'next/image'
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react'
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
    <div className="rounded-lg border border-line/70 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setManualExpanded((value) => !value)}
          className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-semibold text-foreground transition-colors hover:text-accent dark:text-slate-100"
          aria-expanded={isExpanded}
        >
          <span>Enseignes</span>
          {hasFilter && <span className="text-xs font-medium text-accent">{selectedRetailers.length}</span>}
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {hasFilter && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-muted transition-colors hover:text-foreground dark:text-slate-400 dark:hover:text-slate-100"
            aria-label="Réinitialiser les enseignes"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onChange([])}
            className={`inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors ${
              !hasFilter
                ? 'border-accent/30 bg-accent-subtle text-accent dark:bg-accent/15 dark:text-slate-100'
                : 'border-line text-muted hover:text-foreground dark:border-slate-700 dark:text-slate-300'
            }`}
            aria-pressed={!hasFilter}
          >
            <Check size={13} />
            Toutes
          </button>

          {RETAILERS.map((retailerId) => {
            const retailer = RETAILER_INFO[retailerId]
            const isSelected = selectedRetailers.includes(retailerId)

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
      )}
    </div>
  )
}
