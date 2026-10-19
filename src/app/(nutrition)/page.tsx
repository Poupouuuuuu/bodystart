import type { Metadata } from 'next'
import HeroV3 from '@/components/home/v3/HeroV3'
import MarqueeBand from '@/components/home/v3/MarqueeBand'
import ObjectifsV3 from '@/components/home/v3/ObjectifsV3'
import StatsBand from '@/components/home/v3/StatsBand'
import BestSellersV3 from '@/components/home/v3/BestSellersV3'
import ConseilV3 from '@/components/home/v3/ConseilV3'
import VuSurInstagramV3 from '@/components/home/v3/VuSurInstagramV3'
import BandeauParrainageV2 from '@/components/home/v2/BandeauParrainageV2'
import BoutiqueGalleryV2 from '@/components/home/v2/BoutiqueGalleryV2'
import StoreCallV2 from '@/components/home/v2/StoreCallV2'
import Reveal from '@/components/ui/Reveal'
import { getCoffrets, getCollectionByHandle, getFeaturedProducts, getProductByHandle } from '@/lib/shopify'
import { HOME_FEATURED_HANDLE, homeBestSellers } from '@/lib/merchandising'
import { buildPageMetadata } from '@/lib/seo'
import NosGuidesV3 from '@/components/home/v3/NosGuidesV3'
import CoffretsNoelV3 from '@/components/home/v3/CoffretsNoelV3'
import { coffretsVisibles, dateCoffrets } from '@/lib/coffrets'
import { finPeriode, periodeActive } from '@/lib/saison'
import { getSaison } from '@/lib/shopify/saison'
import { composerSelection, MEILLEURES_VENTES_AFFICHEES } from '@/lib/selection-saison'
import { decorSaison } from '@/components/saison/decors'
import SelectionSaison from '@/components/saison/SelectionSaison'
import type { ShopifyProduct } from '@/lib/shopify/types'

// REDESIGN V2 (2026-05-25) — cf. tech-specs/redesign-v2-direction-artistique.md
// Ordre des sections : §B.Home.1-8 (avis retire, cf. site-rewrite-copy-v1.md §3.6)

export const metadata: Metadata = {
  ...buildPageMetadata({
    path: '/',
    title: 'Compléments alimentaires Coignières (ex-BodyFit) | BodyStart',
    description:
      'BodyStart Nutrition, anciennement BodyFit Coignières : compléments sport et santé (78). Conseil gratuit en boutique, Click & Collect gratuit.',
  }),
  // <title> exact (60 caractères, audit SEO du 10/10/2026 : l'ancien en
  // faisait 79, coupé dans Google), bypass du template. « ex-BodyFit » gardé
  // (demande d'Adam du 25/09/2026 ; « bodyfit coignières » : 62 impressions,
  // 7 clics en 90 jours, position 3,6), choisi avec Claude Gestion.
  title: {
    absolute: 'Compléments alimentaires Coignières (ex-BodyFit) | BodyStart',
  },
}

// ISR : la home (best-sellers Shopify + leurs images) se régénère chaque heure.
// Sans ça, le rendu statique fige les produits/images au moment du build →
// placeholder "BS" sur les produits ajoutés/imagés après le dernier déploiement.
export const revalidate = 3600

// Meilleures ventes : rendues avec la page, SANS <Suspense> (08/10/2026). La
// page est en ISR (HTML régénéré au plus toutes les heures, servi depuis le
// cache) : le streaming n'apportait rien au visiteur et envoyait la section
// dans un bloc caché, invisible sans JS. Lues une fois : le bloc « Meilleures
// ventes » et la sélection de saison (sans doublon entre les deux).
/** Hors saison décorée : pas de séparateur entre les sections. */
function SansSeparateur() {
  return null
}

async function meilleuresVentes(): Promise<ShopifyProduct[]> {
  try {
    // Meilleures ventes sans les marques exclues, carte « Best-seller » choisie
    // à la main en tête (lib/merchandising) ; lue à part si elle n'est pas
    // dans les meilleures ventes du moment.
    const best = await getFeaturedProducts()
    const featured = best.some((p) => p.handle === HOME_FEATURED_HANDLE)
      ? null
      : await getProductByHandle(HOME_FEATURED_HANDLE).catch(() => null)
    return homeBestSellers(best, featured)
  } catch {
    // Sans cles API, section vide
    return []
  }
}

