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
    <section id="categories" className="mx-auto max-w-6xl scroll-mt-24 pb-8 sm:scroll-mt-28">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-ink">Parcourir les catégories</h2>
        <span className="meta-label">{SUPPORTED_CATEGORIES.length} catégories</span>
      </div>

      <div className="overflow-x-auto pb-1 scrollbar-none">
        <div className="flex min-w-max gap-2 md:min-w-0 md:flex-wrap">
          {SUPPORTED_CATEGORIES.map((category) => {
            const isActive = selectedCategory === category

            return (
              <Link
                key={category}
                href={buildCategoryHref(search, selectedCategory, category, selectedRetailers, minPrice, maxPrice, sort)}
                className={`inline-flex min-h-10 shrink-0 items-center rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors ${
                  isActive
                    ? 'border-navy bg-navy text-white'
                    : 'border-rule bg-cream text-ink-soft hover:border-navy hover:text-navy'
                }`}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${isActive ? 'Catégorie active : ' : 'Filtrer par catégorie : '}${CATEGORY_LABELS[category]}`}
              >
                <span>{CATEGORY_LABELS[category]}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
