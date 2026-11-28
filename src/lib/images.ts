// ============================================================
// Images Shopify servies par le CDN Shopify (pas par l'optimiseur Vercel)
// ============================================================
// Incident du 25/11/2026 : l'optimiseur d'images de Vercel (/_next/image)
// répond 402 (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED, quota du forfait
// épuisé). Les images déjà optimisées restaient en cache, toute nouvelle image
// était cassée (fiche et carte /packs du Pack Gamer). Décision de Gestion :
// les images de cdn.shopify.com sont redimensionnées par le CDN Shopify
// (paramètre width, WebP servi aux navigateurs qui l'acceptent), sans quota.
// Les images locales du site (public/) étaient servies telles quelles
// (components/ui/Image, extension décidée par Gestion le même soir) ; les
// photos ont des variantes à largeurs fixes depuis le 28/11 (plus bas).
//
// Pur, sans réseau. Testé dans images.test.ts.

import { IMAGES_LOCALES } from './images-locales'

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

// ============================================================
// Photos locales (public/) en variantes WebP à largeurs fixes
// ============================================================
// Depuis le 25/11/2026 les images locales partaient telles quelles : un
// téléphone téléchargeait la photo entière (LCP de l'accueil à 5,3 s le 27/11).
// scripts/images-tailles.mjs écrit des variantes dans public/tailles/
// (/boutique/x.webp -> /tailles/boutique/x-640.webp) et le manifeste
// lib/images-locales.ts. next/image construit alors son srcset avec
// localLoader, sans /_next/image. Hors manifeste : servie telle quelle.

/** Largeur de variante pour une largeur demandée : la plus petite qui suffit, sinon la plus grande. */
export function choisirLargeur(largeurs: readonly number[], demandee: number): number | null {
  if (largeurs.length === 0) return null
  let plusGrande = largeurs[0]
  let meilleure: number | null = null
  for (const l of largeurs) {
    if (l > plusGrande) plusGrande = l
    if (l >= demandee && (meilleure === null || l < meilleure)) meilleure = l
  }
  return meilleure ?? plusGrande
}

/** Largeurs disponibles pour une photo locale, ou undefined si elle n'a pas de variantes. */
export function largeursLocales(
  src: string,
  manifeste: Readonly<Record<string, readonly number[]>> = IMAGES_LOCALES
): readonly number[] | undefined {
  return Object.prototype.hasOwnProperty.call(manifeste, src) ? manifeste[src] : undefined
}

/** URL de la variante pour une photo locale du manifeste, ou null si elle n'en a pas. */
export function varianteLocale(
  src: string,
  largeur: number,
  manifeste: Readonly<Record<string, readonly number[]>> = IMAGES_LOCALES
): string | null {
  const largeurs = largeursLocales(src, manifeste)
  if (!largeurs) return null
  const l = choisirLargeur(largeurs, largeur)
  if (l === null) return null
  const point = src.lastIndexOf('.')
  return `/tailles${src.slice(0, point)}-${l}.webp`
}

/** Loader next/image pour une photo locale du manifeste (la qualité est fixée au script). */
export function localLoader({ src, width }: { src: string; width: number; quality?: number }): string {
  return varianteLocale(src, width) ?? src
}
