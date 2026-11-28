import type { Metadata } from 'next'
import HautAccueil from '@/components/home/accueil/HautAccueil'
import MeilleuresVentes from '@/components/home/accueil/MeilleuresVentes'
import RayonsAccueil from '@/components/home/accueil/RayonsAccueil'
import BarreConfiance from '@/components/home/accueil/BarreConfiance'
import PacksAccueil from '@/components/home/accueil/PacksAccueil'
import TrouveTonProduit from '@/components/home/accueil/TrouveTonProduit'
import VuSurInstagramV3 from '@/components/home/v3/VuSurInstagramV3'
import BandeauParrainageV2 from '@/components/home/v2/BandeauParrainageV2'
import BoutiqueGalleryV2 from '@/components/home/v2/BoutiqueGalleryV2'
import StoreCallV2 from '@/components/home/v2/StoreCallV2'
import Reveal from '@/components/ui/Reveal'
import { getCoffrets, getCollectionByHandle } from '@/lib/shopify'
import { getVedettesAccueil } from '@/lib/shopify/vedettes'
import { getRayonsAccueil } from '@/lib/shopify/rayons-accueil'
import { buildPageMetadata } from '@/lib/seo'
import NosGuidesV3 from '@/components/home/v3/NosGuidesV3'
import CoffretsNoelV3 from '@/components/home/v3/CoffretsNoelV3'
import { coffretsVisibles, dateCoffrets } from '@/lib/coffrets'
import { finPeriode, indexPeriode, lireApercu, periodeServeur } from '@/lib/saison'
import { dernierJour, periodeOffreServeur } from '@/lib/offre-accueil'
import { apercuSaison, getSaison } from '@/lib/shopify/saison'
import { composerSelection, MEILLEURES_VENTES_AFFICHEES } from '@/lib/selection-saison'
import { decorSaison } from '@/components/saison/decors'
import SelectionSaison from '@/components/saison/SelectionSaison'

// Refonte « site qui vend » du 28/11/2026 : offre et bouton au premier écran
// (texte, plus de grande photo), meilleures ventes avec ajout rapide, rayons,
// barre de confiance, puis packs et coffrets, conseil, boutique et blog.
// (Avant : REDESIGN V2 du 2026-05-25, tech-specs/redesign-v2-direction-artistique.md.)

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
  // Lectures Shopify en parallèle (régénération ISR plus courte). Les packs
  // servent à la sélection de saison, ou au bloc packs hors saison.
  const [coffrets, vedettes, saison, apercu, collectionPacks, variante, rayons] = await Promise.all([
    coffretsDuMoment(searchParams),
    getVedettesAccueil(PLACES_VEDETTES),
    getSaison(),
    apercuAccueil(searchParams),
    getCollectionByHandle('packs', 24).catch(() => null),
    varianteHero(searchParams),
    getRayonsAccueil(),
  ])
  const now = new Date()
  // Déco de saison (metafield bodystart.saison, components/saison) : haut de
  // page, sélection et séparateurs pendant la période, rien sinon.
  const periode = periodeServeur(saison, now, apercu)
  const decor = decorSaison(periode?.theme)
  // Offre du haut de page (lib/offre-accueil) : période rendue ici, puis
  // recalculée à l'heure du navigateur (OffreAccueil, modèle du header).
  const periodeOffre = periodeOffreServeur(saison, now, apercu)
  const offre = {
    periodes: saison,
    rang: indexPeriode(saison, periodeOffre),
    dernierJour: dernierJour(periodeOffre, now),
    apercu,
    previsualisation: process.env.VERCEL_ENV !== 'production',
  }
  // Scène produits du haut de page (ordinateur) : les coffrets pendant Noël,
  // sinon les premières vedettes. Produits en stock avec image seulement.
  const avecImage = (p: (typeof vedettes)[number]) => !!p.featuredImage && p.availableForSale !== false
  const coffretsVisuel = periodeOffre?.theme === 'noel' ? coffrets.filter(avecImage) : []
  const visuel = (coffretsVisuel.length > 0 ? coffretsVisuel : vedettes.filter(avecImage)).slice(0, 3)
  const libelleVisuel = coffretsVisuel.length > 0 ? 'Coffret de Noël' : 'Best-seller'

  // Packs : collection `packs`, comme la page /packs (mêmes cartes). En
  // saison, ils vont dans la sélection, dont les vedettes ne répètent ni les
  // meilleures ventes ni un produit déjà contenu dans un pack.
  const tousPacks = collectionPacks?.products?.nodes ?? []
  const packs = periode && decor ? tousPacks : []
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
  const SousHero = decor?.SousHero
  return (
    <>
      {/* 1. Offre (LCP texte, rendu immédiat, jamais dans <Reveal>) */}
      <HautAccueil decor={decor} variante={variante} offre={offre} visuel={visuel} libelleVisuel={libelleVisuel} />
      {/* Bande de saison juste sous le haut de page (Noël : guirlande). */}
      {SousHero && <SousHero />}

      {/* 2. Meilleures ventes, rayons, confiance : dans le premier écran et
             le suivant, SANS <Reveal> ni <Suspense> (visibles tout de suite). */}
      <MeilleuresVentes products={vedettes.slice(0, MEILLEURES_VENTES_AFFICHEES)} />
      <RayonsAccueil rayons={rayons} />
      <BarreConfiance />

      <Separateur />

      {/* 3. Coffrets de Noël (du 2/11 au 24/12, rien sinon), puis les packs :
             sélection de saison (packs et vedettes) pendant une période
             décorée, bloc packs sinon. */}
      {coffrets.length > 0 && (
        <Reveal>
          <CoffretsNoelV3 coffrets={coffrets} />
        </Reveal>
      )}
      {periode && decor && selection ? (
        <Reveal>
          <SelectionSaison
            packs={selection.packs}
            produits={selection.produits}
            surTitre={`Jusqu'au ${finPeriode(periode)}`}
            {...decor.selection}
          />
        </Reveal>
      ) : (
        <Reveal>
          <PacksAccueil packs={tousPacks} />
        </Reveal>
      )}

      <Separateur />

      {/* 4. Trouve ton produit en 1 min (questionnaire /conseil) */}
      <Reveal>
        <TrouveTonProduit />
      </Reveal>

      {/* Vu sur Instagram : masqué tant que src/lib/social-proof.ts est vide. */}
      <VuSurInstagramV3 />

      <Separateur />

      {/* 5. La boutique : vraies photos (carrousel), puis infos pratiques */}
      <Reveal>
        <BoutiqueGalleryV2 />
      </Reveal>
      <Reveal>
        <StoreCallV2 />
      </Reveal>

      <Separateur />

      {/* 6. Le blog : nos guides (maillage, audit SEO du 10/10/2026) */}
      <Reveal>
        <NosGuidesV3 />
      </Reveal>

      {/* 7. Parrainage (programme fidélité) */}
      <Reveal>
        <BandeauParrainageV2 />
      </Reveal>
    </>
  )
}
