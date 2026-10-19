import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import CarrouselBoutique from './CarrouselBoutique'

/**
 * Galerie boutique — VRAIES photos du magasin (fournies par Adam, 07/2026,
 * remplacées par celles du 14/10/2026, optimisées en webp dans
 * public/boutique/).
 *
 * Objectif (retour consultant + review) : le site disait « voici une boutique
 * de compléments » sans jamais la MONTRER. Cette section montre les rayons
 * pleins juste avant la carte pratique StoreCallV2.
 *
 * Layout : carrousel (CarrouselBoutique), sur mobile comme sur ordinateur.
 * Les photos sont toutes verticales, donc toutes les cartes aussi (3:4, un
 * seul cadrage par photo, valable à toutes les tailles) : environ 1,5 carte
 * visible sur mobile, 4 sur ordinateur, flèches à partir de md. Les cases
 * larges de l'ancienne mosaïque coupaient les photos en bandes (retour du
 * 14/10/2026) : ne pas y revenir.
 *
 * Images en chargement différé : la section est loin sous le pli, et les
 * cartes hors de la piste visible ne se chargent qu'en approchant.
 */
// Photos du 14/10/2026, dans l'ordre demandé (alternance clair / sombre).
// L'allée des acides aminés n'y est pas : elle illustre déjà le bloc conseil,
// plus haut sur l'accueil. `position` : cadrage (object-position) dans la
// carte 3:4, simulé photo par photo avant l'intégration.
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
    src: '/boutique/mur-nutrimuscle.webp',
    alt: 'Mur Nutrimuscle de la boutique BodyStart Nutrition : Protimuscle, Isolate Native Whey Mix, crème de riz et muesli devant le mur végétal',
    // étagère du haut entière, peu de sol
    position: 'object-[50%_55%]',
  },
  {
    src: '/boutique/pyramide-creatine.webp',
    alt: 'Pyramide de pots de créatine Dedicated en rayon chez BodyStart Nutrition à Coignières',
    // pyramide entière, du pot du haut à la dernière rangée
    position: 'object-[50%_30%]',
  },
  {
    src: '/boutique/rayon-snacks-boissons.webp',
    alt: 'Rayon snacks et boissons de la boutique BodyStart Nutrition à Coignières : canettes ABE et barres Crunch Warrior',
    // fichier déjà coupé au-dessus des étagères basses (vides) : seuls les
    // canettes et les barres restent
    position: 'object-center',
  },
  {
    src: '/boutique/protimuscle-detail.webp',
    alt: 'Gros plan sur les pots de Native Whey Protimuscle Nutrimuscle en rayon chez BodyStart Nutrition',
    // étiquettes Native Whey Mix et Protimuscle lisibles
    position: 'object-[50%_25%]',
  },
  {
    src: '/boutique/presentoir-gainer.webp',
    alt: 'Présentoir gainers, crèmes de riz et clear whey devant le rayon gainer de la boutique BodyStart Nutrition',
    // fichier déjà recadré en 3:4 au-dessus du sol (84 % du haut de la photo)
    position: 'object-center',
  },
  {
    src: '/boutique/mur-nutrimuscle-2.webp',
    alt: 'Mur Nutrimuscle vu de près dans la boutique BodyStart Nutrition : Native Whey Protimuscle, Cluster Dextrin et muesli protéiné dans les étagères blanches',
    // photo déjà en 3:4 : rien n'est coupé
    position: 'object-center',
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
        <CarrouselBoutique
          label="Photos de la boutique"
          entete={
            <div className="max-w-[640px]">
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
          }
        >
          {PHOTOS.map((photo, i) => (
            <div
              key={photo.src}
              role="group"
              aria-roledescription="diapositive"
              aria-label={`${i + 1} sur ${PHOTOS.length}`}
              className="relative flex-shrink-0 w-[62%] sm:w-[40%] md:w-[30%] lg:w-[calc((100%-3rem)/4)] snap-start aspect-[3/4] rounded-2xl overflow-hidden border border-spruce/10"
            >
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                className={cn('object-cover', photo.position)}
                // ordinateur : 4 cartes de 272 px au plus (conteneur de 1200 px)
                sizes="(min-width: 1024px) 272px, (min-width: 768px) 30vw, (min-width: 640px) 40vw, 62vw"
              />
            </div>
          ))}
        </CarrouselBoutique>

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
            className="inline-flex min-h-[44px] items-center gap-2 text-[14px] font-semibold text-spruce hover:text-fresh-deep transition-colors underline underline-offset-4 souligne-saison flex-shrink-0"
          >
            Pourquoi choisir BodyStart ?
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
