import { NextResponse } from 'next/server'
import { getProducts } from '@/lib/shopify'
import { familyOf, isAutoPromotable } from '@/lib/merchandising'
import { idNumerique } from '@/lib/paliers'
import { lirePaliers } from '@/lib/paliers/serveur'
import { variantesCadeaux } from '@/lib/paliers/suggestion'
import type { ShopifyProduct } from '@/lib/shopify/types'

// Cross-sell du panier (« Complète ta commande ») — best-sellers publiés en
// ligne. Fetché EN LAZY par le CartDrawer à la 1re ouverture du panier (rien
// dans le bundle initial ni le layout → CWV préservés). Réponse cachée au CDN.
//
// PARTI PRIS CONVERSION : on ne retient QUE les produits MONO-VARIANTE et
// achetables → ajout rapide direct dans le panier, SANS jamais faire sortir le
// client du tunnel d'achat (pas de « choisir une saveur » qui ferme le panier).
// Ça écarte aussi de facto tout risque de désync saveur/variante. On balaie
// large (60 best-sellers) pour avoir assez de candidats mono-variante.
// Marques exclues des blocs automatiques retirées ; chaque article porte sa
// famille, le tiroir écarte celles déjà présentes au panier (lib/merchandising).
//
// `petits` (28/11/2026) : articles peu chers pour la suggestion « petit ajout »
// sous les paliers (lib/paliers/suggestion), mêmes règles, sans boisson ni
// canette, sans aucun cadeau d'une période en cours ou à venir. `cadeaux` :
// ces variantes cadeaux (métachamp public), null si illisible : le tiroir ne
// suggère alors rien.

/** Prix maximal d'un « petit » article (écart max 15 € pour un cadeau). */
const PRIX_MAX_PETIT = 30

const monoVarianteEnStock = (p: ShopifyProduct) => {
  const vs = p.variants?.nodes ?? []
  return vs.length === 1 && vs[0]?.availableForSale === true
}

const versArticle = (p: ShopifyProduct) => ({
  handle: p.handle,
  title: p.title,
  image: p.featuredImage?.url ?? null,
  price: p.priceRange.minVariantPrice.amount,
  currency: p.priceRange.minVariantPrice.currencyCode,
  variantId: p.variants.nodes[0].id, // toujours défini (mono-variante filtrée avant)
  family: familyOf(p),
  productId: idNumerique(p.id),
})

export async function GET() {
  try {
    const [{ nodes }, bas, paliers] = await Promise.all([
      getProducts({ first: 60, sortKey: 'BEST_SELLING' }),
      getProducts({ first: 80, sortKey: 'PRICE', query: 'available_for_sale:true' }).catch(() => null),
      lirePaliers().catch(() => null),
    ])

    const items = nodes
      .filter((p) => {
        if (p.productType === 'Pack') return false // pack = alternative, pas un complément
        if (!isAutoPromotable(p)) return false
        return monoVarianteEnStock(p)
      })
      .map(versArticle)
      .slice(0, 12)

    const cadeaux = paliers ? variantesCadeaux(paliers.periodes, new Date()) : null
    const petits =
      cadeaux && bas
        ? bas.nodes
            .filter((p) => {
              if (!monoVarianteEnStock(p) || !isAutoPromotable(p)) return false
              const famille = familyOf(p)
              if (famille === 'pack' || famille === 'boisson' || /canette/i.test(p.title)) return false
              if (cadeaux.has(p.variants.nodes[0].id)) return false
              const prix = Number(p.priceRange.minVariantPrice.amount)
              return prix > 0 && prix <= PRIX_MAX_PETIT
            })
            .map(versArticle)
            .slice(0, 30)
        : []

    return NextResponse.json(
      { items, petits, cadeaux: cadeaux ? [...cadeaux] : null },
      // Cache au CDN (s-maxage) mais PAS dans le navigateur (max-age=0) : le
      // client récupère toujours une liste fraîche (best-sellers / stock à jour)
      // sans re-taper Shopify à chaque fois — le CDN sert sa copie 5 min.
      { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=600' } }
    )
  } catch {
    // Shopify indisponible / pas de clés → section masquée côté front.
    return NextResponse.json({ items: [], petits: [], cadeaux: null })
  }
}
