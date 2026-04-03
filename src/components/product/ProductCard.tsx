'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart } from 'lucide-react'
import { formatPrice, getDiscountPercentage, cn } from '@/lib/utils'
import type { ShopifyProduct } from '@/lib/shopify/types'
import { useCart } from '@/hooks/useCart'
import { useState } from 'react'

interface ProductCardProps {
  product: ShopifyProduct
  className?: string
}

export default function ProductCard({ product, className }: ProductCardProps) {
  const variant = product.variants.nodes[0]
  const isAvailable = variant?.availableForSale ?? false
  const discount = variant ? getDiscountPercentage(variant.price, variant.compareAtPrice) : null
  const { addItem } = useCart()
  const [adding, setAdding] = useState(false)

  async function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault()
    if (!variant || !isAvailable) return
    setAdding(true)
    await addItem(variant.id)
    setAdding(false)
  }

  return (
    <div className={cn(
      'group relative flex flex-col bg-white rounded-2xl overflow-hidden border border-cream-300',
      'hover:shadow-md hover:-translate-y-1 transition-all duration-300',
      className
    )}>
      {/* ─── Image ─── */}
      <Link
        href={`/products/${product.handle}`}
        className="relative block overflow-hidden h-56 group/image"
        style={{ background: 'radial-gradient(circle at center, rgba(232, 240, 234, 0.8) 0%, white 70%)' }}
      >
        {product.featuredImage ? (
          <Image
            src={product.featuredImage.url}
            alt={product.featuredImage.altText ?? product.title}
            fill
            className="object-contain transition-transform duration-500 ease-out p-4 group-hover/image:scale-[1.04]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-cream-100">
            <span className="text-brand-200 text-5xl font-bold font-display">BS</span>
          </div>
        )}

        {/* Hover Text Overlay (from Mockup 3/4) */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center text-center p-4">
          <p className="text-white font-display font-medium text-lg leading-tight mb-2 drop-shadow-md">
            25g PROTEIN<br/>
            PLANT-BASED<br/>
            FAST ABSORPTION
          </p>
          <svg className="w-5 h-5 text-white mt-2 animate-bounce drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Badges superposés */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none z-10">
          {discount && discount >= 10 && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-500 text-white">
              -{discount}%
            </span>
          )}
          {!isAvailable && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-gray-900 text-white">
              Rupture
            </span>
          )}
        </div>
      </Link>

      {/* ─── Infos ─── */}
      <div className="flex flex-col flex-1 p-5">
        {/* Catégorie */}
        {product.productType && (
          <span className="text-[11px] font-semibold text-brand-500 uppercase tracking-wide mb-1.5">
            {product.productType}
          </span>
        )}

        {/* Titre */}
        <Link href={`/products/${product.handle}`}>
          <h3 className="font-display font-bold text-gray-900 text-sm leading-snug mb-2 hover:text-brand-500 transition-colors line-clamp-2 min-h-[2.5rem]">
            {product.title}
          </h3>
        </Link>

        {/* Prix */}
        <div className="flex items-baseline gap-2 mt-auto mb-4">
          <span className="font-bold text-brand-500 text-lg">
            {formatPrice(product.priceRange.minVariantPrice)}
          </span>
          {variant?.compareAtPrice && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(variant.compareAtPrice)}
            </span>
          )}
        </div>

        {/* Bouton Ajouter */}
        <button
          onClick={handleAddToCart}
          disabled={!isAvailable || adding}
          className={cn(
            'w-full flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-full transition-all duration-200',
            isAvailable && !adding
              ? 'bg-brand-500 text-white hover:bg-brand-600 shadow-md hover:shadow-lg'
              : 'bg-cream-200 text-gray-400 cursor-not-allowed'
          )}
        >
          {adding ? (
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <ShoppingCart className="w-4 h-4" />
          )}
          {adding ? 'Ajout...' : isAvailable ? 'Ajouter au panier' : 'Indisponible'}
        </button>
      </div>
    </div>
  )
}
