'use client'
import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { formatPrice, getDiscountPercentage } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import type { ShopifyProductVariant } from '@/lib/shopify/types'

interface ProductActionsProps {
  variants: ShopifyProductVariant[]
  productTitle: string
}

export default function ProductActions({ variants, productTitle }: ProductActionsProps) {
  const [selectedVariant, setSelectedVariant] = useState<ShopifyProductVariant>(variants[0])
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()

  const discount = getDiscountPercentage(selectedVariant.price, selectedVariant.compareAtPrice)

  async function handleAddToCart() {
    if (!selectedVariant.availableForSale) return
    setAdding(true)
    try {
      await addItem(selectedVariant.id)
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div>
      {/* Prix */}
      <div className="flex items-baseline gap-3 mb-8">
        <span className="text-4xl lg:text-5xl font-black text-gray-900 leading-none tracking-tight">
          {formatPrice(selectedVariant.price)}
        </span>
        {selectedVariant.compareAtPrice && (
          <span className="text-lg text-gray-400 line-through">
            {formatPrice(selectedVariant.compareAtPrice)}
          </span>
        )}
        {discount && (
          <Badge variant="red">-{discount}%</Badge>
        )}
      </div>

      {/* Sélecteur de variantes */}
      {variants.length > 1 && (
        <div className="mb-8">
          <p className="text-[10px] uppercase font-black tracking-widest text-gray-900 mb-3">SÉLECTIONNER UNE VARIANTE :</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => variant.availableForSale && setSelectedVariant(variant)}
                disabled={!variant.availableForSale}
                className={
                  [
                    'px-4 py-2.5 rounded-sm border-2 text-[10px] font-black uppercase tracking-widest transition-all',
                    selectedVariant.id === variant.id
                      ? 'border-gray-900 bg-gray-900 text-white shadow-[2px_2px_0_theme(colors.gray.200)]'
                      : 'border-gray-200 text-gray-600 shadow-[2px_2px_0_theme(colors.gray.200)] hover:border-gray-900 hover:text-gray-900 hover:shadow-[2px_2px_0_theme(colors.gray.900)]',
                    !variant.availableForSale
                      ? 'opacity-40 cursor-not-allowed line-through shadow-none hover:shadow-none'
                      : 'cursor-pointer',
                  ].join(' ')
                }
              >
                {variant.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bouton Ajouter au panier */}
      <button
        onClick={handleAddToCart}
        disabled={!selectedVariant.availableForSale || adding}
        aria-label={`Ajouter ${productTitle} au panier`}
        className="w-full py-4 rounded-sm border-2 border-transparent bg-brand-700 hover:bg-brand-800 text-white font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-[4px_4px_0_theme(colors.brand.900)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0_theme(colors.brand.900)] transition-all"
      >
        {adding ? (
          <>
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Ajout en cours&hellip;
          </>
        ) : added ? (
          <>
            <Check className="w-5 h-5" />
            Ajouté !
          </>
        ) : selectedVariant.availableForSale ? (
          <>
            <ShoppingCart className="w-5 h-5" />
            Ajouter au panier
          </>
        ) : (
          'Rupture de stock'
        )}
      </button>
    </div>
  )
}
