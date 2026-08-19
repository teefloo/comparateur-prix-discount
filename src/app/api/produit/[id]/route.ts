import { NextRequest, NextResponse } from 'next/server'

import { PRODUCT_API_CACHE_CONTROL } from '@/lib/cache-policy'
import { getDemoOfferById } from '@/lib/demo-offers'
import { getOfferById } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!id || id === 'favicon.ico') {
    return NextResponse.json({ error: 'ID requis' }, { status: 400 })
  }

  try {
    const offer = (await getOfferById(id)) || getDemoOfferById(id)

    if (!offer) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
    }

    // The response is public catalog data, never account-specific. Let the
    // CDN serve it for the same ten-minute window as the product page.
    const response = NextResponse.json({ offer })
    response.headers.set('Cache-Control', PRODUCT_API_CACHE_CONTROL)
    return response
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
