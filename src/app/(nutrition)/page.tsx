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
import { getCoffrets, getCollectionByHandle } from '@/lib/shopify'
import { getVedettesAccueil } from '@/lib/shopify/vedettes'
import { buildPageMetadata } from '@/lib/seo'
import NosGuidesV3 from '@/components/home/v3/NosGuidesV3'
import CoffretsNoelV3 from '@/components/home/v3/CoffretsNoelV3'
import { coffretsVisibles, dateCoffrets } from '@/lib/coffrets'
import { finPeriode, lireApercu, periodeServeur } from '@/lib/saison'
import { apercuSaison, getSaison } from '@/lib/shopify/saison'
import { composerSelection, MEILLEURES_VENTES_AFFICHEES } from '@/lib/selection-saison'
import { decorSaison } from '@/components/saison/decors'
import SelectionSaison from '@/components/saison/SelectionSaison'

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

/** Hors saison décorée : pas de séparateur entre les sections. */
function SansSeparateur() {
  return null
}

// Produits mis en avant (metafield bodystart.accueil_vedettes, lib/vedettes) :
// rendus avec la page, SANS <Suspense> (08/10/2026 : en ISR, le streaming
// envoyait la section dans un bloc caché, invisible sans JS). Lus une fois
// pour le bloc « Ce qui part vite » (5 cartes) et la sélection de saison
// (3 produits de plus, sans doublon) : 8 places.
const PLACES_VEDETTES = MEILLEURES_VENTES_AFFICHEES + 3

// Coffrets de Noël : du 2/11 au 24/12, heure de Paris (lib/coffrets). Hors
// production, ?coffrets_date=2026-11-10 force la date (la page devient alors
// dynamique) ; en production searchParams n'est jamais lu, la home reste en ISR.
async function coffretsDuMoment(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const env = process.env.VERCEL_ENV
  const forcee = env === 'production' ? undefined : (await searchParams).coffrets_date
  if (!coffretsVisibles(dateCoffrets(forcee, env))) return []
  return getCoffrets().catch(() => [])
}

// Variante de couleur du haut de page en saison (?hero=a|b) : hors production
// seulement, pour comparer sur la preview. En production searchParams n'est
// jamais lu (ISR).
async function varianteHero(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  if (process.env.VERCEL_ENV === 'production') return undefined
  const v = (await searchParams).hero
  return typeof v === 'string' ? v : undefined
}

// Thème forcé (?saison=black-week, puis le cookie posé par le header) : hors
// production seulement, comme ?hero= ; en production, null sans rien lire.
async function apercuAccueil(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  if (process.env.VERCEL_ENV === 'production') return null
  return lireApercu((await searchParams).saison) ?? (await apercuSaison())
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // Lectures Shopify en parallèle (régénération ISR plus courte). Les packs ne
  // servent qu'à la sélection de saison, ignorés hors période.
  const [coffrets, vedettes, periode, collectionPacks, variante] = await Promise.all([
    coffretsDuMoment(searchParams),
    getVedettesAccueil(PLACES_VEDETTES),
    Promise.all([getSaison(), apercuAccueil(searchParams)]).then(([saison, apercu]) =>
      periodeServeur(saison, new Date(), apercu)
    ),
    getCollectionByHandle('packs', 24).catch(() => null),
    varianteHero(searchParams),
  ])
  // Déco de saison (metafield bodystart.saison, components/saison) : haut de
  // page en deux parties, sélection et séparateurs pendant la période, rien
  // sinon.
  const decor = decorSaison(periode?.theme)
  // Packs : collection `packs`, comme la page /packs (mêmes cartes). Les
  // vedettes proposées à côté ne répètent ni le bloc « Ce qui part vite » ni
  // un produit déjà contenu dans un pack.
  const packs = periode && decor ? (collectionPacks?.products?.nodes ?? []) : []
  const selection =
    periode && decor
      ? composerSelection(packs, vedettes, [
          ...vedettes.slice(0, MEILLEURES_VENTES_AFFICHEES).map((p) => p.handle),
          ...packs.flatMap((p) =>
            p.variants.nodes.flatMap((v) => v.components?.nodes.map((c) => c.productVariant.product.handle) ?? [])
          ),
        ])
      : null
  const Separateur = decor?.Separateur ?? SansSeparateur
  return (
    <>
      {/* 1. Hero (LCP, rendu immediat — jamais enveloppe dans <Reveal>) */}
      <HeroV3 decor={decor} variante={variante} />

      {/* 2. Bandeau reassurance — volontairement SANS reveal : il est visible
             des le chargement sur desktop, l'animer donnerait l'impression que
             toute la page bouge au premier coup d'oeil. */}
      <MarqueeBand />

      {/* PREMIUM V2 : les sections sous la ligne de flottaison montent en
          douceur a l'entree dans l'ecran. Sans JS ou en prefers-reduced-motion,
          <Reveal> n'applique aucun masquage (cf. globals.css .reveal). */}

      {/* 2 bis. Coffrets de Noël, en saison seulement (rien sinon) */}
      {coffrets.length > 0 && (
        <Reveal>
          <CoffretsNoelV3 coffrets={coffrets} />
        </Reveal>
      )}

      {/* 3. Best-sellers (data Shopify, streame) */}
      <Reveal>
        <BestSellersV3 products={vedettes} />
      </Reveal>

      {/* 3 ter. Sélection de saison (packs puis vedettes), pendant
             une période décorée seulement. Après les meilleures ventes et pas
             sous le haut de page : ses images partaient avec la photo (LCP
             mobile +0,6 s mesuré le 19/10/2026). */}
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
