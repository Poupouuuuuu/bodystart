// Recherche du site, côté serveur : index du catalogue (Storefront, donc
// seulement les fiches publiées sur le site : la réserve n'y est jamais) mis
// en cache, puis moteur pur de lib/recherche.

import { unstable_cache } from 'next/cache'
import { rechercherDetail, type VarianteRecherchable } from '@/lib/recherche'
import { shopifyFetch } from './client'
import { withCardPrice } from './index'
import { INDEX_RECHERCHE } from './queries/products'
import type { ShopifyProduct } from './types'

type FicheIndex = ShopifyProduct & { variantes: VarianteRecherchable[] }
type FicheBrute = ShopifyProduct & { variantes?: { nodes: VarianteRecherchable[] } }

type Page = {
  products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: FicheBrute[] }
}

/** Tout le catalogue publié, meilleures ventes d'abord (pages de 250, 4 au plus). */
async function chargerIndex(): Promise<FicheIndex[]> {
  const out: FicheIndex[] = []
  let after: string | null = null
  for (let page = 0; page < 4; page++) {
    const data: Page = await shopifyFetch(INDEX_RECHERCHE, { first: 250, after })
    for (const p of data.products.nodes) {
      out.push({ ...withCardPrice(p), variantes: p.variantes?.nodes ?? [] })
    }
    if (!data.products.pageInfo.hasNextPage) break
    after = data.products.pageInfo.endCursor
  }
  return out
}

/** Index partagé par /api/search et /search, renouvelé toutes les 10 minutes. */
const indexEnCache = unstable_cache(chargerIndex, ['recherche-index-v2'], { revalidate: 600 })

/** Fiche trouvée, et la variante demandée (« whey vanille » → Vanille / 1 kg). */
export interface ResultatRecherche {
  produit: ShopifyProduct
  /** Numéro de la variante pour ?variant= (pas le gid), null sans parfum demandé. */
  varianteId: string | null
  varianteTitre: string | null
}

/** Les `limite` premières fiches et le nombre total de fiches trouvées. */
export async function rechercherProduits(
  q: string,
  limite: number
): Promise<{ resultats: ResultatRecherche[]; total: number }> {
  const tous = rechercherDetail(await indexEnCache(), q)
  return {
    resultats: tous.slice(0, limite).map(({ produit, variante }) => {
      // Ni la description ni la liste des variantes ne partent au navigateur.
      const { variantes: _v, description: _d, ...fiche } = produit
      return {
        produit: fiche,
        varianteId: variante ? variante.id.split('/').pop() ?? null : null,
        varianteTitre: variante?.title ?? null,
      }
    }),
    total: tous.length,
  }
}
