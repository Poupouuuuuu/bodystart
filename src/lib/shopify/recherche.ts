// Recherche du site, côté serveur : index du catalogue (Storefront, donc
// seulement les fiches publiées sur le site : la réserve n'y est jamais) mis
// en cache, puis moteur pur de lib/recherche.

import { unstable_cache } from 'next/cache'
import { rechercher } from '@/lib/recherche'
import { shopifyFetch } from './client'
import { withCardPrice } from './index'
import { INDEX_RECHERCHE } from './queries/products'
import type { ShopifyProduct } from './types'

type Page = {
  products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: ShopifyProduct[] }
}

/** Tout le catalogue publié, meilleures ventes d'abord (pages de 250, 4 au plus). */
async function chargerIndex(): Promise<ShopifyProduct[]> {
  const out: ShopifyProduct[] = []
  let after: string | null = null
  for (let page = 0; page < 4; page++) {
    const data: Page = await shopifyFetch(INDEX_RECHERCHE, { first: 250, after })
    out.push(...data.products.nodes.map(withCardPrice))
    if (!data.products.pageInfo.hasNextPage) break
    after = data.products.pageInfo.endCursor
  }
  return out
}

/** Index partagé par /api/search et /search, renouvelé toutes les 10 minutes. */
const indexEnCache = unstable_cache(chargerIndex, ['recherche-index-v1'], { revalidate: 600 })

/** Les `limite` premières fiches et le nombre total de fiches trouvées. */
export async function rechercherProduits(
  q: string,
  limite: number
): Promise<{ produits: ShopifyProduct[]; total: number }> {
  const tous = rechercher(await indexEnCache(), q)
  return { produits: tous.slice(0, limite), total: tous.length }
}
