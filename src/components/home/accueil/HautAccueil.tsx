import Link from 'next/link'
import type { ComponentType, CSSProperties } from 'react'
import { ArrowRight } from 'lucide-react'
import Image from '@/components/ui/Image'
import type { DecorSaisonPremium, PaletteHero } from '@/components/saison/decors'
import type { ShopifyProduct } from '@/lib/shopify/types'
import type { ApercuSaison, PeriodeSaison } from '@/lib/saison'
import { cardPriceOf } from '@/lib/product-price'
import { altImage, altProduit } from '@/lib/alt-produit'
import { cn, formatPrice } from '@/lib/utils'
import OffreAccueil, { type ClassesOffre } from './OffreAccueil'

/**
 * Haut de l'accueil « qui vend » (refonte du 28/11/2026) : plus de grande
 * photo, une offre en texte (étiquette, titre, phrase, bouton) pilotée par le
 * mode saison (lib/offre-accueil). C'est un texte, donc l'élément LCP mobile
 * s'affiche dès la police chargée, sans attendre d'image.
 *
 * - H1 de la page gardé mot pour mot (SEO), en sur-titre ; le titre de
 *   l'offre est un <p>.
 * - Ordinateur (lg) : deux colonnes, l'offre à gauche, à droite une scène
 *   produits sur le fond végétal. Images Shopify (srcset du CDN) : `sizes`
 *   à 1px sous lg, le téléphone ne prend que la variante de 16 px de l'image
 *   préchargée ; les deux autres sont en chargement différé dans un bloc
 *   masqué, jamais téléchargées sur mobile.
 * - Saison décorée (components/saison/decors) : fond et couleurs de la
 *   palette du thème (variables --h-*), décor sur toute la section
 *   (`hero.DecorHero`, neige et sol de Noël) avec sa place réservée en bas
 *   (`hero.espaceBas`), décor de la photo (`hero.DecorPhoto`) sur la scène
 *   produits. Hors saison : mêmes variables aux couleurs du site (crème, vert).
 */

/** Hors saison : couleurs du site (contrastes AA sur la crème #FAF8F3). */
const PALETTE_SITE: PaletteHero = {
  '--h-fond': '#FAF8F3',
  '--h-texte': '#2D5A2D',
  '--h-texte-doux': '#6B6B66',
  '--h-sur-titre': '#2A2A2A',
  '--h-accent': '#3B7A3F',
  '--h-trait': '#C9A227',
  '--h-ligne': 'rgba(45,90,45,0.14)',
  '--h-ligne-forte': 'rgba(45,90,45,0.24)',
  '--h-voile': '#FFFFFF',
  '--h-voile-fort': '#EEF4EC',
  '--h-bouton': '#3B7A3F',
  '--h-bouton-texte': '#FFFFFF',
  '--h-rond': 'rgba(255,255,255,0.16)',
  '--h-rond-texte': '#FFFFFF',
  '--h-lien': '#2D5A2D',
  '--h-liseret': '#C9A227',
  // Soulignement des mots en couleur (hors saison seulement : en saison, la
  // couleur d'accent du thème suffit).
  '--h-souligne': '#C9A227',
}

