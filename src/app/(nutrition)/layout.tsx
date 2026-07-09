import { Suspense } from 'react'

export const revalidate = 3600
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CartDrawer from '@/components/cart/CartDrawer'
import BackToTop from '@/components/ui/BackToTop'
import BirthdayBanner from '@/components/marketing/BirthdayBanner'
import { getCollections } from '@/lib/shopify'
import type { ShopifyCollection } from '@/lib/shopify/types'

// Fallback : domaine reel actuel (Vercel), pas un domaine devine. Cf. root layout.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodystart.vercel.app').replace(/\/$/, '')

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'BodyStart Nutrition',
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

// Sitelinks searchbox + identite du site pour Google et les moteurs generatifs.
const webSiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: SITE_URL,
  name: 'BodyStart Nutrition',
  inLanguage: 'fr-FR',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
}

const localBusinessJsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#boutique-coignieres`,
    name: 'BodyStart Nutrition, Coignières',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
      />
      {/* A11y : skip-link — 1er élément focusable, visible uniquement au focus
          clavier. Évite de retraverser bandeau + nav (~10 tab stops) par page. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:bg-fresh focus:text-white focus:px-5 focus:py-3 focus:rounded-full focus:text-[14px] focus:font-semibold"
      >
        Aller au contenu
      </a>
      {/* Bandeau anniversaire (auto-expiré le 10/07/2026, heure de Paris) —
          au-dessus du header, sur toutes les pages boutique. */}
      <BirthdayBanner />
      <Suspense fallback={<div className="h-[104px] bg-white border-b border-gray-100" />}>
        <Header collections={collections} />
      </Suspense>
      <Suspense fallback={null}>
        <CartDrawer />
      </Suspense>
      <main id="main" className="flex-1">{children}</main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
      <BackToTop />
    </>
  )
}
