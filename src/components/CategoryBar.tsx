'use client'

import Link from 'next/link'

import { CATEGORY_LABELS, SUPPORTED_CATEGORIES, type SupportedCategory } from '@/lib/catalog'
import type { PriceSortOption } from '@/lib/result-filters'

interface CategoryBarProps {
  search: string
  selectedCategory: SupportedCategory | null
  selectedRetailers: string[]
  minPrice: number | null
  maxPrice: number | null
  sort: PriceSortOption
  onSelectCategory?: (category: SupportedCategory) => void
  basePath?: string
}

function buildCategoryHref(
  search: string,
  currentCategory: SupportedCategory | null,
  nextCategory: SupportedCategory,
  selectedRetailers: string[],
  minPrice: number | null,
  maxPrice: number | null,
  sort: PriceSortOption,
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

  if (selectedRetailers.length > 0) {
    params.set('retailer', selectedRetailers.join(','))
  }

  if (minPrice !== null) {
    params.set('minPrice', String(minPrice))
  }

  if (maxPrice !== null) {
    params.set('maxPrice', String(maxPrice))
  }

  if (sort !== 'default') {
    params.set('sort', sort)
  }

  const queryString = params.toString()
  return queryString ? `${basePath}?${queryString}` : basePath
}

export default function CategoryBar({
  search,
  selectedCategory,
  selectedRetailers,
  minPrice,
  maxPrice,
  sort,
  onSelectCategory,
  basePath = '/',
}: CategoryBarProps) {
  return (
    <section id="categories" className="mx-auto max-w-7xl scroll-mt-24 pb-4 sm:scroll-mt-28">
      <div className="overflow-x-auto pb-2 scrollbar-none">
        <div className="flex min-w-max gap-2 md:min-w-0 md:flex-wrap">
          {SUPPORTED_CATEGORIES.map((category) => {
            const isActive = selectedCategory === category
            const className = `inline-flex min-h-9 shrink-0 items-center rounded-full border px-3 text-sm font-medium transition-colors ${
              isActive
                ? 'border-accent/30 bg-accent-subtle text-accent dark:bg-accent/15 dark:text-slate-100'
                : 'border-transparent text-muted hover:bg-white hover:text-foreground dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100'
            }`

            if (onSelectCategory) {
              return (
                <button key={category} type="button" onClick={() => onSelectCategory(category)} className={className} aria-pressed={isActive}>
                  {CATEGORY_LABELS[category]}
                </button>
              )
            }

            return (
              <Link
                key={category}
                href={buildCategoryHref(search, selectedCategory, category, selectedRetailers, minPrice, maxPrice, sort, basePath)}
                className={className}
                aria-current={isActive ? 'page' : undefined}
              >
                {CATEGORY_LABELS[category]}
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
