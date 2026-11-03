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

export interface EtatEnLigne {
  /** Variante lue par l'API Storefront : son produit est publié sur le site. */
  publiee: boolean
  /** Achetable en ligne (emplacements des ventes en ligne seulement). */
  disponible: boolean
}

/**
 * Variante → publiée sur le site, achetable en ligne. Une variante absente de
 * la réponse (supprimée, produit non publié sur le site) n'est ni l'un ni l'autre.
 */
export async function etatEnLigne(ids: string[]): Promise<Record<string, EtatEnLigne>> {
  const uniques = [...new Set(ids)]
  const out: Record<string, EtatEnLigne> = Object.fromEntries(
    uniques.map((id) => [id, { publiee: false, disponible: false }])
  )
  for (let i = 0; i < uniques.length; i += LOT) {
    const data = await shopifyFetch<{ nodes: ({ id?: string; availableForSale?: boolean } | null)[] }>(
      GET_DISPONIBILITE,
      { ids: uniques.slice(i, i + LOT) }
    )
    for (const n of data.nodes) {
      if (n?.id && n.id in out) out[n.id] = { publiee: true, disponible: n.availableForSale === true }
    }
  }
  return out
}

/** Variante → achetable en ligne (false si absente du site). */
export async function disponibiliteEnLigne(ids: string[]): Promise<Record<string, boolean>> {
  const etat = await etatEnLigne(ids)
  return Object.fromEntries(Object.entries(etat).map(([id, e]) => [id, e.disponible]))
}

/** Emplacements des boutiques (Click & Collect, stock affiché sur le site) : jamais un dépôt. */
export const EMPLACEMENTS_BOUTIQUES: ReadonlySet<string> = new Set(
  BODY_START_STORES.filter((s) => s.isActive).map((s) => s.shopifyLocationId)
)
