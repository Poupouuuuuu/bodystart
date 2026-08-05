import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Galerie boutique — VRAIES photos du magasin (fournies par Adam, 07/2026,
 * optimisées en webp dans public/boutique/).
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
const PHOTOS = [
  {
    src: '/boutique/allee.webp',
    alt: "L'allée centrale de la boutique BodyStart Nutrition à Coignières, rayons de compléments alimentaires pleins",
    // pilier gauche (portrait) sur 2 rangées
    span: 'md:col-span-1 md:row-span-2',
  },
  {
    src: '/boutique/rayon-proteines.webp',
    alt: 'Le rayon protéines de la boutique BodyStart : whey, isolate et caséine en libre accès',
    span: 'md:col-span-2 md:row-span-1',
  },
  {
    src: '/boutique/comptoir.webp',
    alt: 'Le comptoir de la boutique BodyStart Nutrition avec les barres protéinées',
    // pilier droit (portrait) sur 2 rangées
    span: 'md:col-span-1 md:row-span-2',
  },
  {
    src: '/boutique/rayon-preworkout.webp',
    alt: 'Le rayon pré-workout, BCAA et créatine de la boutique BodyStart à Coignières',
    span: 'md:col-span-2 md:row-span-1',
  },
  {
    src: '/boutique/collagen-detail.webp',
    alt: 'Gros plan sur les pots Collagen Complex Eric Favre en rayon à la boutique BodyStart',
    span: 'md:col-span-2 md:row-span-1',
  },
  {
    src: '/boutique/gainer-detail.webp',
    alt: 'Sacs de gainer Mutant Mass en rayon à la boutique BodyStart Coignières',
    span: 'md:col-span-2 md:row-span-1',
  },
] as const

const FACTS = [
  { value: '13 ans', label: 'de conseil en nutrition' },
  { value: 'Lun–Sam', label: 'ouvert de 11h à 19h' },
  { value: '+2 600', label: 'clients conseillés' },
  // Note Google réelle — source unique GOOGLE_RATING (store-info.ts), relevée
  // à la main. Mettre à jour ici si la note/le volume bouge sensiblement.
  { value: '4,6/5', label: '58 avis Google' },
] as const

export default function BoutiqueGalleryV2() {
  return (
    <section className="bg-white">
      <div className="container py-14 md:py-18">
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
            13 ans qu&apos;on conseille des sportifs à Coignières — viens voir,
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
                className="object-cover"
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
            className="inline-flex items-center gap-2 text-[14px] font-semibold text-spruce hover:text-fresh-deep transition-colors underline underline-offset-4 flex-shrink-0"
          >
            Pourquoi choisir BodyStart ?
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
