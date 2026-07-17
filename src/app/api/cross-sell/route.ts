import { NextResponse } from 'next/server'
import { getProducts } from '@/lib/shopify'

// Cross-sell du panier (« Complète ta commande ») — best-sellers publiés en
// ligne. Fetché EN LAZY par le CartDrawer à la 1re ouverture du panier (rien
// dans le bundle initial ni le layout → CWV préservés). Réponse cachée au CDN.
//
// PARTI PRIS CONVERSION : on ne retient QUE les produits MONO-VARIANTE et
// achetables → ajout rapide direct dans le panier, SANS jamais faire sortir le
// client du tunnel d'achat (pas de « choisir une saveur » qui ferme le panier).
// Ça écarte aussi de facto tout risque de désync saveur/variante. On balaie
// large (40 best-sellers) pour avoir assez de candidats mono-variante.
export async function GET() {
  try {
    const { nodes } = await getProducts({ first: 40, sortKey: 'BEST_SELLING' })

    const items = nodes
      .filter((p) => {
        if (p.productType === 'Pack') return false // pack = alternative, pas un complément
        const vs = p.variants?.nodes ?? []
        return vs.length === 1 && vs[0]?.availableForSale === true
      })
      .map((p) => ({
        handle: p.handle,
        title: p.title,
        image: p.featuredImage?.url ?? null,
        price: p.priceRange.minVariantPrice.amount,
        currency: p.priceRange.minVariantPrice.currencyCode,
        variantId: p.variants.nodes[0].id, // toujours défini (mono-variante filtrée ci-dessus)
      }))
      .slice(0, 8)

    return NextResponse.json(
      { items },
      // Cache au CDN (s-maxage) mais PAS dans le navigateur (max-age=0) : le
      // client récupère toujours une liste fraîche (best-sellers / stock à jour)
      // sans re-taper Shopify à chaque fois — le CDN sert sa copie 5 min.
      { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600' } }
    )
  } catch {
    // Shopify indisponible / pas de clés → section masquée côté front.
    return NextResponse.json({ items: [] })
  }
}
