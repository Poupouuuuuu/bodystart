import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Galerie boutique — VRAIES photos du magasin (fournies par Adam, 07/2026,
 * remplacées par celles du 14/10/2026, optimisées en webp dans
 * public/boutique/).
 *
 * Objectif (retour consultant + review) : le site disait « voici une boutique
 * de compléments » sans jamais la MONTRER. Cette section montre les rayons
 * pleins juste avant la carte pratique StoreCallV2.
 *
 * Layout : les photos sont toutes verticales, donc toutes les cases aussi
 * (3:4, même format sur mobile et ordinateur, un seul cadrage par photo).
 *  - mobile et tablette : piste horizontale scroll-snap (le geste natif) ;
 *  - ordinateur (lg) : une rangée de 4 cases.
 * Les cases larges de l'ancienne mosaïque coupaient les photos en bandes
 * (retour du 14/10/2026) : ne pas y revenir.
 */
// Photos du 14/10/2026. Quatre sujets distincts, alternance clair / sombre.
// L'allée des acides aminés n'y est plus : elle illustre déjà le bloc conseil,
// plus haut sur l'accueil. `position` : cadrage (object-position) dans la case 3:4,
// simulé photo par photo avant l'intégration.
const PHOTOS = [
  {
    src: '/boutique/presentoir-nutrimuscle.webp',
    alt: "Présentoir Nutrimuscle au centre de la boutique BodyStart Nutrition à Coignières : Native Iso Blend, Protimuscle, protéine d'œuf et crème de riz",
    // photo déjà en 3:4 : rien n'est coupé
    position: 'object-center',
  },
  {
    src: '/boutique/rayon-creatine-gainer.webp',
    alt: 'Rayon créatine et gainer de la boutique BodyStart Nutrition à Coignières',
    // enseigne « Créatine » et tous ses produits, puis l'enseigne « Gainer »
    position: 'object-[50%_15%]',
  },
  {
    src: '/boutique/rayon-snacks-boissons.webp',
    alt: 'Rayon snacks et boissons de la boutique BodyStart Nutrition à Coignières : canettes ABE et barres Crunch Warrior',
    // fichier déjà coupé au-dessus des étagères basses (vides) : seuls les
    // canettes et les barres restent
    position: 'object-center',
  },
  {
    src: '/boutique/pyramide-creatine.webp',
    alt: 'Pyramide de pots de créatine Dedicated en rayon chez BodyStart Nutrition à Coignières',
    // pyramide entière, du pot du haut à la dernière rangée
    position: 'object-[50%_30%]',
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

        {/* Piste snap mobile et tablette / rangée de 4 sur ordinateur. Chaque
            case garde son aspect 3:4 : la hauteur ne dépend pas de la grille. */}
        <div
          className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 lg:pb-0 lg:grid lg:grid-cols-4 lg:overflow-visible"
          aria-label="Photos de la boutique"
        >
          {PHOTOS.map((photo) => (
            <div
              key={photo.src}
              className="relative flex-shrink-0 w-[72%] sm:w-[46%] lg:w-auto snap-center aspect-[3/4] rounded-2xl overflow-hidden border border-spruce/10"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className={cn('object-cover', photo.position)}
                // ordinateur : 4 cases de 272 px au plus (conteneur de 1200 px)
                sizes="(min-width: 1024px) 272px, (min-width: 640px) 46vw, 72vw"
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
