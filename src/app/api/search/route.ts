import { NextRequest, NextResponse } from 'next/server'
import { rechercherProduits } from '@/lib/shopify/recherche'
import { cardPriceOf } from '@/lib/product-price'

// Lit les query params → forcer le rendu dynamique pour éviter le warning au build
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const q = req.nextUrl.searchParams.get('q')?.trim()

    if (!q || q.length < 2) {
      return NextResponse.json({ results: [], total: 0 })
    }

    // Moteur du site (lib/recherche) : 12 fiches, et le total pour le lien
    // « Voir les N résultats ».
    const { resultats, total } = await rechercherProduits(q, 12)

    // Même prix que les cartes du catalogue (lib/product-price).
    const results = resultats.map(({ produit: p, varianteId, varianteTitre }) => {
      const prix = cardPriceOf(p)
      const price = prix?.price ?? p.priceRange.minVariantPrice
      return {
        id: p.id,
        handle: p.handle,
        title: p.title,
        image: p.featuredImage?.url ?? null,
        price: price.amount,
        currency: price.currencyCode,
        from: prix?.from ?? false,
        availableForSale: p.availableForSale ?? true,
        // Parfum ou format demandé : la fiche s'ouvre dessus (?variant=).
        variantId: varianteId,
        variantTitle: varianteTitre,
      }
    })

    return NextResponse.json(
      { results, total },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    )
  } catch (error) {
    console.error('[Search API] Erreur:', error)
    return NextResponse.json({ results: [], total: 0, error: 'Erreur serveur.' }, { status: 500 })
  }
}
