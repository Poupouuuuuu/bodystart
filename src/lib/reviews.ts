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

import type { ShopifyMetafield } from '@/lib/shopify/types'

/**
 * Note produit lue dans les metafields STANDARD Shopify `reviews.rating`
 * (JSON { scale_min, scale_max, value }) et `reviews.rating_count`, que
 * Judge.me, Loox ou l'app Avis de Shopify écrivent automatiquement. Tant
 * qu'aucune app n'est installée, les metafields sont absents → null → le
 * JSON-LD n'émet rien et la fiche garde la note Google de la boutique.
 */
export function ratingFromMetafields(metafields?: (ShopifyMetafield | null)[] | null): ProductRating | null {
  if (!metafields) return null
  const get = (key: string) => metafields.find((m) => m && m.namespace === 'reviews' && m.key === key)?.value
  const rawRating = get('rating')
  const rawCount = get('rating_count')
  if (!rawRating || !rawCount) return null
  const reviewCount = parseInt(rawCount, 10)
  let value = NaN
  try {
    const parsed = JSON.parse(rawRating) as { value?: string | number }
    value = parseFloat(String(parsed.value ?? ''))
  } catch {
    value = parseFloat(rawRating)
  }
  if (!Number.isFinite(value) || !Number.isFinite(reviewCount) || reviewCount <= 0) return null
  return { ratingValue: Math.round(value * 10) / 10, reviewCount }
}

/** @deprecated conservé pour compatibilité : préférer ratingFromMetafields(product.metafields). */
export async function getProductRating(_handle: string): Promise<ProductRating | null> {
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
