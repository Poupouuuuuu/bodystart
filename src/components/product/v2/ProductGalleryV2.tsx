'use client'

import { useEffect, useRef, useState } from 'react'
import Image from '@/components/ui/Image'
import { cn } from '@/lib/utils'
import type { ShopifyImage } from '@/lib/shopify/types'
import { ChevronLeft, ChevronRight, X, ZoomIn } from 'lucide-react'
import { altImage } from '@/lib/alt-produit'

/** Hauteur de la photo sous sm, partagée avec BundleGalleryV2 (premier écran du téléphone). */
export const HAUTEUR_MOBILE = 'max-sm:h-[clamp(180px,28svh,260px)]'

interface ProductGalleryV2Props {
  images: ShopifyImage[]
  title: string
  /** Texte alternatif des images sans texte saisi dans Shopify (lib/alt-produit). */
  alt?: string
  discountPct: number | null
  selectedIndex?: number
  /** Index de l'image affichée au chargement : c'est elle qui est préchargée (LCP). */
  priorityIndex?: number
  onImageChange?: (index: number) => void
}

/**
 * Galerie V2 — palette DA claire + fond vegetal bg-vegetal-800.webp (coherent /products + home).
 * Cf. tech-specs/redesign-v2-direction-artistique.md §B.Fiche produit.1
 */
