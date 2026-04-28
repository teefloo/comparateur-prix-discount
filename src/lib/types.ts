export type { Retailer, SupportedCategory } from './catalog'

import type { Retailer, SupportedCategory } from './catalog'

export type CategoryResolutionConfidence = 'high' | 'medium' | 'low' | 'fallback'
export type CategoryResolutionSource = 'native_mapping' | 'source_path' | 'tags' | 'text' | 'fallback'
export type ScrapeIssueSeverity = 'error' | 'warning'

export interface CategoryResolutionResult {
  category: SupportedCategory
  confidence: CategoryResolutionConfidence
  source: CategoryResolutionSource
  matchedSignals: string[]
  fallbackUsed: boolean
}

export interface CategoryFallbackExample {
  name: string
  sourceUrl: string
  sourceCategoryPath?: string
  matchedSignals: string[]
}

export interface ScrapedOffer {
  retailer: Retailer
  sourceProductId?: string
  sourceUrl: string
  sourceCategoryPath?: string
  category: SupportedCategory
  categoryResolution?: CategoryResolutionResult
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

export interface ScrapeIssue {
  retailer: Retailer
  code: string
  message: string
  severity?: ScrapeIssueSeverity
  url?: string
  category?: SupportedCategory
  page?: number
}

export interface RetailerCoverageReport {
  discoveredListings: number
  completedListings: number
  collectionRate: number
  isComplete: boolean
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
  categoryResolvedCount: number
  categoryFallbackCount: number
  categoryConfidenceCounts: Record<CategoryResolutionConfidence, number>
  categorySourceCounts: Record<CategoryResolutionSource, number>
  categoryFallbackExamples: CategoryFallbackExample[]
}

export interface ScrapePipelineResult {
  offers: ValidatedOffer[]
  report: OfferValidationReport
}

export interface RetailerScrapeDetails {
  retailer: Retailer
  offers: ScrapedOffer[]
  issues: ScrapeIssue[]
  coverage: RetailerCoverageReport
}
