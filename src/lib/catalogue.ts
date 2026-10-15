// Catalogue « Tous les produits » découpé en pages (SEO 2, maillage).
//
// /products affiche 12 cartes dans le HTML puis « Voir plus » en JavaScript :
// sans JS (et pour un robot qui ne clique pas), 12 produits sur 114 avaient
// un lien. Les pages /products/page/2, /3… reprennent la même liste, dans le
// même ordre que la vue par défaut du catalogue, 12 par page, rendues côté
// serveur avec leur propre canonical.
//
// Chemin plutôt que ?page=2 : lire la requête rendrait /products dynamique
// (plus de cache CDN, Shopify appelé à chaque visite). /products/page/N reste
// en ISR comme /products.
//
// Pur, sans réseau. Testé dans catalogue.test.ts.

import { availableFirst } from '@/lib/product-order'

export const PAR_PAGE = 12

/** Un pack (variante à composants vendue à part, page /packs), pas un produit tagué « pack ». */
export function estPackCatalogue(p: { productType?: string | null }): boolean {
  return (p.productType ?? '').trim().toLowerCase() === 'pack'
}

/** Ordre de la vue par défaut de /products : meilleures ventes, épuisés en fin de liste. */
export function ordreCatalogue<T extends { availableForSale?: boolean }>(produits: T[]): T[] {
  return availableFirst(produits)
}

export function nombreDePages(total: number): number {
  return Math.max(1, Math.ceil(total / PAR_PAGE))
}

/** Produits de la page `n` (1 = /products), ou null si la page n'existe pas. */
export function pageCatalogue<T>(produits: T[], n: number): T[] | null {
  if (!Number.isInteger(n) || n < 1 || n > nombreDePages(produits.length)) return null
  return produits.slice((n - 1) * PAR_PAGE, n * PAR_PAGE)
}

export function lienPage(n: number): string {
  return n <= 1 ? '/products' : `/products/page/${n}`
}

/** « 2 » → 2 ; « 02 », « 1 », « 2.5 », « abc » → null (une seule URL par page). */
export function numeroDePage(brut: string): number | null {
  if (!/^[1-9]\d*$/.test(brut)) return null
  const n = Number(brut)
  return n >= 2 ? n : null
}
