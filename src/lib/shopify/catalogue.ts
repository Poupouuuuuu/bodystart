import { cache } from 'react'
import { getProducts, getCollections, getInventoryForVariants } from '@/lib/shopify'
import { BODY_START_STORES, type ShopifyCollection, type ShopifyProduct } from '@/lib/shopify/types'
import { estPackCatalogue, vedettesDabord } from '@/lib/catalogue'
import { handlesVedettes } from '@/lib/shopify/vedettes'
import { offresDesCartes } from '@/lib/offres-cartes'

export interface Catalogue {
  products: ShopifyProduct[]
  collections: ShopifyCollection[]
  /** Stock total à Coignières par productId (badge « Plus que X en stock »). */
  stockByProductId: Record<string, number>
}

/**
 * Données de « Tous les produits », partagées par /products et ses pages
 * /products/page/N (SEO 2). Sans API : listes vides, la page s'affiche quand
 * même.
 */
export const getCatalogue = cache(async (): Promise<Catalogue> => {
  let products: ShopifyProduct[] = []
  let collections: ShopifyCollection[] = []
  try {
    const [result, cols, vedettes] = await Promise.all([
      // first:250 = tout le catalogue en une seule requete.
      // BEST_SELLING = classement reel des ventes Shopify (caisse POS incluse,
      // 99 % du CA) : le tri par defaut « Meilleures ventes » affiche les vrais
      // best-sellers en tete (decision Adam 2026-07). Le tri client
      // « Nouveautes » repose sur le champ createdAt.
      // offres : pastille « Offerte dès … » du cadeau des paliers en cours.
      getProducts({ first: 250, sortKey: 'BEST_SELLING', offres: offresDesCartes() }),
      getCollections(50),
      // Vedettes de l'accueil : en tête de la vue par défaut (lib/catalogue).
      handlesVedettes(),
    ])
    // Exclut les packs (type « Pack ») de "Tous les produits" : ils ont leur
    // propre page /packs. Avant (SEO 2) : aussi tout produit tagué « pack »,
    // donc Hit Pack Complex (multivitamines en sachets) n'était nulle part.
    // Puis vedettes de l'accueil en stock en tête, le reste par meilleures
    // ventes : même liste pour /products et /products/page/N.
    products = vedettesDabord(
      result.nodes.filter((p) => !estPackCatalogue(p)),
      vedettes
    )
    // Retire aussi la collection "Packs" de la barre de categories pour ne
    // pas laisser un filtre qui mene a une grille vide.
    collections = cols.filter((c) => c.handle !== 'packs')
  } catch {
    // Fallback sans API
  }

  // Stock boutique Coignieres pour le badge stock bas des cartes. Si echec :
  // on continue sans, les badges ne s'affichent pas.
  const stockByProductId: Record<string, number> = {}
  const activeStore = BODY_START_STORES.find((s) => s.isActive)
  if (activeStore?.shopifyLocationId && products.length > 0) {
    try {
      const allVariantIds = products.flatMap((p) => p.variants.nodes.map((v) => v.id))
      const inventory = await getInventoryForVariants(allVariantIds, activeStore.shopifyLocationId)
      for (const p of products) {
        stockByProductId[p.id] = p.variants.nodes.reduce((sum, v) => sum + (inventory[v.id] ?? 0), 0)
      }
    } catch (err) {
      console.error('[Catalogue] batch inventory fetch failed:', err)
    }
  }

  return { products, collections, stockByProductId }
})
