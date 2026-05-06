'use client'

import Link from 'next/link'
import { Dog, Flower2, Gamepad2, Home, Laptop, Package, Shirt, Sparkles, Utensils } from 'lucide-react'

import { CATEGORY_LABELS, SUPPORTED_CATEGORIES, type SupportedCategory } from '@/lib/catalog'

const CATEGORY_ICONS: Record<SupportedCategory, typeof Sparkles> = {
  alimentation: Utensils,
  hygiene: Sparkles,
  menage: Home,
  'maison-deco': Flower2,
  jardin: Flower2,
  bricolage: Package,
  loisirs: Gamepad2,
  animaux: Dog,
  textile: Shirt,
  mode: Shirt,
  'high-tech': Laptop,
  bazar: Package,
  jouets: Gamepad2,
}

interface CategoryBarProps {
  search: string
  selectedCategory: SupportedCategory | null
  onSelectCategory?: (category: SupportedCategory) => void
  basePath?: string
}

function buildCategoryHref(
  search: string,
  currentCategory: SupportedCategory | null,
  nextCategory: SupportedCategory,
  basePath: string,
) {
  const params = new URLSearchParams()
  const normalizedSearch = search.trim()

  if (normalizedSearch) {
    params.set('query', normalizedSearch)
  }

  if (currentCategory !== nextCategory) {
    params.set('category', nextCategory)
  }

  const queryString = params.toString()
  return queryString ? `${basePath}?${queryString}` : basePath
}

export default function CategoryBar({ search, selectedCategory, onSelectCategory, basePath = '/' }: CategoryBarProps) {
  return (
    <section id="categories" className="mx-auto max-w-7xl scroll-mt-24 pb-6 sm:scroll-mt-28">
      <div className="overflow-x-auto pb-2 scrollbar-none">
        <div className="flex min-w-max snap-x snap-proximity gap-2 md:min-w-0 md:flex-wrap">
          {SUPPORTED_CATEGORIES.map((category) => {
            const isActive = selectedCategory === category
            const Icon = CATEGORY_ICONS[category]

            if (onSelectCategory) {
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => onSelectCategory(category)}
                  className={`nav-pill min-h-10 shrink-0 snap-start px-4 py-2 text-sm transition-all ${isActive ? 'nav-pill-active ring-2 ring-accent/30' : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                  aria-pressed={isActive}
                >
                  <Icon size={14} className={isActive ? 'text-accent' : 'text-subtle dark:text-slate-500'} />
                  <span>{CATEGORY_LABELS[category]}</span>
                </button>
              )
            }

            return (
              <Link
                key={category}
                href={buildCategoryHref(search, selectedCategory, category, basePath)}
                className={`nav-pill min-h-10 shrink-0 snap-start px-4 py-2 text-sm transition-all ${isActive ? 'nav-pill-active ring-2 ring-accent/30' : 'bg-transparent border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon size={14} className={isActive ? 'text-accent' : 'text-subtle dark:text-slate-500'} />
                <span>{CATEGORY_LABELS[category]}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}

