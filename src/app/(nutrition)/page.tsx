import type { Metadata } from 'next'
import HeroSection from '@/components/home/HeroSection'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import BrandValues from '@/components/home/BrandValues'
import ShopByObjective from '@/components/home/ShopByObjective'
import StoreLocator from '@/components/home/StoreLocator'
import UniversSection from '@/components/home/UniversSection'
import ProofBar from '@/components/home/ProofBar'
import TestimonialsSection from '@/components/home/TestimonialsSection'
import NewsletterSection from '@/components/home/NewsletterSection'
import { getFeaturedProducts } from '@/lib/shopify'

export const metadata: Metadata = {
  title: 'Accueil',
  description:
    'Body Start Nutrition — Compléments alimentaires premium pour sportifs. Livraison rapide, Click & Collect disponible.',
}

export default async function HomePage() {
  let products: import('@/lib/shopify/types').ShopifyProduct[] = []
  try {
    products = await getFeaturedProducts()
  } catch {
    // En développement sans clés API, on affiche la page sans produits
  }

  return (
    <>
      <HeroSection />
      <ProofBar />
      <FeaturedProducts products={products} />
      <BrandValues />
      <ShopByObjective />
      <TestimonialsSection />
      <StoreLocator />
      <NewsletterSection />
      <UniversSection />
    </>
  )
}