export default function ProductGalleryV2({
  images,
  title,
  alt = title,
  discountPct,
  selectedIndex: controlledIndex,
  priorityIndex = 0,
  onImageChange,
}: ProductGalleryV2Props) {
  const [internalIndex, setInternalIndex] = useState(0)
  const [isLightboxOpen, setIsLightboxOpen] = useState(false)
  // Zoom lightbox : l'image « plein écran » restait à ~la taille de l'écran —
  // impossible de lire une étiquette de composition sur téléphone. Un tap sur
  // l'image bascule à 250 % avec déplacement au doigt (scroll natif).
  const [isZoomed, setIsZoomed] = useState(false)

  const selectedIndex = controlledIndex ?? internalIndex
  const currentImage = images[selectedIndex] ?? null

  const handleSelect = (i: number) => {
    setInternalIndex(i)
    onImageChange?.(i)
  }

  // Swipe horizontal sur l'image principale (geste n°1 d'une galerie mobile).
  // Seuils : ≥48 px ET nettement plus horizontal que vertical — un tap ou un
  // scroll de page ne déclenchent rien ; le navigateur supprime de lui-même le
  // click après un vrai swipe, donc pas de conflit avec l'ouverture lightbox.
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current
    touchStart.current = null
    if (!start || images.length < 2) return
    const dx = e.changedTouches[0].clientX - start.x
    const dy = e.changedTouches[0].clientY - start.y
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.5) return
    const next = (selectedIndex + (dx < 0 ? 1 : -1) + images.length) % images.length
    handleSelect(next)
  }

  // Retour à l'échelle 1 quand on ferme ou change d'image.
  useEffect(() => {
    setIsZoomed(false)
  }, [isLightboxOpen, selectedIndex])

  // Verrou scroll lightbox — dans un useEffect (l'ancien code mutait le DOM
  // PENDANT le render, anti-pattern React qui combattait aussi le verrou du
  // CartDrawer via son 'unset' à chaque re-render) et sur <html> ET <body>
  // (c'est <html> qui scrolle en mode standards, body seul ne suffisait pas).
  const closeLightboxBtnRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!isLightboxOpen) return
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    // Focus initial + fermeture Escape (la lightbox était inaccessible clavier).
    closeLightboxBtnRef.current?.focus()
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setIsLightboxOpen(false)
      // Trap trivial : le bouton Fermer est le SEUL focusable de la lightbox —
      // Tab ne doit pas partir parcourir la page derrière l'overlay.
      if (e.key === 'Tab') {
        e.preventDefault()
        closeLightboxBtnRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isLightboxOpen])

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Image principale avec fond vegetal */}
        {/* PREMIUM V2 vague 3 : bordure retirée au profit d'une ombre teintée
            verte (même langage que les cartes produit) et rayon porté à 24px —
            l'image est le premier vendeur, elle doit avoir la présence du hero
            plutôt que celle d'un cadre administratif. */}
        {/* PERF : le fond vegetal etait un background CSS -> decouvert apres le
            CSS, non preload, et c'est LUI le plus grand element peint (LCP) sur
            mobile. En <Image priority>, il est preload avec le HTML.
            `unoptimized` : fichier deja leger (800 px, 20 Ko, flou qui ne
            perd rien) et MEME URL que le fond des cartes produit plus bas
            (cross-sell) : un seul telechargement par fiche au lieu de deux
            (43 + 44 Ko avant le 08/10/2026). */}
        {/* saison-toile, saison-badge-citrouille : déco du thème pendant une
            période décorée (components/saison/halloween/styles.ts). */}
        {/* Téléphone (28/11/2026) : photo réduite à ~28 % de la hauteur d'écran
            (entre 180 et 260 px) pour que nom, prix, choix et bouton d'achat
            tiennent au premier écran. Sans svh (vieux navigateurs), la
            hauteur est ignorée et le 4/3 reprend la main. */}
        <div className={cn('saison-toile group pointer-events-none relative flex aspect-[4/3] sm:aspect-square w-full items-center justify-center overflow-hidden rounded-[24px] bg-sage shadow-card', HAUTEUR_MOBILE)}>
          <Image
            src="/bg-vegetal-800.webp"
            alt=""
            aria-hidden="true"
            fill
            priority
            unoptimized
            className="object-cover"
          />
          {currentImage ? (
            // <button> (était un div onClick) : le zoom était inatteignable au
            // clavier — important pour lire une étiquette de composition.
            <button
              type="button"
              aria-label="Agrandir l'image"
              className="pointer-events-auto relative h-[85%] w-[85%] cursor-zoom-in motion-safe:animate-float"
              onClick={() => setIsLightboxOpen(true)}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <Image
                key={currentImage.url}
                src={currentImage.url}
                alt={altImage(currentImage, alt)}
                fill
                // Une SEULE ombre portée, TEINTÉE verte : le cumul précédent
                // (drop-shadow-2xl sur le bouton + une ombre noire ici) grisait
                // le fond végétal sous le produit.
                className="object-contain [filter:drop-shadow(0_22px_28px_rgba(45,90,45,0.30))] transition-transform duration-500 ease-out-expo group-hover:scale-[1.06]"
                priority={selectedIndex === priorityIndex}
                // `priority` précharge sans priorité réseau haute (Next 15) :
                // l'image produit est le LCP de la fiche, elle passe devant.
                fetchPriority={selectedIndex === priorityIndex ? 'high' : undefined}
                // Téléphone : la photo occupe au plus ~70 % de la largeur
                // (hauteur réduite) ; une variante plus légère suffit.
                sizes="(max-width: 639px) 70vw, (max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="bg-white/85 backdrop-blur-sm text-spruce p-3 rounded-full shadow-lg">
                  <ZoomIn className="w-5 h-5" />
                </div>
              </div>
            </button>
          ) : (
            <div className="text-spruce/40 text-5xl font-extrabold">BS</div>
          )}

          {/* Téléphone : flèches et compteur à la place des vignettes (qui
              prenaient 84 px sous la photo). Le glissé du doigt marche aussi. */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => handleSelect((selectedIndex - 1 + images.length) % images.length)}
                aria-label="Image précédente"
                className="pointer-events-auto absolute left-1 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-spruce sm:hidden"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/85 shadow-soft">
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleSelect((selectedIndex + 1) % images.length)}
                aria-label="Image suivante"
                className="pointer-events-auto absolute right-1 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-spruce sm:hidden"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/85 shadow-soft">
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </button>
              <span className="absolute bottom-2.5 right-3 z-20 rounded-full bg-white/85 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-spruce shadow-soft sm:hidden">
                {selectedIndex + 1}/{images.length}
              </span>
            </>
          )}

          {discountPct && (
            <div className="absolute top-4 right-4 pointer-events-auto">
              {/* Étiquette à coins doux, comme sur les cartes produit (vague 2). */}
              <span className="saison-badge-citrouille inline-flex items-center rounded-lg bg-terracotta px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white shadow-soft">
                -{discountPct}%
              </span>
            </div>
          )}
        </div>

        {/* Vignettes, à partir de sm. Sous sm (28/11/2026) : flèches et
            compteur sur la photo (avant : une rangée qui défilait au doigt,
            84 px de plus avant le titre et le prix). */}
        {images.length > 1 && (
          <div className="hidden gap-2.5 sm:flex sm:flex-wrap sm:pb-1 sm:pt-1">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(i)}
                className={cn(
                  // Vignettes : plus de bordure permanente. Au repos, une ombre
                  // douce ; la sélection se signale par un anneau vert franc et
                  // un léger grossissement (plus lisible qu'un jeu d'opacités).
                  'relative h-16 w-16 flex-shrink-0 cursor-pointer overflow-hidden rounded-xl bg-white transition-all duration-200 ease-out-expo sm:h-[72px] sm:w-[72px]',
                  selectedIndex === i
                    ? 'ring-2 ring-spruce shadow-card scale-[1.04]'
                    : 'shadow-soft opacity-80 hover:opacity-100 hover:shadow-card'
                )}
                aria-label={`Voir image ${i + 1}`}
              >
                <Image
                  src={img.url}
                  alt={altImage(img, alt)}
                  fill
                  className="object-contain p-2"
                  sizes="72px"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* LIGHTBOX */}
      {isLightboxOpen && currentImage && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/90 backdrop-blur-md animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${title}, vue plein écran`}
        >
          <button
            ref={closeLightboxBtnRef}
            onClick={(e) => {
              e.stopPropagation()
              setIsLightboxOpen(false)
            }}
            className="absolute top-6 right-6 lg:top-10 lg:right-10 bg-white/20 hover:bg-white text-white hover:text-ink p-3 rounded-full transition-colors z-[10000]"
            aria-label="Fermer la vue plein écran"
          >
            <X className="w-6 h-6" />
          </button>

          {isZoomed ? (
            /* Zoom 250 % : conteneur scrollable (pan au doigt/molette), un tap
               sur l'image revient à l'échelle normale. */
            <div
              className="w-full h-[88vh] max-w-5xl overflow-auto overscroll-contain cursor-zoom-out"
              onClick={(e) => {
                e.stopPropagation()
                setIsZoomed(false)
              }}
            >
              <div className="relative w-[250%] h-[250%]">
                <Image
                  src={currentImage.url}
                  alt={altImage(currentImage, alt)}
                  fill
                  className="object-contain"
                  sizes="250vw"
                />
              </div>
            </div>
          ) : (
            <div
              className="relative w-full h-[80vh] max-w-5xl px-4 lg:px-0 cursor-zoom-in"
              onClick={(e) => {
                e.stopPropagation()
                setIsZoomed(true)
              }}
            >
              <Image
                src={currentImage.url}
                alt={altImage(currentImage, alt)}
                fill
                className="object-contain"
                sizes="100vw"
              />
              <p className="absolute bottom-4 inset-x-0 text-center text-white/70 text-[12px] font-medium pointer-events-none">
                Touche l&apos;image pour zoomer
              </p>
            </div>
          )}
        </div>
      )}
    </>
  )
}
