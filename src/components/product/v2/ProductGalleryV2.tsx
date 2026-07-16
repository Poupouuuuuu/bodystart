'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { ShopifyImage } from '@/lib/shopify/types'
import { X, ZoomIn } from 'lucide-react'

interface ProductGalleryV2Props {
  images: ShopifyImage[]
  title: string
  discountPct: number | null
  selectedIndex?: number
  onImageChange?: (index: number) => void
}

/**
 * Galerie V2 — palette DA claire + fond vegetal bg-vegetal.webp (coherent /products + home).
 * Cf. tech-specs/redesign-v2-direction-artistique.md §B.Fiche produit.1
 */
export default function ProductGalleryV2({
  images,
  title,
  discountPct,
  selectedIndex: controlledIndex,
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
        <div
          className="relative w-full aspect-square flex items-center justify-center pointer-events-none group rounded-2xl bg-cover bg-center overflow-hidden border border-spruce/10"
          style={{ backgroundImage: "url('/bg-vegetal.webp')" }}
        >
          {currentImage ? (
            // <button> (était un div onClick) : le zoom était inatteignable au
            // clavier — important pour lire une étiquette de composition.
            <button
              type="button"
              aria-label="Agrandir l'image"
              className="relative w-[85%] h-[85%] motion-safe:animate-float drop-shadow-2xl pointer-events-auto cursor-zoom-in"
              onClick={() => setIsLightboxOpen(true)}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              <Image
                key={currentImage.url}
                src={currentImage.url}
                alt={currentImage.altText ?? title}
                fill
                className="object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.15)] transition-transform duration-500 group-hover:scale-105"
                priority={selectedIndex === 0}
                sizes="(max-width: 1024px) 100vw, 50vw"
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

          {discountPct && (
            <div className="absolute top-4 right-4 pointer-events-auto">
              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-terracotta text-white shadow">
                -{discountPct}%
              </span>
            </div>
          )}
        </div>

        {/* Vignettes */}
        {images.length > 1 && (
          <div className="flex flex-wrap gap-2.5">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(i)}
                className={cn(
                  'relative w-16 h-16 sm:w-[72px] sm:h-[72px] flex-shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all duration-200 bg-white border',
                  selectedIndex === i
                    ? 'border-spruce ring-1 ring-spruce'
                    : 'border-spruce/10 opacity-70 hover:opacity-100 hover:border-spruce/30'
                )}
                aria-label={`Voir image ${i + 1}`}
              >
                <Image
                  src={img.url}
                  alt={img.altText ?? `${title} - image ${i + 1}`}
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
          aria-label={`${title} — vue plein écran`}
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
                  alt={currentImage.altText ?? title}
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
                alt={currentImage.altText ?? title}
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
