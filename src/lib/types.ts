export type { Retailer, SupportedCategory } from './catalog'

import type { Retailer, SupportedCategory } from './catalog'

export interface ScrapedOffer {
  retailer: Retailer
  sourceProductId?: string
  sourceUrl: string
  sourceCategoryPath?: string
  category: SupportedCategory
  name: string
  brand?: string
  price: number
  image: string
  description?: string
  availability?: string
  quantity?: string
  unitPrice?: string
  originalPrice?: number
  isOnPromotion?: boolean
  discount?: number
}

export interface ValidatedOffer extends ScrapedOffer {
  id: string
  sourceProductId: string
  price: number
  sourceUrl: string
}

export interface RetailerOfferCard {
  id: string
  productId: string
  retailer: Retailer
  name: string
  category: SupportedCategory
  brand?: string
  price: number
  url: string
  image: string
  description?: string
  availability?: string
  quantity?: string
  unitPrice?: number
  unitPriceLabel?: string
  originalPrice?: number
  isOnPromotion?: boolean
  discount?: number
  lastUpdated?: string | null
}

export interface OfferValidationReport {
  retailer: Retailer
  rawCount: number
  validatedCount: number
  rejectedCount: number
  rejectedReasons: Record<string, number>
  categoryCounts: Record<SupportedCategory, number>
}

export interface ScrapePipelineResult {
  offers: ValidatedOffer[]
  report: OfferValidationReport
}
