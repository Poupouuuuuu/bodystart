/**
 * Avis produits — plomberie « avis-ready » pour le JSON-LD Product.
 *
 * RÈGLE D'OR (Google) : tant qu'il n'existe AUCUNE vraie source d'avis,
 * on n'émet RIEN (ni aggregateRating, ni review). Une note inventée ou
 * non vérifiable = pénalité résultats enrichis.
 *
 * Le jour où une source existe, il suffit d'implémenter ce helper —
 * le Product JSON-LD (fiches produit) consomme déjà sa sortie :
 *   - Judge.me : GET https://judge.me/api/v1/widgets/product_review
 *     (JUDGEME_SHOP_DOMAIN + JUDGEME_PUBLIC_TOKEN) → rating + count par handle.
 *   - Google Avis Clients / autre app Shopify : metafields reviews.rating_count
 *     et reviews.rating à exposer via le fragment produit Storefront.
 */

export interface ProductRating {
  ratingValue: number // ex. 4.6
  reviewCount: number // ex. 12 — JAMAIS 0 (ne rien émettre dans ce cas)
}

export async function getProductRating(_handle: string): Promise<ProductRating | null> {
  // Aucune source d'avis branchée à ce jour → on n'émet rien (voir doc ci-dessus).
  return null
}

/** Fragment aggregateRating prêt à spreader dans le Product JSON-LD. */
export function buildAggregateRating(rating: ProductRating | null) {
  if (!rating || rating.reviewCount <= 0) return {}
  return {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: rating.ratingValue,
      reviewCount: rating.reviewCount,
      bestRating: 5,
      worstRating: 1,
    },
  }
}
