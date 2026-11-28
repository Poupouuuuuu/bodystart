import type { CSSProperties } from 'react'
import type { DecorSaisonPremium, PaletteHero } from '@/components/saison/decors'
import type { ShopifyProduct } from '@/lib/shopify/types'
import type { ApercuSaison, PeriodeSaison } from '@/lib/saison'
import type { PastillesAccueil } from '@/lib/pastilles-accueil'
import { cn } from '@/lib/utils'
import OffreAccueil, { type ClassesOffre } from './OffreAccueil'
import CarteVente from './CarteVente'
import MiniCartes from './MiniCartes'

/**
 * Haut de l'accueil « qui vend » (refonte du 28/11/2026). Critère de Gestion :
 * sur 390 px comme sur 1440 px, le premier écran montre l'offre du moment, un
 * bouton d'achat et au moins 2 produits avec leur prix.
 *
 * - Téléphone : l'offre en texte (sur-titre, titre, phrase, bouton, lien),
 *   plus de grande photo ; l'élément LCP est le titre, affiché dès la police
 *   chargée. Dessous, les 2 premières meilleures ventes en petit avec leur
 *   prix (MiniCartes), puis la piste des suivantes (MeilleuresVentes).
 * - Ordinateur (lg) : l'offre à gauche, à droite les 2 premières meilleures
 *   ventes en cartes catalogue (prix, ajout rapide). Bloc masqué sous lg :
 *   ses images, en chargement différé, n'y sont jamais téléchargées.
 * - H1 de la page gardé mot pour mot (SEO) ; le titre de l'offre est un <p>.
 * - Saison décorée (components/saison/decors) : fond et couleurs de la
 *   palette du thème (variables --h-*), décor sur toute la section
 *   (`hero.DecorHero`, neige et sol de Noël) avec sa place réservée en bas
 *   (`hero.espaceBas`). Le décor de photo (`hero.DecorPhoto`) n'a plus de
 *   photo où se poser : il n'est pas rendu (jamais sur les cartes produit).
 *   Hors saison : mêmes variables aux couleurs du site (crème, vert).
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

// Titre court (« Ta créatine 500 g offerte ») : très grand, .display-hero
// (WONK) à partir de sm, où il se lit bien.
const CLASSES: ClassesOffre = {
  surTitre:
    'mb-4 inline-flex min-h-[34px] items-center gap-2 self-start rounded-full border border-[color:var(--h-ligne-forte)] bg-[color:var(--h-voile)] px-3.5 py-1 text-[12px] font-bold uppercase tracking-[0.14em] text-[color:var(--h-texte)] md:mb-5 md:text-[13px]',
  point: 'h-2 w-2 shrink-0 rounded-full bg-[color:var(--h-trait)]',
  titre:
    'font-display text-[40px] font-extrabold leading-[1] tracking-[-0.025em] text-[color:var(--h-texte)] [text-wrap:balance] sm:display-hero sm:text-[52px] md:text-[60px] lg:text-[56px] xl:text-[66px]',
  accent:
    'text-[color:var(--h-accent)] underline decoration-[color:var(--h-souligne,transparent)] decoration-[0.07em] underline-offset-[0.14em] [text-decoration-skip-ink:none]',
  phrase:
    'mt-4 max-w-[540px] text-[16px] leading-[1.55] text-[color:var(--h-texte-doux)] md:mt-5 md:text-[18px]',
  // Bouton et lien sur une ligne dès 375 px (« Voir les coffrets » et « Tous
  // les produits ») : écart et texte un peu plus serrés sous sm.
  actions: 'mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 sm:gap-x-6 md:mt-8',
  bouton:
    'inline-flex min-h-[52px] items-center gap-3 rounded-full bg-[color:var(--h-bouton)] py-2 pl-5 pr-2 text-[15px] font-semibold sm:pl-6 sm:text-[16px] text-[color:var(--h-bouton-texte)] shadow-hero transition-opacity duration-300 ease-out-expo hover:opacity-90',
  rond: 'flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--h-rond)] text-[color:var(--h-rond-texte)]',
  second:
    'inline-flex min-h-[44px] items-center text-[14px] font-semibold sm:text-[15px] text-[color:var(--h-lien)] underline decoration-[color:var(--h-ligne-forte)] underline-offset-4 transition-colors hover:decoration-[color:var(--h-lien)]',
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
  cartes,
  pastilles,
}: {
  decor?: DecorSaisonPremium | null
  /** Variante de couleur du thème (`?hero=` hors production). */
  variante?: string
  offre: OffreServeur
  /** 2 premières meilleures ventes : cartes à côté de l'offre (ordinateur), en petit dessous (téléphone). */
  cartes: ShopifyProduct[]
  pastilles: PastillesAccueil
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
          'container relative grid items-center gap-10 pb-8 pt-6 md:pb-12 md:pt-10 lg:grid-cols-[1fr_minmax(0,500px)] lg:gap-12 lg:py-10 xl:grid-cols-[1fr_540px] xl:gap-16',
          // Saison : place pour la guirlande posée sous l'en-tête (Noël, Halloween).
          hero && 'pt-10 md:pt-12',
          hero?.espaceBas
        )}
      >
        <div className="relative z-10 flex max-w-[640px] flex-col">
          {/* h1 = la requête visée (audit SEO du 10/10/2026), mot pour mot,
              premier dans le HTML. Téléphone : affiché sous le bouton (order),
              pour que l'offre et son bouton tiennent au-dessus du bandeau
              cookies dès 375 × 667 ; sur-titre de la section à partir de sm. */}
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
          <MiniCartes produits={cartes} pastilles={pastilles} />
        </div>

        {cartes.length > 0 && (
          <div className="relative z-10 hidden lg:block">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--h-texte-doux)]">
              Les plus pris en ce moment
            </p>
            <div className="grid grid-cols-2 gap-4 xl:gap-5">
              {cartes.slice(0, 2).map((p) => (
                <CarteVente key={p.id} product={p} pastille={pastilles[p.id]} />
              ))}
            </div>
          </div>
        )}
      </div>
      {/* Décor sur toute la section (Noël : neige, sol enneigé), sans clic,
          sa place réservée en bas par hero.espaceBas. */}
      {DecorHero && <DecorHero />}
    </section>
  )
}
