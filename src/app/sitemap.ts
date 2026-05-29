import type { MetadataRoute } from 'next'

import { SUPPORTED_CATEGORIES } from '@/lib/catalog'
import { DEMO_OFFERS } from '@/lib/demo-offers'
import { getOffersByCategory, getProductSitemapEntries } from '@/lib/db'
import { hasDatabaseUrl } from '@/lib/ensure-db-env'
import { absoluteUrl } from '@/lib/site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  if (!hasDatabaseUrl()) {
    return [
      {
        url: absoluteUrl('/'),
        lastModified: now,
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: absoluteUrl('/deals'),
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.9,
      },
      {
        url: absoluteUrl('/a-propos'),
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.5,
      },
      ...SUPPORTED_CATEGORIES.map((category) => ({
        url: absoluteUrl(`/categorie/${category}`),
        lastModified: now,
        changeFrequency: 'daily' as const,
        priority: 0.7,
      })),
      ...DEMO_OFFERS.map((product) => ({
        url: absoluteUrl(`/produit/${product.id}`),
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
    ]
  }

  const categoryEntries = await Promise.all(
    SUPPORTED_CATEGORIES.map(async (category) => {
      try {
        const offers = await getOffersByCategory(category)
        const latestUpdate = offers
          .map((offer) => (offer.lastUpdated ? new Date(offer.lastUpdated) : null))
          .filter((value): value is Date => value instanceof Date && !Number.isNaN(value.getTime()))
          .sort((left, right) => right.getTime() - left.getTime())[0]

        return {
          url: absoluteUrl(`/categorie/${category}`),
          lastModified: latestUpdate || now,
          changeFrequency: 'daily' as const,
          priority: 0.7,
        }
      } catch {
        return {
          url: absoluteUrl(`/categorie/${category}`),
          lastModified: now,
          changeFrequency: 'daily' as const,
          priority: 0.7,
        }
      }
    }),
  )

  const productEntries = await getProductSitemapEntries()

  return [
    {
      url: absoluteUrl('/'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: absoluteUrl('/deals'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: absoluteUrl('/a-propos'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...categoryEntries,
    ...productEntries.map((product) => ({
      url: absoluteUrl(`/produit/${product.id}`),
      lastModified: product.lastModified || now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
  ]
}
