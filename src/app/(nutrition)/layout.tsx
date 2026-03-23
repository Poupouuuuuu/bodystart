import { Suspense } from 'react'

export const revalidate = 3600
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/cart/CartDrawer'
import BackToTop from '@/components/ui/BackToTop'
import { getCollections } from '@/lib/shopify'
import type { ShopifyCollection } from '@/lib/shopify/types'

export default async function NutritionLayout({ children }: { children: React.ReactNode }) {
  let collections: ShopifyCollection[] = []
  try {
    collections = await getCollections(50)
  } catch {
    // Shopify non configuré — navigation vide
  }

  return (
    <>
      <Suspense fallback={<div className="h-[104px] bg-white border-b border-gray-100" />}>
        <Header collections={collections} />
      </Suspense>
      <CartDrawer />
      <main className="flex-1">{children}</main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
      <BackToTop />
    </>
  )
}
