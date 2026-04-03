import { Suspense } from 'react'

export const revalidate = 3600
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/cart/CartDrawer'
import BackToTop from '@/components/ui/BackToTop'
import { getCollections } from '@/lib/shopify'
import type { ShopifyCollection } from '@/lib/shopify/types'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodystart.com'

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Body Start Nutrition',
  url: SITE_URL,
  logo: `${SITE_URL}/assets/logos/logo-nutrition.png`,
  description: 'Compléments alimentaires premium pour sportifs. Livraison rapide, Click & Collect en boutique.',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+33761847580',
    contactType: 'customer service',
    availableLanguage: 'French',
  },
  sameAs: [],
}

const localBusinessJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#boutique-coignieres`,
    name: 'Body Start Nutrition — Coignières',
    image: `${SITE_URL}/assets/logos/logo-nutrition.png`,
    telephone: '+33761847580',
    url: `${SITE_URL}/stores`,
    address: {
      '@type': 'PostalAddress',
      streetAddress: '8 Rue du Pont des Landes',
      addressLocality: 'Coignières',
      postalCode: '78310',
      addressCountry: 'FR',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '11:00',
      closes: '19:00',
    },
    priceRange: '€€',
  },
]

export default async function NutritionLayout({ children }: { children: React.ReactNode }) {
  let collections: ShopifyCollection[] = []
  try {
    collections = await getCollections(50)
  } catch {
    // Shopify non configuré — navigation vide
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
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
