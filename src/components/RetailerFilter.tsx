'use client'

import { RETAILERS, RETAILER_INFO } from '@/lib/catalog'

interface RetailerFilterProps {
  selectedRetailers: string[]
  onChange: (retailers: string[]) => void
}

export default function RetailerFilter({ selectedRetailers, onChange }: RetailerFilterProps) {
  const toggleRetailer = (retailerId: string) => {
    if (selectedRetailers.includes(retailerId)) {
      onChange(selectedRetailers.filter((retailer) => retailer !== retailerId))
    } else {
      onChange([...selectedRetailers, retailerId])
    }
  }

  const clearAll = () => {
    onChange([])
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] font-bold text-muted uppercase tracking-widest mr-1 dark:text-slate-300">Filtrer:</span>

      {RETAILERS.map((retailerId) => {
        const retailer = RETAILER_INFO[retailerId]
        const isSelected = selectedRetailers.length === 0 || selectedRetailers.includes(retailerId)

        return (
          <button
            key={retailerId}
            onClick={() => toggleRetailer(retailerId)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border ${
              isSelected
                ? 'bg-white border-slate-200 text-foreground shadow-sm dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100'
                : 'bg-slate-50 border-transparent text-muted dark:bg-slate-800/50 dark:text-slate-300'
            }`}
          >
            <span
              className="w-4 h-4 rounded-md flex items-center justify-center text-[7px] font-black text-white shadow-sm"
              style={{ backgroundColor: isSelected ? retailer.color : '#CBD5E1' }}
            >
              {retailer.logo}
            </span>
            {retailer.name}
          </button>
        )
      })}

      {selectedRetailers.length > 0 && selectedRetailers.length < RETAILERS.length && (
        <button onClick={clearAll} className="text-xs text-muted hover:text-accent underline ml-1 dark:text-slate-300 dark:hover:text-accent">
          Tout voir
        </button>
      )}
    </div>
  )
}
