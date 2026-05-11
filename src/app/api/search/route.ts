import { NextRequest, NextResponse } from 'next/server'

import { runSearch } from '@/lib/search-service'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  const response = await runSearch({
    query: searchParams.get('query') || '',
    category: searchParams.get('category'),
    retailer: searchParams.get('retailer'),
    minPrice: searchParams.get('minPrice'),
    maxPrice: searchParams.get('maxPrice'),
    sort: searchParams.get('sort'),
  })

  return NextResponse.json(response)
}
