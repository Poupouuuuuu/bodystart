'use client'
import { useState } from 'react'
import { ShoppingCart, Check, Minus, Plus } from 'lucide-react'
import { formatPrice, getDiscountPercentage, cn } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import type { ShopifyProductVariant } from '@/lib/shopify/types'

interface ProductActionsProps {
  variants: ShopifyProductVariant[]
  productTitle: string
  onVariantChange?: (variant: ShopifyProductVariant) => void
}

export default function ProductActions({ variants, productTitle, onVariantChange }: ProductActionsProps) {
  const [selectedVariant, setSelectedVariant] = useState<ShopifyProductVariant>(variants[0])
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const { addItem } = useCart()

  const discount = getDiscountPercentage(selectedVariant.price, selectedVariant.compareAtPrice)

  async function handleAddToCart() {
    if (!selectedVariant.availableForSale) return
    setAdding(true)
    try {
      for (let i = 0; i < quantity; i++) {
        await addItem(selectedVariant.id)
      }
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div>
      {/* Prix */}
      <div className="flex items-baseline gap-3 mb-6">
        <span className="text-3xl lg:text-4xl font-bold text-brand-500 leading-none">
          {formatPrice(selectedVariant.price)}
        </span>
        {selectedVariant.compareAtPrice && (
          <span className="text-lg text-gray-400 line-through">
            {formatPrice(selectedVariant.compareAtPrice)}
          </span>
        )}
        {discount && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600">
            -{discount}%
          </span>
        )}
      </div>

      {/* Sélecteur de variantes */}
      {variants.length > 1 && (
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-3">Sélectionner une variante</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => {
                  if (variant.availableForSale) {
                    setSelectedVariant(variant)
                    onVariantChange?.(variant)
                  }
                }}
                disabled={!variant.availableForSale}
                className={cn(
                  'px-4 py-2.5 rounded-full border text-sm font-medium transition-all duration-200',
                  selectedVariant.id === variant.id
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : 'border-cream-300 text-gray-600 hover:border-brand-500 hover:text-brand-500',
                  !variant.availableForSale && 'opacity-40 cursor-not-allowed line-through'
                )}
              >
                {variant.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Sélecteur de quantité */}
      <div className="mb-8">
        <p className="text-sm font-semibold text-gray-700 mb-3">Quantité</p>
        <div className="inline-flex items-center border border-gray-300 rounded-full overflow-hidden">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-12 h-12 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Réduire la quantité"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-12 text-center font-bold text-gray-900 text-sm">{quantity}</span>
          <button
            onClick={() => setQuantity(Math.min(10, quantity + 1))}
            className="w-12 h-12 flex items-center justify-center text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            aria-label="Augmenter la quantité"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Options d'achat (Mockup Visual) */}
      <div className="mb-8 space-y-3">
        {/* Subscribe & Save */}
        <label className="flex items-center justify-between p-4 border-2 border-[#345f44] rounded-xl bg-[#e6efe1] cursor-pointer cursor-pointer transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-5 h-5 rounded-full border-4 border-[#345f44] bg-white flex items-center justify-center shrink-0">
               {/* Checked dot */}
               <div className="w-2 h-2 bg-[#345f44] rounded-full"></div>
            </div>
            <div>
              <span className="font-black uppercase tracking-tight text-gray-900 block">S'abonner et éco. 10%</span>
              <span className="text-xs text-[#345f44] font-bold mt-1 block">Livraison tous les 30 j. ▼</span>
            </div>
          </div>
          <span className="font-bold text-gray-900">
            {selectedVariant.price ? formatPrice({ ...selectedVariant.price, amount: (parseFloat(selectedVariant.price.amount) * 0.9).toString() }) : '-'}
          </span>
        </label>

        {/* One-time purchase */}
        <label className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
          <div className="flex items-center gap-4">
            <div className="w-5 h-5 rounded-full border-2 border-gray-300 shrink-0"></div>
            <span className="font-bold text-gray-600 block">Achat unique</span>
          </div>
          <span className="font-bold text-gray-500">
            {formatPrice(selectedVariant.price)}
          </span>
        </label>
      </div>

      {/* Bouton Ajouter au panier */}
      <button
        onClick={handleAddToCart}
        disabled={!selectedVariant.availableForSale || adding}
        aria-label={`Ajouter ${productTitle} au panier`}
        className={cn(
          'w-full py-4 rounded-full text-white font-bold text-sm flex items-center justify-center gap-3 transition-all duration-200',
          selectedVariant.availableForSale && !adding
            ? 'bg-brand-500 hover:bg-brand-600 shadow-md hover:shadow-lg'
            : 'bg-gray-300 cursor-not-allowed'
        )}
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