// Titre jusqu'à 4 lignes sur un téléphone de 375 px ; .display-hero (WONK)
// seulement à partir de sm, où il est assez grand pour se lire.
const CLASSES: ClassesOffre = {
  etiquette:
    'mb-4 inline-flex min-h-[34px] flex-wrap items-center gap-x-2 gap-y-0.5 rounded-full border border-[color:var(--h-ligne-forte)] bg-[color:var(--h-voile)] px-3.5 py-1 text-[13px] font-semibold text-[color:var(--h-texte)] md:mb-5 md:text-[14px] [&_[role=timer]]:text-[color:var(--h-accent)]',
  point: 'h-2 w-2 shrink-0 rounded-full bg-[color:var(--h-trait)]',
  titre:
    'font-display text-[33px] font-extrabold leading-[1.02] tracking-[-0.02em] text-[color:var(--h-texte)] [text-wrap:balance] sm:display-hero sm:text-[46px] md:text-[54px] lg:text-[50px] xl:text-[58px]',
  accent:
    'text-[color:var(--h-accent)] underline decoration-[color:var(--h-souligne,transparent)] decoration-[0.07em] underline-offset-[0.14em] [text-decoration-skip-ink:none]',
  phrase:
    'mt-4 max-w-[540px] text-[16px] leading-[1.55] text-[color:var(--h-texte-doux)] md:mt-5 md:text-[18px]',
  bouton:
    'mt-6 inline-flex min-h-[52px] items-center gap-3 rounded-full bg-[color:var(--h-bouton)] py-2 pl-6 pr-2 text-[16px] font-semibold text-[color:var(--h-bouton-texte)] shadow-hero transition-opacity duration-300 ease-out-expo hover:opacity-90 md:mt-8',
  rond: 'flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--h-rond)] text-[color:var(--h-rond-texte)]',
}

export interface OffreServeur {
  periodes: PeriodeSaison[]
  rang: number
  dernierJour: boolean
  apercu: ApercuSaison | null
  previsualisation: boolean
}

export default function HautAccueil({
  decor = null,
  variante,
  offre,
  visuel,
  libelleVisuel,
  fondBlanc = false,
}: {
  decor?: DecorSaisonPremium | null
  /** Variante de couleur du thème (`?hero=` hors production). */
  variante?: string
  offre: OffreServeur
  /** Produits de la scène (ordinateur) : 1 à 3, avec image. */
  visuel: ShopifyProduct[]
  /** Libellé de la carte du produit principal (« Best-seller », « Coffret de Noël »). */
  libelleVisuel: string
  /** Visuels photographiés sur fond blanc (coffrets) : scène blanche. */
  fondBlanc?: boolean
}) {
  const hero = decor?.hero
  const palette = (hero && ((variante && hero.palettes[variante]) || hero.palettes[hero.defaut])) || PALETTE_SITE
  const DecorHero = hero?.DecorHero
  return (
    <section
      data-haut-accueil=""
      className="relative isolate overflow-hidden bg-[color:var(--h-fond)]"
      style={palette as CSSProperties}
    >
      <div
        className={cn(
          'container relative grid items-center gap-10 pb-8 pt-6 md:pb-14 md:pt-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:py-14 xl:gap-20',
          // Saison : place pour la guirlande posée sous l'en-tête (Noël, Halloween).
          hero && 'pt-10 md:pt-12',
          hero?.espaceBas
        )}
      >
        <div className="relative z-10 flex max-w-[640px] flex-col">
          {/* h1 = la requête visée (audit SEO du 10/10/2026), mot pour mot,
              premier dans le HTML. Téléphone : affiché sous le bouton (order),
              pour que l'offre et son bouton tiennent au-dessus du bandeau
              cookies dès 375 × 667 ; sur-titre à partir de sm. */}
          <h1 className="order-last mt-6 flex items-center gap-3 font-sans text-[13px] font-semibold leading-snug text-[color:var(--h-sur-titre)] sm:order-none sm:mb-5 sm:mt-0 md:mb-6 md:text-[15px]">
            <span aria-hidden="true" className="h-px w-6 shrink-0 bg-[color:var(--h-trait)] md:w-8" />
            Compléments alimentaires et nutrition sportive à Coignières
          </h1>
          <OffreAccueil
            periodes={offre.periodes}
            rangServeur={offre.rang}
            dernierJourServeur={offre.dernierJour}
            apercu={offre.apercu}
            previsualisation={offre.previsualisation}
            c={CLASSES}
          />
        </div>

        {visuel.length > 0 && (
          <SceneProduits
            produits={visuel}
            libelle={libelleVisuel}
            fondBlanc={fondBlanc}
            DecorPhoto={hero?.DecorPhoto}
          />
        )}
      </div>
      {/* Décor sur toute la section (Noël : neige, sol enneigé), sans clic,
          sa place réservée en bas par hero.espaceBas. */}
      {DecorHero && <DecorHero />}
    </section>
  )
}

