'use client'

import Image from 'next/image'

import { RETAILERS, RETAILER_INFO } from '@/lib/catalog'

interface RetailerFilterProps {
  selectedRetailers: string[]
  onChange: (retailers: string[]) => void
}

export default function RetailerFilter({ selectedRetailers, onChange }: RetailerFilterProps) {
  const hasFilter = selectedRetailers.length > 0

  const toggleRetailer = (retailerId: string) => {
    if (selectedRetailers.includes(retailerId)) {
      onChange(selectedRetailers.filter((retailer) => retailer !== retailerId))
      return
    }

    onChange([...selectedRetailers, retailerId])
  }

  return (
    <div className="surface px-4 py-4 sm:px-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="section-label">Affiner par enseigne</p>
          <p className="mt-1 text-sm text-muted dark:text-slate-400">
            Gardez toutes les enseignes ou ciblez seulement celles qui vous intéressent.
          </p>
        </div>

        {hasFilter && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="self-start text-sm font-semibold text-accent transition-colors hover:text-accent-muted"
          >
            Tout réinitialiser
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange([])}
          className={`control-chip ${!hasFilter ? 'control-chip-active' : ''}`}
        >
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
              className={`control-chip ${isSelected ? 'control-chip-active' : ''}`}
            >
              <span
                className="inline-flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-line bg-white"
                style={{ borderColor: retailer.color }}
              >
                <Image src={retailer.logo} alt={retailer.name} width={16} height={16} className="h-4 w-4 object-contain" unoptimized />
              </span>
              {retailer.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
