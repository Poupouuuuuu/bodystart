import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Galerie boutique — VRAIES photos du magasin (fournies par Adam, 07/2026,
 * remplacées par celles du 14/10/2026 sauf le comptoir, optimisées en webp
 * dans public/boutique/).
 *
 * Objectif (retour consultant + review) : le site disait « voici une boutique
 * de compléments » sans jamais la MONTRER. Cette section montre les rayons
 * pleins et l'allée réelle juste avant la carte pratique StoreCallV2.
 *
 * Layout :
 *  - mobile : piste horizontale scroll-snap (le geste natif) ;
 *  - desktop : bento CSS grid 4 colonnes. ⚠️ Les images sont en `fill`
 *    (position absolue) : la grille DOIT donner une hauteur explicite aux
 *    rangées (`auto-rows`), sinon les cellules s'effondrent à ~0 px (bug
 *    corrigé le 16/07 : `grid-rows-2` sans hauteur = mosaïque écrasée).
 */
// Photos du 14/10/2026, toutes en portrait. `position` : cadrage
// (object-position) choisi pour le format de la case, carte 3:4 sur mobile,
// bande 3:1 ou pilier sur ordinateur (simulé avant l'intégration).
const PHOTOS = [
  {
    src: '/boutique/allee-acides-amines.webp',
    alt: 'Allée de la boutique BodyStart Nutrition à Coignières : rayons acides aminés, créatine et gainers',
    // pilier gauche (portrait) sur 2 rangées ; enseigne « Acides aminés » visible
    span: 'md:col-span-1 md:row-span-2',
    position: 'object-[50%_30%]',
  },
  {
    src: '/boutique/mur-nutrimuscle.webp',
    alt: 'Mur Nutrimuscle de la boutique BodyStart Nutrition : Protimuscle, Isolate Native Whey Mix, crème de riz et muesli devant le mur végétal',
    span: 'md:col-span-2 md:row-span-1',
    position: 'object-[50%_40%]',
  },
  {
    src: '/boutique/comptoir.webp',
    alt: 'Le comptoir de la boutique BodyStart Nutrition avec les barres protéinées',
    // pilier droit (portrait) sur 2 rangées
    span: 'md:col-span-1 md:row-span-2',
    position: 'object-center',
  },
  {
    src: '/boutique/rayon-creatine-gainer.webp',
    alt: 'Rayon créatine et gainer de la boutique BodyStart Nutrition à Coignières',
    span: 'md:col-span-2 md:row-span-1',
    // enseigne « Créatine » et première étagère
    position: 'object-[50%_15%]',
  },
  {
    src: '/boutique/protimuscle-detail.webp',
    alt: 'Gros plan sur les pots de Native Whey Protimuscle Nutrimuscle en rayon chez BodyStart Nutrition',
    span: 'md:col-span-2 md:row-span-1',
    position: 'object-[50%_62%]',
  },
  {
    src: '/boutique/pyramide-creatine.webp',
    alt: 'Pyramide de pots de créatine Dedicated en rayon chez BodyStart Nutrition à Coignières',
    span: 'md:col-span-2 md:row-span-1',
    // mobile : toute la pyramide ; bande ordinateur : une rangée de pots
    position: 'object-[50%_40%] md:object-[50%_62%]',
  },
] as const

const FACTS = [
  { value: '13 ans', label: 'de conseil en nutrition' },
  { value: 'Lun. au sam.', label: 'ouvert de 11h à 19h' },
  { value: '+2 600', label: 'clients conseillés' },
  // Pas de note Google ici : le hero et la bande de chiffres l'affichent déjà
  // (une seule fois par écran, chiffres lus dans Shopify).
] as const

export default function BoutiqueGalleryV2() {
  // border-t : cette section suit le bandeau parrainage, lui aussi blanc. Un
  // filet vert très clair marque la frontière entre les deux chapitres sans
  // introduire un 4e fond.
  return (
    <section className="border-t border-spruce/10 bg-white">
      {/* Section narrative (photos du magasin) : même respiration large que le
          bloc conseil. */}
      <div className="container py-16 md:py-24">
        {/* En-tête */}
        <div className="max-w-[640px] mb-9">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3">
            La boutique
          </p>
          <h2 className="font-display text-[32px] md:text-[42px] font-extrabold text-spruce leading-[1.05] tracking-tight mb-5">
            Une vraie boutique, pas un entrepôt.
          </h2>
          <p className="text-ink-mute text-[17px] leading-[1.65]">
            Des rayons pleins, des produits que tu peux prendre en main, et
            quelqu&apos;un derrière le comptoir qui les utilise vraiment. Ça fait
            13 ans qu&apos;on conseille des sportifs à Coignières. Viens voir,
            c&apos;est mieux en vrai.
          </p>
        </div>

        {/* Piste snap mobile / bento desktop (auto-rows = hauteur des rangées) */}
        <div
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-4 md:auto-rows-[190px] md:overflow-visible"
          aria-label="Photos de la boutique"
        >
          {PHOTOS.map((photo) => (
            <div
              key={photo.src}
              className={cn(
                'relative flex-shrink-0 w-[72%] sm:w-[46%] snap-center aspect-[3/4] rounded-2xl overflow-hidden border border-spruce/10',
                // desktop : la taille vient de la grille (largeur auto, hauteur
                // via row-span × auto-rows) → on annule l'aspect-ratio mobile.
                'md:w-auto md:aspect-auto',
                photo.span
              )}
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className={cn('object-cover', photo.position)}
                sizes="(min-width: 768px) 50vw, 72vw"
              />
            </div>
          ))}
        </div>

        {/* Chiffres + lien « Pourquoi BodyStart ? » */}
        <div className="mt-9 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <dl className="flex flex-wrap gap-x-10 gap-y-4">
            {FACTS.map((f) => (
              <div key={f.value}>
                <dt className="sr-only">{f.label}</dt>
                <dd>
                  <span className="block font-display text-[26px] md:text-[30px] font-extrabold text-spruce leading-none">
                    {f.value}
                  </span>
                  <span className="block text-[13px] text-ink-mute font-medium mt-1">
                    {f.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
          <Link
            href="/pourquoi-bodystart"
            className="inline-flex min-h-[44px] items-center gap-2 text-[14px] font-semibold text-spruce hover:text-fresh-deep transition-colors underline underline-offset-4 flex-shrink-0"
          >
            Pourquoi choisir BodyStart ?
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
