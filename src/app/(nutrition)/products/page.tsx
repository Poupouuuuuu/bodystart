import type { Metadata } from 'next'
import { getProducts, getCollections, getInventoryForVariants } from '@/lib/shopify'
import { BODY_START_STORES, type ShopifyCollection } from '@/lib/shopify/types'
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

export default async function ProductsPage() {
  let products: import('@/lib/shopify/types').ShopifyProduct[] = []
  let collections: ShopifyCollection[] = []
  try {
    const [result, cols] = await Promise.all([
      getProducts({ first: 250 }),
      getCollections(50),
    ])
    products = result.nodes
    collections = cols
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
