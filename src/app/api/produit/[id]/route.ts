import { NextRequest, NextResponse } from 'next/server'

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

    return NextResponse.json({ offer })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
