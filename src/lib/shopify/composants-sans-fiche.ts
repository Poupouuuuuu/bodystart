// Composants d'un lot (pack, coffret) qui n'ont pas de fiche sur le site :
// vendus seulement en caisse (publiés sur le Point de vente, pas sur le
// site). La bande « Dans ce pack » les affiche par leur nom, sans lien : avant
// le 19/10/2026, ce lien menait à une 404 (créatine PER4M 400 g du Pack
// Débutant, sirop Zero PER4M du Pack Petit-déjeuner).
//
// Les composants d'une variante sont renvoyés même non publiés ; `nodes(ids:)`
// ne renvoie, lui, que les produits publiés sur le site, comme
// getProductByHandle pour la fiche elle-même. Serveur uniquement.

import { getExpectedComponentProductIds } from './bundle'
import { shopifyFetch } from './client'
import type { ShopifyProductVariant } from './types'

const GET_FICHES = /* GraphQL */ `
  query FichesComposants($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product { id }
    }
  }
`

/** Handles des produits sans fiche, d'après les ids publiés renvoyés par Shopify. */
export function handlesSansFiche(variants: ShopifyProductVariant[], publies: Set<string>): string[] {
  const handles = new Set<string>()
  for (const v of variants) {
    for (const c of v.components?.nodes ?? []) {
      const p = c.productVariant?.product
      if (p?.id && p.handle && !publies.has(p.id)) handles.add(p.handle)
    }
  }
  return Array.from(handles)
}

/**
 * Handles des composants sans fiche sur le site. Shopify injoignable : liste
 * vide, donc liens conservés (comportement d'avant).
 */
export async function composantsSansFiche(variants: ShopifyProductVariant[]): Promise<string[]> {
  const ids = getExpectedComponentProductIds(variants)
  if (ids.length === 0) return []
  try {
    const data = await shopifyFetch<{ nodes: ({ id?: string } | null)[] }>(GET_FICHES, { ids })
    const publies = new Set(data.nodes.flatMap((n) => (n?.id ? [n.id] : [])))
    return handlesSansFiche(variants, publies)
  } catch (err) {
    console.error('[composants-sans-fiche] lecture en échec :', err)
    return []
  }
}
