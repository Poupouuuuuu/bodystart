import type { Metadata } from 'next'
import { Suspense } from 'react'
import HeroV3 from '@/components/home/v3/HeroV3'
import MarqueeBand from '@/components/home/v3/MarqueeBand'
import ObjectifsV3 from '@/components/home/v3/ObjectifsV3'
import StatsBand from '@/components/home/v3/StatsBand'
import BestSellersV3 from '@/components/home/v3/BestSellersV3'
import ConseilV3 from '@/components/home/v3/ConseilV3'
import BandeauParrainageV2 from '@/components/home/v2/BandeauParrainageV2'
import BoutiqueGalleryV2 from '@/components/home/v2/BoutiqueGalleryV2'
import StoreCallV2 from '@/components/home/v2/StoreCallV2'
import Reveal from '@/components/ui/Reveal'
import { getFeaturedProducts } from '@/lib/shopify'
import { buildPageMetadata } from '@/lib/seo'

// REDESIGN V2 (2026-05-25) — cf. tech-specs/redesign-v2-direction-artistique.md
// Ordre des sections : §B.Home.1-8 (avis retire, cf. site-rewrite-copy-v1.md §3.6)

export const metadata: Metadata = {
  ...buildPageMetadata({
    path: '/',
    title: 'BodyStart Nutrition — Compléments alimentaires & nutrition sportive à Coignières (78)',
    description:
      "BodyStart, compléments sport et santé à Coignières (78). Conseil d'humain, produits propres et bien dosés, Click & Collect gratuit.",
  }),
  // <title> exact demandé : bypass du template '%s | BodyStart Nutrition'
  // (le og:title / twitter:title gardent ce même libellé via buildPageMetadata).
  title: {
    absolute: 'BodyStart Nutrition — Compléments alimentaires & nutrition sportive à Coignières (78)',
  },
}

// ISR : la home (best-sellers Shopify + leurs images) se régénère chaque heure.
// Sans ça, le rendu statique fige les produits/images au moment du build →
// placeholder "BS" sur les produits ajoutés/imagés après le dernier déploiement.
export const revalidate = 3600

// Sections async isolees → streaming via Suspense pour ne pas bloquer le Hero (LCP)
async function BestSellersAsync() {
  let products: import('@/lib/shopify/types').ShopifyProduct[] = []
  try {
    products = await getFeaturedProducts()
  } catch {
    // Sans cles API, section vide
  }
  return <BestSellersV3 products={products} />
}

// Skeleton leger pour eviter le CLS pendant le streaming
function SectionFallback({ minHeight = '500px' }: { minHeight?: string }) {
  return <div style={{ minHeight }} aria-hidden="true" />
}

export default function HomePage() {
  return (
    <>
      {/* 1. Hero (LCP, rendu immediat — jamais enveloppe dans <Reveal>) */}
      <HeroV3 />

      {/* 2. Bandeau reassurance — volontairement SANS reveal : il est visible
             des le chargement sur desktop, l'animer donnerait l'impression que
             toute la page bouge au premier coup d'oeil. */}
      <MarqueeBand />

      {/* PREMIUM V2 : les sections sous la ligne de flottaison montent en
          douceur a l'entree dans l'ecran. Sans JS ou en prefers-reduced-motion,
          <Reveal> n'applique aucun masquage (cf. globals.css .reveal). */}

      {/* 3. Best-sellers (data Shopify, streame) */}
      <Reveal>
        <Suspense fallback={<SectionFallback minHeight="760px" />}>
          <BestSellersAsync />
        </Suspense>
      </Reveal>

      {/* 4. Objectifs — liste typographique */}
      <Reveal>
        <ObjectifsV3 />
      </Reveal>

      {/* 5. Le conseil qu'aucun site n'a (differenciateur) */}
      <Reveal>
        <ConseilV3 />
      </Reveal>

      {/* 5b. Preuves — chiffres geants sur vert sapin (chapitre) */}
      <Reveal>
        <StatsBand />
      </Reveal>

      {/* 6. Bande parrainage (exploite loyalty L4) */}
      <Reveal>
        <BandeauParrainageV2 />
      </Reveal>

      {/* 7a. Galerie boutique (vraies photos du magasin, 07/2026) */}
      <Reveal>
        <BoutiqueGalleryV2 />
      </Reveal>

      {/* 7b. Boutique & Click & Collect */}
      <Reveal>
        <StoreCallV2 />
      </Reveal>

      {/* 8. Avis : retire (cf. site-rewrite-copy-v1.md §3.6). A reactiver
             quand on a de vrais avis Google. */}
    </>
  )
}