// Coffrets de Noël : du 2/11 au 24/12, heure de Paris (lib/coffrets). Hors
// production, ?coffrets_date=2026-11-10 force la date (la page devient alors
// dynamique) ; en production searchParams n'est jamais lu, la home reste en ISR.
async function coffretsDuMoment(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const env = process.env.VERCEL_ENV
  const forcee = env === 'production' ? undefined : (await searchParams).coffrets_date
  if (!coffretsVisibles(dateCoffrets(forcee, env))) return []
  return getCoffrets().catch(() => [])
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const coffrets = await coffretsDuMoment(searchParams)
  const meilleures = await meilleuresVentes()
  // Déco de saison (metafield bodystart.saison, components/saison) : haut de
  // page, sélection et séparateurs pendant la période, rien sinon.
  const periode = periodeActive(await getSaison(), new Date())
  const decor = decorSaison(periode?.theme)
  // Packs : collection `packs`, comme la page /packs (mêmes cartes).
  const selection =
    periode && decor
      ? composerSelection(
          (await getCollectionByHandle('packs', 24).catch(() => null))?.products?.nodes ?? [],
          meilleures,
          meilleures.slice(0, MEILLEURES_VENTES_AFFICHEES).map((p) => p.handle)
        )
      : null
  const Separateur = decor?.Separateur ?? SansSeparateur
  return (
    <>
      {/* 1. Hero (LCP, rendu immediat — jamais enveloppe dans <Reveal>) */}
      <HeroV3 decor={decor} />

      {/* 2. Bandeau reassurance — volontairement SANS reveal : il est visible
             des le chargement sur desktop, l'animer donnerait l'impression que
             toute la page bouge au premier coup d'oeil. */}
      <MarqueeBand />

      {/* PREMIUM V2 : les sections sous la ligne de flottaison montent en
          douceur a l'entree dans l'ecran. Sans JS ou en prefers-reduced-motion,
          <Reveal> n'applique aucun masquage (cf. globals.css .reveal). */}

      {/* 1 bis. Sélection de saison (packs puis meilleures ventes), pendant
             une période décorée seulement */}
      {periode && decor && selection && (
        <Reveal>
          <SelectionSaison
            packs={selection.packs}
            produits={selection.produits}
            surTitre={`Jusqu'au ${finPeriode(periode)}`}
            {...decor.selection}
          />
        </Reveal>
      )}

      {/* 2 bis. Coffrets de Noël, en saison seulement (rien sinon) */}
      {coffrets.length > 0 && (
        <Reveal>
          <CoffretsNoelV3 coffrets={coffrets} />
        </Reveal>
      )}

      {/* 3. Best-sellers (data Shopify, streame) */}
      <Reveal>
        <BestSellersV3 products={meilleures} />
      </Reveal>

      {/* 3 bis. Vu sur Instagram — vidéos d'influenceurs tournées à la boutique.
          Masqué tant que src/lib/social-proof.ts est vide (Reveal interne). */}
      <VuSurInstagramV3 />

      <Separateur />

      {/* 4. Objectifs — liste typographique */}
      <Reveal>
        <ObjectifsV3 />
      </Reveal>

      <Separateur />

      {/* 5. Le conseil qu'aucun site n'a (differenciateur) */}
      <Reveal>
        <ConseilV3 />
      </Reveal>

      <Separateur />

      {/* 5a. Nos guides : maillage vers le blog (audit SEO du 10/10/2026) */}
      <Reveal>
        <NosGuidesV3 />
      </Reveal>

      {/* 5b. Preuves — chiffres geants sur vert sapin (chapitre) */}
      <Reveal>
        <StatsBand />
      </Reveal>

      {/* 6. Bande parrainage (exploite loyalty L4) */}
      <Reveal>
        <BandeauParrainageV2 />
      </Reveal>

      <Separateur />

      {/* 7a. Galerie boutique (vraies photos du magasin, 07/2026) */}
      <Reveal>
        <BoutiqueGalleryV2 />
      </Reveal>

      <Separateur />

      {/* 7b. Boutique & Click & Collect */}
      <Reveal>
        <StoreCallV2 />
      </Reveal>

      {/* 8. Avis : retire (cf. site-rewrite-copy-v1.md §3.6). A reactiver
             quand on a de vrais avis Google. */}
    </>
  )
}
