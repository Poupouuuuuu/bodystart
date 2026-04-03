import type { Metadata } from 'next'
import { getProducts, getCollections } from '@/lib/shopify'
import type { ShopifyCollection } from '@/lib/shopify/types'
import ProductsPageClient from '@/components/product/ProductsPageClient'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Tous les produits',
  description: 'Découvrez toute la gamme Body Start Nutrition : protéines, vitamines, créatine, BCAA et plus.',
}

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

  return <ProductsPageClient products={products} collections={collections} />
}
