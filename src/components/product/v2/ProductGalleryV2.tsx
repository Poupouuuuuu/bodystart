'use client'

import { useState } from 'react'
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
 * Galerie V2 — palette DA claire + fond vegetal Background.webp (coherent /products + home).
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

  const selectedIndex = controlledIndex ?? internalIndex
  const currentImage = images[selectedIndex] ?? null

  const handleSelect = (i: number) => {
    setInternalIndex(i)
    onImageChange?.(i)
  }

  // Prevent scrolling when lightbox is open
  if (typeof window !== 'undefined') {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Image principale avec fond vegetal */}
        <div
          className="relative w-full aspect-square flex items-center justify-center pointer-events-none group rounded-2xl bg-cover bg-center overflow-hidden border border-spruce/10"
          style={{ backgroundImage: "url('/Background.webp')" }}
        >
          {currentImage ? (
            <div
              className="relative w-[85%] h-[85%] animate-float drop-shadow-2xl pointer-events-auto cursor-zoom-in"
              onClick={() => setIsLightboxOpen(true)}
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
            </div>
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
        >
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsLightboxOpen(false)
            }}
            className="absolute top-6 right-6 lg:top-10 lg:right-10 bg-white/20 hover:bg-white text-white hover:text-ink p-3 rounded-full transition-colors z-[10000]"
            aria-label="Fermer la vue plein écran"
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="relative w-full h-[80vh] max-w-5xl px-4 lg:px-0"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={currentImage.url}
              alt={currentImage.altText ?? title}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </>
  )
}
