import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

/**
 * Galerie boutique — VRAIES photos du magasin (fournies par Adam, 07/2026,
 * optimisées en webp dans public/boutique/).
 *
 * Objectif (retour consultant + review) : le site disait « voici une boutique
 * de compléments » sans jamais la MONTRER. Cette section montre les rayons
 * pleins et l'allée réelle juste avant la carte pratique StoreCallV2 —
 * le client achète aussi un lieu et des humains.
 *
 * Mobile : piste horizontale scroll-snap (le geste natif) ; desktop : mosaïque.
 */
const PHOTOS = [
  {
    src: '/boutique/allee.webp',
    alt: "L'allée centrale de la boutique BodyStart Nutrition à Coignières, rayons de compléments alimentaires pleins",
    // Portrait — pilier gauche de la mosaïque
    tall: true,
  },
  {
    src: '/boutique/rayon-proteines.webp',
    alt: 'Le rayon protéines de la boutique BodyStart : whey, isolate et caséine en libre accès',
    tall: false,
  },
  {
    src: '/boutique/comptoir.webp',
    alt: 'Le comptoir de la boutique BodyStart Nutrition avec les barres protéinées',
    tall: false,
  },
  {
    src: '/boutique/rayon-preworkout.webp',
    alt: 'Le rayon pré-workout, BCAA et créatine de la boutique BodyStart à Coignières',
    tall: false,
  },
] as const

const FACTS = [
  { value: '13 ans', label: 'de conseil en nutrition' },
  { value: '7j/7', label: 'ouvert de 11h à 19h' },
  { value: '+2 600', label: 'clients conseillés' },
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

        {/* Mosaïque desktop / piste snap mobile */}
        <div
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-12 md:grid-rows-2 md:overflow-visible"
          aria-label="Photos de la boutique"
        >
          {/* Allée (portrait) — pilier gauche sur 2 rangées */}
          <div className="relative flex-shrink-0 w-[72%] sm:w-[46%] snap-center aspect-[3/4] md:w-auto md:aspect-auto md:col-span-4 md:row-span-2 rounded-2xl overflow-hidden border border-spruce/10">
            <Image
              src={PHOTOS[0].src}
              alt={PHOTOS[0].alt}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 33vw, 72vw"
            />
          </div>
          {/* Rayon protéines (paysage) — large en haut à droite */}
          <div className="relative flex-shrink-0 w-[72%] sm:w-[46%] snap-center aspect-[3/4] md:w-auto md:aspect-auto md:col-span-8 md:row-span-1 rounded-2xl overflow-hidden border border-spruce/10">
            <Image
              src={PHOTOS[1].src}
              alt={PHOTOS[1].alt}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 66vw, 72vw"
            />
          </div>
          {/* Comptoir + rayon pré-workout — 2 cases en bas à droite */}
          <div className="relative flex-shrink-0 w-[72%] sm:w-[46%] snap-center aspect-[3/4] md:w-auto md:aspect-auto md:col-span-4 md:row-span-1 rounded-2xl overflow-hidden border border-spruce/10">
            <Image
              src={PHOTOS[2].src}
              alt={PHOTOS[2].alt}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 33vw, 72vw"
            />
          </div>
          <div className="relative flex-shrink-0 w-[72%] sm:w-[46%] snap-center aspect-[3/4] md:w-auto md:aspect-auto md:col-span-4 md:row-span-1 rounded-2xl overflow-hidden border border-spruce/10">
            <Image
              src={PHOTOS[3].src}
              alt={PHOTOS[3].alt}
              fill
              className="object-cover"
              sizes="(min-width: 768px) 33vw, 72vw"
            />
          </div>
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
