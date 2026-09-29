// ============================================================
// Variante affichée à l'ouverture d'une fiche produit
// ============================================================
// 1. Lien avec ?variant=<ID numérique> (pubs dynamiques Meta, canal Facebook &
//    Instagram, redirection de la boutique myshopify) : CETTE variante, même
//    épuisée, pour montrer ce que la pub montrait.
// 2. Sinon la première variante disponible (avant le 29/09/2026 : toujours la
//    première, même épuisée ; YEAAH EAA s'ouvrait sur Fruit Punch en rupture
//    alors que Tropical et Watermelon étaient en stock).
// Les packs gardent leur règle (pickInitialBundleVariant, lib/shopify/bundle) ;
// seules leurs variantes complètes peuvent être choisies par ?variant=.

interface VariantLike {
  id: string
  availableForSale: boolean
}

/** Première variante disponible, sinon la première (undefined si la liste est vide). */
export function pickDefaultVariant<T extends VariantLike>(variants: T[]): T | undefined {
  return variants.find((v) => v.availableForSale) ?? variants[0]
}

/**
 * Variante désignée par ?variant=<ID numérique> dans une chaîne de recherche
 * (ex. window.location.search), si elle fait partie de la liste.
 */
export function variantFromSearch<T extends { id: string }>(
  variants: T[],
  search: string | null | undefined
): T | undefined {
  if (!search) return undefined
  let wanted: string | null
  try {
    wanted = new URLSearchParams(search).get('variant')
  } catch {
    return undefined
  }
  wanted = wanted?.trim() ?? null
  if (!wanted || !/^\d+$/.test(wanted)) return undefined
  // GID Shopify : gid://shopify/ProductVariant/<ID numérique>
  return variants.find((v) => v.id.split('/').pop() === wanted)
}

/**
 * Image de galerie à montrer en premier. On garde l'image principale (index 0,
 * comme avant) tant que la fiche s'ouvre sur la première variante ; sinon
 * l'image dédiée de la variante d'ouverture, si elle existe dans la galerie.
 */
export function initialImageIndex(
  images: { url: string }[],
  variants: { id: string }[],
  opening: { id: string; image?: { url: string } | null } | undefined
): number {
  const url = opening?.image?.url
  if (!opening || !url || opening.id === variants[0]?.id) return 0
  const i = images.findIndex((img) => img.url === url)
  return i >= 0 ? i : 0
}
