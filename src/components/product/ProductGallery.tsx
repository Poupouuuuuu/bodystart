'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { ShopifyImage } from '@/lib/shopify/types'
import { X, ZoomIn } from 'lucide-react'

interface ProductGalleryProps {
  images: ShopifyImage[]
  title: string
  discountPct: number | null
  selectedIndex?: number
  onImageChange?: (index: number) => void
}

export default function ProductGallery({ images, title, discountPct, selectedIndex: controlledIndex, onImageChange }: ProductGalleryProps) {
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
      <div className="flex flex-col gap-6">
        {/* Image principale (Floating) */}
        <div 
          className="relative w-full aspect-square flex items-center justify-center pointer-events-none group rounded-[32px] bg-cover bg-center overflow-hidden border border-[#1a2e23]/5"
          style={{ backgroundImage: "url('/Background.webp')" }}
        >
          {/* Subtle overlay to soften the background */}
          <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />

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
                <div className="bg-white/80 backdrop-blur-sm text-[#2c3e2e] p-4 rounded-full shadow-xl">
                  <ZoomIn className="w-6 h-6" />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-[#89b397] text-6xl font-black">BS</div>
          )}

          {discountPct && (
            <div className="absolute top-0 right-10 pointer-events-auto">
              <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-black uppercase tracking-widest bg-[#2c3e2e] text-white shadow-xl">
                -{discountPct}%
              </span>
            </div>
          )}
        </div>

        {/* Vignettes horizontales (clean & minimal) */}
        {images.length > 1 && (
          <div className="flex justify-center gap-4 mt-4">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSelect(i)}
                className={cn(
                  'relative w-16 h-16 flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300',
                  selectedIndex === i
                    ? 'ring-2 ring-[#2c3e2e] scale-110 shadow-lg bg-white/50'
                    : 'opacity-60 hover:opacity-100 bg-white/20'
                )}
                aria-label={`Voir image ${i + 1}`}
              >
                <Image
                  src={img.url}
                  alt={img.altText ?? `${title} - image ${i + 1}`}
                  fill
                  className="object-contain p-2"
                  sizes="64px"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* LIGHTBOX PLEIN ECRAN */}
      {isLightboxOpen && currentImage && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close button */}
          <button 
            onClick={(e) => {
              e.stopPropagation()
              setIsLightboxOpen(false)
            }}
            className="absolute top-6 right-6 lg:top-10 lg:right-10 bg-white/20 hover:bg-white text-white hover:text-black p-3 rounded-full transition-colors z-[10000]"
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

          {/* Thumbnails in Lightbox */}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 px-4 overflow-x-auto pb-4">
              {images.map((img, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelect(i)}
                  className={cn(
                    'relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden transition-all duration-300',
                    selectedIndex === i
                      ? 'ring-2 ring-white scale-110 shadow-lg bg-white/10'
                      : 'opacity-50 hover:opacity-100 bg-black/50 hover:bg-white/10'
                  )}
                >
                  <Image
                    src={img.url}
                    alt={img.altText ?? `${title} - miniature`}
                    fill
                    className="object-contain p-2"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
