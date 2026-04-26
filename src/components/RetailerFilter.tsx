'use client'

import { motion } from 'framer-motion'

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
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2">Filtrer:</span>

      {RETAILERS.map((retailerId) => {
        const retailer = RETAILER_INFO[retailerId]
        const isSelected = selectedRetailers.length === 0 || selectedRetailers.includes(retailerId)

        return (
          <motion.button
            key={retailerId}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleRetailer(retailerId)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all
              border
              ${isSelected ? 'bg-white border-slate-200 text-slate-700 shadow-sm' : 'bg-slate-50 border-slate-100 text-slate-400'}
            `}
          >
            <span
              className="w-4 h-4 rounded-md flex items-center justify-center text-[8px] font-black text-white"
              style={{ backgroundColor: isSelected ? retailer.color : '#cbd5e1' }}
            >
              {retailer.logo}
            </span>
            {retailer.name}
          </motion.button>
        )
      })}

      {selectedRetailers.length > 0 && selectedRetailers.length < RETAILERS.length && (
        <button onClick={clearAll} className="text-xs text-slate-400 hover:text-brand-orange underline">
          Tout voir
        </button>
      )}
    </div>
  )
}
