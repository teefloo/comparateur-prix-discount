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
    <section id="categories" className="mx-auto max-w-7xl scroll-mt-24 px-4 py-5 sm:px-6 sm:scroll-mt-28">
      <div className="surface-strong overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-4 dark:border-slate-800 sm:px-5">
          <div>
            <p className="section-label">Navigation par univers</p>
            <p className="mt-1 text-sm text-muted dark:text-slate-400">
              Filtrez immédiatement la recherche par catégorie.
            </p>
          </div>
          {selectedCategory && (
            <span className="result-badge result-badge-accent hidden sm:inline-flex">
              {CATEGORY_LABELS[selectedCategory]}
            </span>
          )}
        </div>

        <div className="overflow-x-auto px-3 py-4 scrollbar-none sm:px-5 md:overflow-visible">
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
                    className={`nav-pill shrink-0 snap-start px-4 py-2.5 ${isActive ? 'nav-pill-active' : ''}`}
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
                  className={`nav-pill shrink-0 snap-start px-4 py-2.5 ${isActive ? 'nav-pill-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={14} className={isActive ? 'text-accent' : 'text-subtle dark:text-slate-500'} />
                  <span>{CATEGORY_LABELS[category]}</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
