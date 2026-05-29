import Image from 'next/image'
import { Package } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Visuel composite d'un bundle : les pots des composants empilés sur le
 * fond végétal de marque (Background.webp). Source unique partagée entre :
 *   - les cartes /packs (PackCardV2)          → variant="card"
 *   - la vignette panier (CartDrawer)         → variant="thumb"
 *
 * Les bundles n'ont pas d'image propre (volontaire) : on construit le visuel
 * à partir des images des composants. On évite ainsi de dupliquer le markup
 * "pots empilés sur fond végétal" dans chaque contexte.
 *
 * Le composant gère trois cas, dans l'ordre :
 *   1. images de composants présentes → pile sur fond végétal
 *   2. sinon fallbackImage (featuredImage du bundle si elle existe) → image seule
 *   3. sinon placeholder (icône Package par défaut)
 */
export interface BundleCompositeImage {
  url: string
  altText?: string | null
}

interface BundleCompositeProps {
  images: BundleCompositeImage[]
  alt: string
  /** Forme/taille de la box extérieure (aspect-ratio, arrondi, etc.). */
  className?: string
  /** 'card' = grandes cartes /packs ; 'thumb' = vignette panier (compacte). */
  variant?: 'card' | 'thumb'
  /** Image de repli si aucun composant (rare : bundle avec featuredImage). */
  fallbackImage?: BundleCompositeImage | null
  /** Placeholder ultime si ni composants ni fallback. */
  placeholder?: ReactNode
  sizes?: string
  priority?: boolean
}

const MAX_POTS = 5

export default function BundleComposite({
  images,
  alt,
  className = '',
  variant = 'card',
  fallbackImage = null,
  placeholder,
  sizes,
  priority = false,
}: BundleCompositeProps) {
  const isThumb = variant === 'thumb'
  const shown = images.slice(0, MAX_POTS)
  const n = shown.length

  // Chevauchement des pots selon le nombre + la densité (card vs thumb).
  const overlap = isThumb
    ? n >= 4
      ? '-space-x-3'
      : n === 3
        ? '-space-x-2.5'
        : '-space-x-1.5'
    : n >= 4
      ? '-space-x-6 md:-space-x-8'
      : n === 3
        ? '-space-x-4 md:-space-x-6'
        : '-space-x-2 md:-space-x-3'

  const padClass = isThumb ? 'pb-1.5 px-1.5' : 'pb-3 md:pb-4 px-3'

  // Dans les DEUX variantes : largeur égale par pot (flex-1) + hauteur auto
  // (par aspect-ratio). On évite toute hauteur en % (ex h-[72%]) qui
  // s'effondre à 0 quand aucun ancêtre n'a de hauteur définie — c'était le
  // bug de la vignette panier (carré blanc).
  const imgClass = `flex-1 w-0 min-w-0 h-auto object-contain ${
    isThumb ? 'drop-shadow-sm' : 'drop-shadow-2xl'
  }`

  const intrinsic = isThumb ? 72 : 260

  return (
    <div
      className={`relative ${
        // thumb : remplit explicitement le slot dimensionné du panier
        // (h-24/w-20) pour ne jamais s'effondrer à 0×0. card : le parent
        // <div relative aspect-square> + className="absolute inset-0" gère.
        isThumb ? 'w-full h-full' : ''
      } bg-cover bg-bottom bg-no-repeat overflow-hidden ${className}`}
      style={{ backgroundImage: "url('/Background.webp')" }}
    >
      {n > 0 ? (
        <div className={`absolute inset-0 flex items-end justify-center ${padClass}`}>
          <div
            className={`flex items-end justify-center w-full ${overlap} ${
              isThumb ? '' : 'transition-transform duration-500 group-hover:scale-[1.03]'
            }`}
          >
            {shown.map((img, i) => (
              <Image
                key={`${img.url}-${i}`}
                src={img.url}
                alt={i === 0 ? alt : ''}
                width={intrinsic}
                height={intrinsic}
                sizes={sizes}
                priority={priority && i === 0}
                className={imgClass}
                style={{ zIndex: 10 + i }}
              />
            ))}
          </div>
        </div>
      ) : fallbackImage ? (
        <div className={`absolute inset-0 flex items-end justify-center ${padClass}`}>
          <Image
            src={fallbackImage.url}
            alt={fallbackImage.altText ?? alt}
            width={intrinsic}
            height={intrinsic}
            sizes={sizes}
            priority={priority}
            className={`relative z-10 w-auto ${
              isThumb ? 'h-[80%]' : 'h-[85%]'
            } object-contain ${isThumb ? 'drop-shadow-sm' : 'drop-shadow-2xl'} ${
              isThumb ? '' : 'transition-transform duration-500 group-hover:scale-105'
            }`}
          />
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          {placeholder ?? <Package className={isThumb ? 'w-8 h-8 text-spruce/30' : 'w-14 h-14 text-spruce/30'} />}
        </div>
      )}

      {/* Fondu blanc en bas (cohérent dans les deux contextes). */}
      <div className="absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-t from-white to-transparent z-0" />
    </div>
  )
}
