'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart } from 'lucide-react'
import Badge from '@/components/ui/Badge'
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
  const { addItem, isLoading } = useCart()
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
      'group relative flex flex-col bg-white rounded-sm overflow-hidden border-2 border-gray-100',
      'hover:border-brand-700 hover:shadow-[4px_4px_0_theme(colors.gray.900)] hover:-translate-y-1 transition-all duration-200',
      className
    )}>
      {/* ─── Image ─── */}
      <Link href={`/products/${product.handle}`} className="relative block overflow-hidden bg-gray-50" style={{ aspectRatio: '1/1' }}>
        {product.featuredImage ? (
          <Image
            src={product.featuredImage.url}
            alt={product.featuredImage.altText ?? product.title}
            fill
            className="object-contain group-hover:scale-[1.04] transition-transform duration-500 ease-out p-2"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-50">
            <span className="text-brand-200 text-5xl font-bold font-display">BS</span>
          </div>
        )}

        {/* Badges superposés */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 pointer-events-none z-10">
          {discount && discount >= 10 && (
            <span className="inline-flex items-center px-2 py-1 rounded-sm text-[11px] font-black uppercase tracking-widest bg-red-500 text-white shadow-[2px_2px_0_theme(colors.red.900)]">
              -{discount}%
            </span>
          )}
          {!isAvailable && (
            <span className="inline-flex items-center px-2 py-1 rounded-sm text-[11px] font-black uppercase tracking-widest bg-gray-900 text-white shadow-[2px_2px_0_theme(colors.gray.950)]">
              Rupture
            </span>
          )}
        </div>
      </Link>

      {/* ─── Infos ─── */}
      <div className="flex flex-col flex-1 p-4">
        {/* Catégorie */}
        {product.productType && (
          <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest mb-1.5">
            {product.productType}
          </span>
        )}

        {/* Titre */}
        <Link href={`/products/${product.handle}`}>
          <h3 className="font-display font-black text-gray-900 text-sm uppercase tracking-tight leading-snug mb-2 hover:text-brand-700 transition-colors line-clamp-2 min-h-[2.5rem]">
            {product.title}
          </h3>
        </Link>

        {/* Prix */}
        <div className="flex items-baseline gap-2 mt-auto mb-4">
          <span className="font-bold text-gray-900 text-base">
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
            'w-full flex items-center justify-center gap-2 py-3 border-2 border-transparent text-xs tracking-wider uppercase font-black rounded-sm transition-all duration-150',
            isAvailable && !adding
              ? 'bg-brand-700 text-white hover:border-gray-900 hover:shadow-[3px_3px_0_theme(colors.gray.900)] hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none'
              : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
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
