// ============================================================
// Images Shopify servies par le CDN Shopify (pas par l'optimiseur Vercel)
// ============================================================
// Incident du 25/11/2026 : l'optimiseur d'images de Vercel (/_next/image)
// répond 402 (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED, quota du forfait
// épuisé). Les images déjà optimisées restaient en cache, toute nouvelle image
// était cassée (fiche et carte /packs du Pack Gamer). Décision de Gestion :
// les images de cdn.shopify.com sont redimensionnées par le CDN Shopify
// (paramètre width, WebP servi aux navigateurs qui l'acceptent), sans quota.
// Les images locales du site (public/) gardent l'optimiseur de Next.
//
// Pur, sans réseau. Testé dans images.test.ts.

const HOTE_SHOPIFY = 'cdn.shopify.com'

/** L'image vient-elle du CDN Shopify ? */
export function estImageShopify(src: string): boolean {
  try {
    const u = new URL(src)
    return u.protocol === 'https:' && u.hostname === HOTE_SHOPIFY
  } catch {
    return false
  }
}

/**
 * Loader next/image pour une image Shopify : même URL, largeur demandée.
 * La qualité n'a pas d'équivalent côté Shopify (le CDN la choisit).
 */
export function shopifyLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  const u = new URL(src)
  u.searchParams.set('width', String(Math.round(width)))
  return u.toString()
}
