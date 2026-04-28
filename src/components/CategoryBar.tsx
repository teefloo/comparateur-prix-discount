'use client'

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
    <section id="categories" className="py-10">
      <div className="text-center mb-8">
        <h2 className="text-xl font-bold text-foreground dark:text-slate-100">Parcourir par univers</h2>
        <p className="text-muted mt-1 text-sm dark:text-slate-400">Cliquez sur une catégorie pour filtrer les résultats</p>
      </div>

      <div className="flex justify-center gap-2 flex-wrap">
        {SUPPORTED_CATEGORIES.map((category) => {
          const isActive = selectedCategory === category
          const Icon = CATEGORY_ICONS[category]

          return (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategory(isActive ? null : category)}
              className={isActive ? 'pill pill-active' : 'pill'}
            >
              <div className="flex items-center gap-2">
                <Icon size={16} className={isActive ? 'text-accent' : 'text-muted dark:text-slate-400'} />
                <span>{CATEGORY_LABELS[category]}</span>
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
