'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { BundleComponentImage } from '@/lib/shopify/bundle'

interface BundleGalleryV2Props {
  components: BundleComponentImage[]
  title: string
  discountPct: number | null
}

/**
 * Galerie V2 specifique aux bundles (Shopify Bundles).
 * Cf. tech-specs/redesign-v2-direction-artistique.md §B.Fiche pack
 *
 * Source de verite visuelle : les featured images des produits composants
 * du bundle. Les bundles n'ont pas (et n'auront pas) d'image propre.
 *
 * Rendu :
 * - Hero : pots des composants en ligne, leger overlap, sur Background.webp
 *   (coherent avec PackCardV2 mais en plus grand).
 * - Sous le hero : strip horizontale avec les noms des composants
 *   (et leur quantite si > 1), chaque carte cliquable vers la fiche.
 *
 * Choix de design (libre arbitre Adam) : grille empilee plutot que
 * carousel. Le pack vit dans son ensemble, on veut tout voir d'un coup,
 * pas swiper sequentiellement. Aucune interaction necessaire = friction
 * zero pour comprendre ce qu'on achete.
 */
export default function BundleGalleryV2({
  components,
  title,
  discountPct,
}: BundleGalleryV2Props) {
  if (components.length === 0) {
    // Securite : ce composant ne devrait etre rendu que si components > 0
    // (la fiche fait deja la detection). Mais on garde un fallback propre.
    return (
      <div
        className="aspect-square w-full bg-cover bg-bottom rounded-2xl border border-spruce/10"
        style={{ backgroundImage: "url('/Background.webp')" }}
        aria-label={title}
      />
    )
  }

  // Echelle des pots selon le count : plus on a de composants, plus on
  // resserre l'overlap et reduit la hauteur, pour rester lisible.
  const overlapClass =
    components.length >= 4
      ? '-space-x-10 md:-space-x-14'
      : components.length === 3
        ? '-space-x-6 md:-space-x-10'
        : '-space-x-3 md:-space-x-6'

  const heightPct =
    components.length >= 4 ? '60%' : components.length === 3 ? '68%' : '74%'

  return (
    <div className="w-full">
      {/* ─── Hero : pots empiles sur fond vegetal ─── */}
      <div
        className="relative w-full aspect-square bg-cover bg-bottom bg-no-repeat overflow-hidden rounded-2xl border border-spruce/10"
        style={{ backgroundImage: "url('/Background.webp')" }}
      >
        {/* Badge promo eventuel (coherence avec ProductGalleryV2) */}
        {discountPct !== null && (
          <div className="absolute top-4 left-4 z-30 bg-terracotta text-white text-[12px] font-bold px-3 py-1.5 rounded-full shadow-sm">
            −{discountPct}%
          </div>
        )}

        <div className="absolute inset-0 flex items-end justify-center pb-8 md:pb-10">
          <div className={`flex items-end justify-center ${overlapClass}`}>
            {components.slice(0, 5).map((c, i) => (
              <div
                key={`${c.url}-${i}`}
                className="relative"
                style={{ height: heightPct, zIndex: 10 + i }}
                title={c.productTitle}
              >
                <Image
                  src={c.url}
                  alt={c.altText ?? c.productTitle}
                  width={420}
                  height={420}
                  priority={i === 0}
                  className="h-full w-auto object-contain drop-shadow-2xl"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Gradient bas pour fondu avec la carte parente */}
        <div className="absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-t from-white/60 to-transparent" />
      </div>

      {/* ─── Strip composants : noms + lien vers chaque produit ─── */}
      <div className="mt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3">
          Dans ce pack
        </p>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {components.map((c, i) => (
            <li key={`${c.productHandle}-${i}`}>
              <Link
                href={`/products/${c.productHandle}`}
                className="group flex items-center gap-3 bg-white border border-spruce/10 rounded-xl p-2.5 hover:border-spruce/30 transition-colors"
              >
                <div className="relative w-10 h-10 flex-shrink-0 bg-sage/40 rounded-lg overflow-hidden">
                  <Image
                    src={c.url}
                    alt={c.altText ?? c.productTitle}
                    fill
                    sizes="40px"
                    className="object-contain p-1"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] font-semibold text-ink leading-tight truncate group-hover:text-spruce transition-colors">
                    {c.productTitle}
                  </p>
                  {c.quantity > 1 && (
                    <p className="text-[11px] text-ink-mute">×{c.quantity}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
