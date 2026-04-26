'use client'

import { motion } from 'framer-motion'
import { Dog, Flower, Gamepad2, Home, Laptop, Package, Scissors, Shirt, Sparkles, Store, Utensils } from 'lucide-react'

import { CATEGORY_LABELS, SUPPORTED_CATEGORIES, type SupportedCategory } from '@/lib/catalog'

const CATEGORY_ICONS: Record<SupportedCategory, typeof Sparkles> = {
  alimentation: Utensils,
  hygiene: Sparkles,
  menage: Home,
  'maison-deco': Flower,
  jardin: Flower,
  bricolage: Scissors,
  loisirs: Gamepad2,
  animaux: Dog,
  textile: Shirt,
  mode: Shirt,
  'high-tech': Laptop,
  bazar: Package,
  jouets: Store,
}

interface CategoryBarProps {
  selectedCategory: SupportedCategory | null
  setSelectedCategory: (id: SupportedCategory | null) => void
}

export default function CategoryBar({ selectedCategory, setSelectedCategory }: CategoryBarProps) {
  return (
    <div id="categories" className="py-12">
      <div className="text-center mb-10">
        <h3 className="text-2xl font-heading font-bold text-slate-900">Parcourir par univers</h3>
        <p className="text-slate-500 mt-2">Cliquez sur une catégorie pour filtrer les résultats</p>
      </div>

      <div className="flex justify-center gap-4 flex-wrap">
        {SUPPORTED_CATEGORIES.map((category) => {
          const isActive = selectedCategory === category
          const Icon = CATEGORY_ICONS[category]

          return (
            <button key={category} onClick={() => setSelectedCategory(isActive ? null : category)} className="group relative">
              <div
                className={`
                  relative z-10 flex items-center gap-3 px-8 py-4 rounded-2xl font-bold transition-all duration-300
                  ${
                    isActive
                      ? 'bg-brand-orange text-white shadow-xl shadow-brand-orange/20 -translate-y-1'
                      : 'bg-white text-slate-600 border border-slate-200 hover:border-brand-orange hover:text-brand-orange'
                  }
                `}
              >
                <Icon size={20} className={isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'} />
                {CATEGORY_LABELS[category]}
              </div>
              {isActive && (
                <motion.div layoutId="active-category" className="absolute inset-0 bg-brand-orange rounded-2xl blur-lg opacity-30" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
