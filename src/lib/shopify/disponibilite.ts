// Disponibilité EN LIGNE d'une variante : `availableForSale` de l'API
// Storefront, qui ne compte que les emplacements servant les ventes en ligne
// (aujourd'hui BodyStart Coignières). L'API Admin (`availableForSale`,
// `inventoryQuantity`, `totalInventory`) additionne tous les emplacements,
// dépôts compris (GymCoach, SDCL) : jamais pour dire « en stock » en ligne.
// Constaté le 13/10/2026 : Protein Water ON Tropical, 0 à Coignières et 11 au
// dépôt GymCoach, annoncée « in_stock » dans le flux Google et « de retour en
// stock » par l'alerte, alors que le panier la refusait.

import { shopifyFetch } from './client'
import { BODY_START_STORES } from './types'

const GET_DISPONIBILITE = /* GraphQL */ `
  query DisponibiliteEnLigne($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant { id availableForSale }
    }
  }
`

/** Taille maximale de `nodes(ids:)` côté Storefront. */
const LOT = 250

/**
 * Variante → achetable en ligne. Une variante absente de la réponse
 * (supprimée, produit non publié sur le site) est indisponible.
 */
export async function disponibiliteEnLigne(ids: string[]): Promise<Record<string, boolean>> {
  const uniques = [...new Set(ids)]
  const out: Record<string, boolean> = Object.fromEntries(uniques.map((id) => [id, false]))
  for (let i = 0; i < uniques.length; i += LOT) {
    const data = await shopifyFetch<{ nodes: ({ id?: string; availableForSale?: boolean } | null)[] }>(
      GET_DISPONIBILITE,
      { ids: uniques.slice(i, i + LOT) }
    )
    for (const n of data.nodes) if (n?.id && n.id in out) out[n.id] = n.availableForSale === true
  }
  return out
}

/** Emplacements des boutiques (Click & Collect, stock affiché sur le site) : jamais un dépôt. */
export const EMPLACEMENTS_BOUTIQUES: ReadonlySet<string> = new Set(
  BODY_START_STORES.filter((s) => s.isActive).map((s) => s.shopifyLocationId)
)
