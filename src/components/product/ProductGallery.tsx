'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import type { ShopifyImage } from '@/lib/shopify/types'

interface ProductGalleryProps {
  images: ShopifyImage[]
  title: string
  discountPct: number | null
  selectedIndex?: number
  onImageChange?: (index: number) => void
}

export default function ProductGallery({ images, title, discountPct, selectedIndex: controlledIndex, onImageChange }: ProductGalleryProps) {
  const [internalIndex, setInternalIndex] = useState(0)
  const selectedIndex = controlledIndex ?? internalIndex
  const currentImage = images[selectedIndex] ?? null

  const handleSelect = (i: number) => {
    setInternalIndex(i)
    onImageChange?.(i)
  }

  return (
    <div className="flex gap-4">
      {/* Vignettes en colonne verticale à gauche */}
      {images.length > 1 && (
        <div className="hidden sm:flex flex-col gap-3 flex-shrink-0 max-h-[500px] overflow-y-auto">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(i)}
              className={cn(
                'relative w-16 h-16 flex-shrink-0 bg-cream-50 rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200',
                selectedIndex === i
                  ? 'border-brand-500 shadow-md'
                  : 'border-cream-300 hover:border-brand-300'
              )}
              aria-label={`Voir image ${i + 1}`}
            >
              <Image
                src={img.url}
                alt={img.altText ?? `${title} - image ${i + 1}`}
                fill
                className="object-cover p-1"
                sizes="64px"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}

      {/* Image principale */}
      <div className="relative flex-1 aspect-square bg-cream-50 rounded-2xl overflow-hidden border border-cream-300">
        {currentImage ? (
          <Image
            key={currentImage.url}
            src={currentImage.url}
            alt={currentImage.altText ?? title}
            fill
            className="object-contain p-6 transition-opacity duration-300"
            priority={selectedIndex === 0}
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-brand-200 text-6xl font-bold">BS</span>
          </div>
        )}
        {discountPct && (
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
              -{discountPct}%
            </span>
          </div>
        )}
      </div>

      {/* Vignettes horizontales en mobile (quand la colonne est cachée) */}
      {images.length > 1 && (
        <div className="sm:hidden absolute -bottom-16 left-0 right-0 flex gap-2 overflow-x-auto pb-2">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSelect(i)}
              className={cn(
                'relative w-14 h-14 flex-shrink-0 bg-cream-50 rounded-xl overflow-hidden border-2 cursor-pointer transition-all duration-200',
                selectedIndex === i
                  ? 'border-brand-500'
                  : 'border-cream-300'
              )}
              aria-label={`Voir image ${i + 1}`}
            >
              <Image
                src={img.url}
                alt={img.altText ?? `${title} - image ${i + 1}`}
                fill
                className="object-cover p-0.5"
                sizes="56px"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
