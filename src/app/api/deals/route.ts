import { NextRequest, NextResponse } from 'next/server'

import { isSupportedCategory } from '@/lib/catalog'
import { buildDealsApiResponse, loadDealsFeed } from '@/lib/deals-feed'

export const dynamic = 'force-dynamic'

function parseLimit(value: string | null) {
  const parsed = Number.parseInt(value || '', 10)
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 120
  }

  return Math.min(parsed, 500)
}

function parseCategory(value: string | null) {
  return isSupportedCategory(value) ? value : null
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query')
  const category = parseCategory(searchParams.get('category'))
  const retailer = searchParams.get('retailer')
  const limit = parseLimit(searchParams.get('limit'))
  const feed = await loadDealsFeed({
    query,
    category,
    retailer,
    limit,
    liveScrape: false,
    persistLive: false,
  })

  return NextResponse.json(buildDealsApiResponse(feed))
}
