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

function buildAllCategoriesHref(
  search: string,
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
    <section id="categories" className="scroll-mt-24 pb-8 pt-7 sm:scroll-mt-28">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight text-ink">Parcourir les catégories</h2>
          <p className="mt-1 text-sm text-ink-soft">Un rayon pour chaque recherche.</p>
        </div>
        <span className="meta-label">{SUPPORTED_CATEGORIES.length} rayons</span>
      </div>

      <div className="overflow-x-auto pb-1 scrollbar-none">
        <div className="flex min-w-max gap-1.5 md:min-w-0 md:flex-wrap">
          <Link
            href={buildAllCategoriesHref(search, selectedRetailers, minPrice, maxPrice, sort)}
            className={`inline-flex min-h-9 shrink-0 items-center rounded-full border px-3 py-1.5 text-[0.8125rem] font-semibold transition-colors ${
              selectedCategory === null
                ? 'border-navy bg-navy text-white'
                : 'border-rule bg-cream text-ink-soft hover:border-navy hover:text-navy'
            }`}
            aria-current={selectedCategory === null ? 'page' : undefined}
          >
            Toutes
          </Link>
          {SUPPORTED_CATEGORIES.map((category) => {
            const isActive = selectedCategory === category

            return (
              <Link
                key={category}
                href={buildCategoryHref(search, selectedCategory, category, selectedRetailers, minPrice, maxPrice, sort)}
                className={`inline-flex min-h-9 shrink-0 items-center rounded-full border px-3 py-1.5 text-[0.8125rem] font-semibold transition-colors ${
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
