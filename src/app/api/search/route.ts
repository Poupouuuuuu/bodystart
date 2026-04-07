import { NextRequest, NextResponse } from 'next/server'
import { searchProducts } from '@/lib/shopify'

// Lit les query params → forcer le rendu dynamique pour éviter le warning au build
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q')?.trim()

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [] })
    }

    const products = await searchProducts(q, 12)

    const results = products.map((p) => ({
      id: p.id,
      handle: p.handle,
      title: p.title,
      image: p.featuredImage?.url ?? null,
      price: p.priceRange.minVariantPrice.amount,
      currency: p.priceRange.minVariantPrice.currencyCode,
    }))

    return NextResponse.json(
      { results },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    )
  } catch (error) {
    console.error('[Search API] Erreur:', error)
    return NextResponse.json({ results: [], error: 'Erreur serveur.' }, { status: 500 })
  }
}
