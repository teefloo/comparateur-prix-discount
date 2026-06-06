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
}

function buildCategoryHref(
  search: string,
  currentCategory: SupportedCategory | null,
  nextCategory: SupportedCategory,
  selectedRetailers: string[],
  minPrice: number | null,
  maxPrice: number | null,
  sort: PriceSortOption,
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
  return queryString ? `/?${queryString}` : '/'
}

export default function CategoryBar({
  search,
  selectedCategory,
  selectedRetailers,
  minPrice,
  maxPrice,
  sort,
}: CategoryBarProps) {
  return (
    <section id="categories" className="mx-auto max-w-7xl scroll-mt-32 pb-6 sm:scroll-mt-36">
      <div className="mb-3 flex items-center gap-3">
        <span className="eyebrow text-ink-faint">Rayons</span>
        <span className="dotline h-px flex-1 bg-ink/30" />
        <span className="eyebrow text-ink-faint">{SUPPORTED_CATEGORIES.length} catégories</span>
      </div>

      <div className="overflow-x-auto pb-2 scrollbar-none">
        <div className="flex min-w-max gap-2 md:min-w-0 md:flex-wrap">
          {SUPPORTED_CATEGORIES.map((category, index) => {
            const isActive = selectedCategory === category
            const number = String(index + 1).padStart(2, '0')

            return (
              <Link
                key={category}
                href={buildCategoryHref(search, selectedCategory, category, selectedRetailers, minPrice, maxPrice, sort)}
                className={`group inline-flex min-h-10 shrink-0 items-center gap-2.5 border-2 px-3.5 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? 'border-ink bg-ink text-cream shadow-[3px_3px_0_var(--navy)]'
                    : 'border-ink/60 bg-cream text-ink shadow-[3px_3px_0_var(--ink)] hover:-translate-x-[2px] hover:-translate-y-[2px] hover:border-ink hover:shadow-[5px_5px_0_var(--ink)]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span
                  className={`mono text-[10px] font-bold ${
                    isActive ? 'text-cream/70' : 'text-ink-faint'
                  }`}
                >
                  № {number}
                </span>
                <span className="editorial text-base">{CATEGORY_LABELS[category]}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
