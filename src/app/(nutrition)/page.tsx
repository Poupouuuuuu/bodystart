import type { Metadata } from 'next'
import { Suspense } from 'react'
import dynamic from 'next/dynamic'
import HeroSection from '@/components/home/HeroSection'
import ShopByObjective from '@/components/home/ShopByObjective'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import BrandValues from '@/components/home/BrandValues'
import UniversSection from '@/components/home/UniversSection'
import { getFeaturedProducts } from '@/lib/shopify'

// Below-the-fold + client → lazy-load (économise du JS dans le bundle initial pour le LCP)
const StoreLocator = dynamic(() => import('@/components/home/StoreLocator'), {
  loading: () => <div style={{ minHeight: '500px' }} aria-hidden="true" />,
})

import { buildPageMetadata } from '@/lib/seo'

export const metadata: Metadata = buildPageMetadata({
  path: '/',
  title: 'Accueil',
  description:
    "BodyStart, compléments sport et santé à Coignières (78). Conseil d'humain, produits propres et bien dosés, Click & Collect gratuit.",
})

// Sections async isolées → streaming via Suspense pour ne pas bloquer le Hero (LCP)
async function FeaturedProductsAsync() {
  let products: import('@/lib/shopify/types').ShopifyProduct[] = []
  try {
    products = await getFeaturedProducts()
  } catch {
    // Sans clés API, section vide
  }
  return <FeaturedProducts products={products} />
}

// Skeleton léger pour éviter le CLS pendant le streaming
function SectionFallback({ minHeight = '500px' }: { minHeight?: string }) {
  return <div style={{ minHeight }} aria-hidden="true" />
}

export default function HomePage() {
  return (
    <>
      {/* Above-the-fold : rendu immédiat, pas de fetch bloquant */}
      <HeroSection />

      {/* Sections data-driven streamées en parallèle */}
      <Suspense fallback={<SectionFallback minHeight="600px" />}>
        <FeaturedProductsAsync />
      </Suspense>

      <BrandValues />
      <ShopByObjective />

      {/* STANDBY 2026-05-23 : section Avis clients retiree (placeholder generique
          fictif). A reactiver via TestimonialsSection une fois qu'on a des vrais
          avis Google. Cf. tech-specs/site-rewrite-copy-v1.md §3.6. */}

      <StoreLocator />
      <UniversSection />
    </>
  )
}
