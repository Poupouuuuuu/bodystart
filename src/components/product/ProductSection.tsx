'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Truck, Star } from 'lucide-react'
import ProductGallery from './ProductGallery'
import ProductActions from './ProductActions'
import ClickAndCollect from './ClickAndCollect'
import type { ShopifyImage, ShopifyProductVariant, BodyStartStore } from '@/lib/shopify/types'

interface ProductSectionProps {
  images: ShopifyImage[]
  variants: ShopifyProductVariant[]
  title: string
  discountPct: number | null
  productTitle: string
  collectionName: string | null
  collectionHandle: string | null
  activeStore?: BodyStartStore
  storeInventory: Record<string, number>
}

// Pseudo-random rating generator based on title (same as products page)
function getProductRating(title: string) {
  let hash = 0
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash)
  }
  const random = Math.abs(Math.sin(hash))
  const maxScore = 5.0
  const minScore = 4.3
  const score = minScore + random * (maxScore - minScore)
  const reviews = Math.floor(20 + Math.abs(Math.cos(hash)) * 300)
  return { score: score.toFixed(1), reviews }
}

export default function ProductSection({
  images,
  variants,
  title,
  discountPct,
  productTitle,
  collectionName,
  collectionHandle,
  activeStore,
  storeInventory,
}: ProductSectionProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const rating = getProductRating(productTitle)

  const handleVariantChange = useCallback(
    (variant: ShopifyProductVariant) => {
      if (variant.image?.url) {
        const matchIndex = images.findIndex(
          (img) => img.url === variant.image?.url
        )
        if (matchIndex >= 0) {
          setSelectedImageIndex(matchIndex)
        }
      }
    },
    [images]
  )

  const handleImageChange = useCallback(
    (index: number) => {
      setSelectedImageIndex(index)
    },
    []
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
      {/* Galerie — 50% */}
      <div className="relative">
        <ProductGallery
          images={images}
          title={title}
          discountPct={discountPct}
          selectedIndex={selectedImageIndex}
          onImageChange={handleImageChange}
        />
      </div>

      {/* Infos produit — 50% */}
      <div className="lg:pr-8">
        {/* Badge collection / Marque */}
        <Link
          href={collectionHandle ? `/products?cat=${collectionHandle}` : '/products'}
          className="font-bold text-[10px] uppercase tracking-[0.2em] text-[#4a5f4c] mb-4 inline-block"
        >
          {collectionName || 'BODY START NUTRITION'}
        </Link>

        {/* Titre */}
        <h1 className="text-4xl md:text-5xl font-black uppercase text-[#2c3e2e] mb-4 leading-[1.1] tracking-tight">
          {productTitle}
        </h1>

        {/* Stars */}
        <div className="flex items-center gap-2 mb-8">
          <div className="flex text-[#2c3e2e]">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="w-4 h-4 fill-current" />
            ))}
          </div>
          <span className="text-[13px] font-medium text-[#4a5f4c]">
            {rating.score}/5 ({rating.reviews} avis)
          </span>
        </div>

        {/* Sélecteur de variante + prix + quantité + bouton panier */}
        <div className="mt-8">
          <ProductActions
            variants={variants}
            productTitle={productTitle}
            onVariantChange={handleVariantChange}
          />
        </div>

        {/* Livraison / Réassurance */}
        <div className="flex flex-col gap-3 mt-8 pt-6 border-t border-[#2c3e2e]/10">
          <div className="flex items-center gap-3 font-bold text-[11px] tracking-widest text-[#2c3e2e] uppercase">
            <Truck className="w-4 h-4 text-[#4a5f4c]" />
            <span>LIVRAISON OFFERTE DÈS 85 €</span>
          </div>

          {/* Badge stock en boutique */}
          {activeStore && storeInventory[activeStore.id] !== undefined && (
            <div>
              {storeInventory[activeStore.id] > 0 ? (
                <div className="inline-flex items-center gap-2 text-[11px] font-bold text-[#2c3e2e] tracking-widest uppercase">
                  <span className="w-2 h-2 bg-[#89b397] rounded-full animate-pulse" />
                  Disponible en boutique ({storeInventory[activeStore.id]} en stock)
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 text-[11px] font-bold text-red-600 tracking-widest uppercase">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  Indisponible en boutique
                </div>
              )}
            </div>
          )}

          {/* Click & Collect */}
          <div className="mt-2 scale-90 origin-left">
            <ClickAndCollect availableInStores={storeInventory} />
          </div>
        </div>
      </div>
    </div>
  )
}
