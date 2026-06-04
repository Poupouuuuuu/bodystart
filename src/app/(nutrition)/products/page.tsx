import type { Metadata } from 'next'
import { getProducts, getCollections, getInventoryForVariants } from '@/lib/shopify'
import { BODY_START_STORES, type ShopifyCollection, type ShopifyProduct } from '@/lib/shopify/types'
import { isPackProduct } from '@/lib/shopify/bundle'
import ProductsPageClient from '@/components/product/ProductsPageClient'
import { buildPageMetadata } from '@/lib/seo'

// 60s : compromis entre fraicheur stock et limite rate Shopify Admin.
// Pour 57+ produits avec fetch batch d'inventaire, on cache 1 min.
export const revalidate = 60

export const metadata: Metadata = buildPageMetadata({
  path: '/products',
  title: 'Tous les produits',
  description: 'Découvrez toute la gamme BodyStart Nutrition : protéines, vitamines, créatine, BCAA et plus.',
})

// Ordre d'affichage metier fixe, base sur le champ natif Shopify `productType`
// (expose via Storefront API). La Storefront API ne sait pas trier par
// productType : on recupere donc TOUS les produits en une requete deja
// triee createdAt desc, puis on trie cote JS. A rang egal, l'ordre
// createdAt desc est conserve (Array.prototype.sort est stable).
const CATEGORY_ORDER: Record<string, number> = {
  'Protéines': 1,
  'Glucides': 2,
  'Créatine': 3,
  'Pré-workout': 4,
  'Acides aminés': 5,
  'Brûleur': 6,
  'Boosters': 7,
  'Santé': 8,
  'Snacks': 9,
  'Pack': 10,
}
const categoryRank = (p: ShopifyProduct): number => CATEGORY_ORDER[p.productType ?? ''] ?? 99

export default async function ProductsPage() {
  let products: ShopifyProduct[] = []
  let collections: ShopifyCollection[] = []
  try {
    const [result, cols] = await Promise.all([
      // first:250 = tout le catalogue (~60 produits) en une seule requete.
      // sortKey CREATED_AT + reverse => plus recent en premier, ce qui fixe
      // l'ordre intra-categorie une fois le tri par categorie applique.
      getProducts({ first: 250, sortKey: 'CREATED_AT', reverse: true }),
      getCollections(50),
    ])
    // Exclut les packs (bundles) de "Tous les produits" : ils ont leur
    // propre page /packs. Filtre par productType "Pack" OU tag "pack".
    // (Scope local a cette page : la home et /packs gardent les packs.)
    products = result.nodes.filter((p) => !isPackProduct(p))
    // Tri metier par categorie (ordre fixe ci-dessus). Sort stable => a rang
    // egal, conserve l'ordre createdAt desc issu du fetch. La pagination
    // "Voir plus" cote client s'applique ensuite, APRES ce tri.
    products.sort((a, b) => categoryRank(a) - categoryRank(b))
    // Retire aussi la collection "Packs" de la barre de categories pour ne
    // pas laisser un filtre qui mene a une grille vide.
    collections = cols.filter((c) => c.handle !== 'packs')
  } catch {
    // Fallback sans API
  }

  // Fetch batch inventaire boutique Coignieres pour badge stock bas
  // (Plus que X en stock - cf. ProductsPageClient ProductCardShop).
  // Si echec : on continue sans le data, les badges stock bas ne s'affichent pas.
  const stockByProductId: Record<string, number> = {}
  const activeStore = BODY_START_STORES.find((s) => s.isActive)
  if (activeStore?.shopifyLocationId && products.length > 0) {
    try {
      const allVariantIds = products.flatMap((p) => p.variants.nodes.map((v) => v.id))
      const inventory = await getInventoryForVariants(allVariantIds, activeStore.shopifyLocationId)
      for (const p of products) {
        const total = p.variants.nodes.reduce((sum, v) => sum + (inventory[v.id] ?? 0), 0)
        stockByProductId[p.id] = total
      }
    } catch (err) {
      console.error('[ProductsPage] batch inventory fetch failed:', err)
    }
  }

  return (
    <ProductsPageClient
      products={products}
      collections={collections}
      stockByProductId={stockByProductId}
    />
  )
}