/** Photos sur fond blanc : sans ombre portée (elle dessinerait le cadre de
 * la photo) et en « multiply », le blanc de la photo se fond dans la scène. */
const OMBRE_AUCUNE = 'mix-blend-multiply'

/** Scène produits, à partir de lg seulement (masquée en dessous, rien n'y est téléchargé). */
function SceneProduits({
  produits,
  libelle,
  fondBlanc,
  DecorPhoto,
}: {
  produits: ShopifyProduct[]
  libelle: string
  /** Photos sur fond blanc (coffrets) : scène blanche, sans fond végétal. */
  fondBlanc: boolean
  DecorPhoto?: ComponentType
}) {
  const [principal, ...cotes] = produits
  const prix = cardPriceOf(principal)
  const image = principal.featuredImage
  return (
    <div className="relative hidden lg:block">
      <div
        className={cn(
          'relative aspect-[6/5] w-full overflow-hidden rounded-[28px] bg-cover bg-bottom shadow-hero',
          fondBlanc ? 'bg-white' : 'bg-sage'
        )}
        style={fondBlanc ? undefined : { backgroundImage: "url('/bg-vegetal-800.webp')" }}
      >
        {/* Deux produits en retrait, de part et d'autre, au-dessus de la carte. */}
        {cotes.slice(0, 2).map((p, i) =>
          p.featuredImage ? (
            <div
              key={p.id}
              className={cn(
                'absolute bottom-[29%] h-[38%] w-[25%]',
                i === 0 ? 'left-[6%] -rotate-[5deg]' : 'right-[6%] rotate-[5deg]'
              )}
            >
              <Image
                src={p.featuredImage.url}
                alt={altImage(p.featuredImage, altProduit(p))}
                fill
                sizes="(min-width: 1024px) 220px, 1px"
                className={cn('object-contain object-bottom', fondBlanc ? OMBRE_AUCUNE : 'opacity-95 [filter:drop-shadow(0_18px_22px_rgba(45,90,45,0.28))]')}
              />
            </div>
          ) : null
        )}
        {image && (
          <div className="absolute bottom-[25%] left-1/2 h-[60%] w-[42%] -translate-x-1/2">
            <Image
              src={image.url}
              alt={altImage(image, altProduit(principal))}
              fill
              priority
              fetchPriority="high"
              sizes="(min-width: 1024px) 340px, 1px"
              className={cn('object-contain object-bottom', fondBlanc ? OMBRE_AUCUNE : '[filter:drop-shadow(0_28px_32px_rgba(45,90,45,0.34))]')}
            />
          </div>
        )}
        {DecorPhoto && <DecorPhoto />}

        {/* Carte du produit principal : nom, prix, lien vers la fiche. */}
        <Link
          href={`/products/${principal.handle}`}
          className="group absolute bottom-5 left-5 right-5 flex items-center justify-between gap-4 rounded-2xl bg-white/90 px-5 py-3.5 shadow-lift backdrop-blur-md transition-colors hover:bg-white xl:left-6 xl:right-auto xl:min-w-[340px]"
        >
          <span className="min-w-0">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-mute">{libelle}</span>
            <span className="mt-0.5 block truncate font-display text-[18px] font-bold leading-tight text-spruce">
              {principal.title}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-3">
            {prix && (
              <span className="flex items-baseline gap-1.5 font-display text-[20px] font-extrabold tabular-nums text-spruce">
                {prix.from && <span className="font-sans text-[12px] font-medium text-ink-mute">dès</span>}
                {formatPrice(prix.price)}
              </span>
            )}
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-fresh text-white transition-transform duration-500 ease-out-expo group-hover:translate-x-0.5">
              <ArrowRight className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </span>
          </span>
        </Link>
      </div>
    </div>
  )
}
