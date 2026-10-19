// Mode saison, côté serveur : metafield boutique `bodystart.saison` (Storefront),
// relu toutes les 15 minutes au plus (règle de Claude Gestion du 19/10/2026).
// La période active est recalculée dans le navigateur à l'heure pile
// (components/layout/Header), le cache ne retarde donc pas les bascules.

import { unstable_cache } from 'next/cache'
import { lireSaison, type PeriodeSaison } from '@/lib/saison'
import { shopifyFetch } from './client'
import { withCardPrice } from './index'
import { GET_COLLECTION_CARTES } from './queries/collections'
import type { ShopifyProduct } from './types'

const GET_SAISON = `query Saison { shop { metafield(namespace: "bodystart", key: "saison") { value } } }`

/** Une erreur n'est pas mise en cache (elle remonte) : la saison revient au prochain essai. */
const saisonEnCache = unstable_cache(
  async (): Promise<PeriodeSaison[]> => {
    const data = await shopifyFetch<{ shop: { metafield: { value: string } | null } }>(GET_SAISON)
    return lireSaison(data.shop.metafield?.value ?? null)
  },
  ['saison-v1'],
  { revalidate: 900 }
)

/** Périodes du mode saison ; aucune si Shopify ne répond pas (site normal). */
export async function getSaison(): Promise<PeriodeSaison[]> {
  try {
    return await saisonEnCache()
  } catch {
    return []
  }
}

/** Produits d'une collection au format carte (packs de la sélection de saison). */
export async function getCartesCollection(handle: string, first = 12): Promise<ShopifyProduct[]> {
  try {
    const data = await shopifyFetch<{ collection: { products: { nodes: ShopifyProduct[] } } | null }>(
      GET_COLLECTION_CARTES,
      { handle, first }
    )
    return (data.collection?.products.nodes ?? []).map(withCardPrice)
  } catch {
    return []
  }
}
