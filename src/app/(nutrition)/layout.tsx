import { Suspense } from 'react'

export const revalidate = 3600
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import CartDrawerLazy from '@/components/cart/CartDrawerLazy'
import BackToTop from '@/components/ui/BackToTop'
import BirthdayBanner from '@/components/marketing/BirthdayBanner'
import VenometteBanner from '@/components/marketing/VenometteBanner'
import NavigationTracker from '@/components/layout/NavigationTracker'
import { getCollections } from '@/lib/shopify'
import type { ShopifyCollection } from '@/lib/shopify/types'
import { organizationJsonLd, storeJsonLd } from '@/lib/jsonld/local'

// Fallback : domaine reel actuel (Vercel), pas un domaine devine. Cf. root layout.
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodystart.vercel.app').replace(/\/$/, '')

// Sitelinks searchbox + identite du site pour Google et les moteurs generatifs.
const webSiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  url: SITE_URL,
  name: 'BodyStart Nutrition',
  inLanguage: 'fr-FR',
  publisher: { '@id': `${SITE_URL}/#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
}

// Organization + Store (même @id partout) : src/lib/jsonld/local.ts
const organizationLd = organizationJsonLd(SITE_URL)
const storeLd = storeJsonLd(SITE_URL)

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeLd) }}
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
      {/* Bandeau opération Venomette (teaser le 07/09/2026, puis 08 → 20/09, heure de Paris) */}
      <VenometteBanner />
      {/* Compteur de navigations internes (bouton Retour des fiches produit) */}
      <NavigationTracker />
      {/* Header et Footer HORS <Suspense> (08/10/2026) : une frontière Suspense
          autour d'un composant client fait partir son HTML dans un bloc caché,
          révélé par un script. Sans JS (ou si le script échoue), plus de menu
          ni de pied de page. Aucun des deux n'utilise useSearchParams. */}
      <Header collections={collections} />
      <Suspense fallback={null}>
        <CartDrawerLazy />
      </Suspense>
      <main id="main" className="flex-1">{children}</main>
      <Footer />
      <BackToTop />
    </>
  )
}
