'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { Truck } from 'lucide-react'
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

  // When a variant is selected, find the matching image in the gallery
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

  // When a gallery image is clicked
  const handleImageChange = useCallback(
    (index: number) => {
      setSelectedImageIndex(index)
    },
    []
  )

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-20 items-center">
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
      <div>
        {/* Badge collection */}
        {collectionName && collectionHandle && (
          <Link
            href={`/collections/${collectionHandle}`}
            className="font-black text-xs uppercase tracking-widest text-[#345f44] mb-4 inline-block"
          >
            {collectionName}
          </Link>
        )}

        {/* Titre */}
        <h1 className="font-display text-4xl md:text-5xl font-black uppercase text-gray-900 mb-4 leading-none tracking-tighter">
          {productTitle}
        </h1>

        {/* Sélecteur de variante + prix + quantité + bouton panier */}
        <div className="mt-8">
          <ProductActions
            variants={variants}
            productTitle={productTitle}
            onVariantChange={handleVariantChange}
          />
        </div>

        {/* Livraison offerte */}
        <div className="flex items-center gap-2 mt-6 font-bold text-sm tracking-widest text-gray-400 uppercase">
          <Truck className="w-4 h-4 text-[#345f44]" />
          <span>LIVRAISON OFFERTE DÈS 75 €</span>
        </div>

        {/* Badge stock en boutique */}
        {activeStore && storeInventory[activeStore.id] !== undefined && (
          <div className="mt-6">
            {storeInventory[activeStore.id] > 0 ? (
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-[#e6efe1] rounded-full text-xs font-semibold text-[#345f44]">
                <span className="w-2 h-2 bg-[#345f44] rounded-full" />
                Disponible en boutique ({storeInventory[activeStore.id]} en stock)
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-2 bg-red-50 rounded-full text-xs font-semibold text-red-600">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                Indisponible en boutique
              </div>
            )}
          </div>
        )}

        {/* Click & Collect */}
        <div className="mt-4">
          <ClickAndCollect availableInStores={storeInventory} />
        </div>
      </div>
    </div>
  )
}
