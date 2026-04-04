'use client'
import { useState, useEffect } from 'react'
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
  const [isSubscription, setIsSubscription] = useState(false)
  const [isStickyVisible, setIsStickyVisible] = useState(false)
  const { addItem } = useCart()

  const discount = getDiscountPercentage(selectedVariant.price, selectedVariant.compareAtPrice)

  // Track scroll for sticky CTA
  useEffect(() => {
    const handleScroll = () => {
      // Threshold: when the user scrolls past the main add to cart button (roughly 700px down)
      if (window.scrollY > 800) {
        setIsStickyVisible(true)
      } else {
        setIsStickyVisible(false)
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Calcule le prix d'abonnement (10% de réduction)
  const subscriptionPrice = selectedVariant.price ? {
    ...selectedVariant.price,
    amount: (parseFloat(selectedVariant.price.amount) * 0.9).toString()
  } : null

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

  // Parsing des options (si on utilise le format "Saveur / Poids")
  const flavors = Array.from(new Set(variants.map(v => v.title.split(' / ')[0]?.trim() || v.title)))
  const defaultSizes = Array.from(new Set(variants.map(v => v.title.split(' / ')[1]?.trim()).filter(Boolean)))
  
  const [selectedFlavor, setSelectedFlavor] = useState<string>(selectedVariant.title.split(' / ')[0]?.trim() || flavors[0])
  const [selectedSize, setSelectedSize] = useState<string>(selectedVariant.title.split(' / ')[1]?.trim() || defaultSizes[0] || '')

  const handleOptionChange = (flavor: string, size: string) => {
    setSelectedFlavor(flavor)
    if (size) setSelectedSize(size)
    
    // Find the variant
    const targetTitle = size ? `${flavor} / ${size}` : flavor
    const foundVariant = variants.find(v => v.title === targetTitle || (v.title.includes(flavor) && v.title.includes(size)))
    
    if (foundVariant) {
      setSelectedVariant(foundVariant)
      onVariantChange?.(foundVariant)
    }
  }

  return (
    <div>
      {/* Prix & Offre */}
      <div className="flex flex-col gap-1 mb-8">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c] mb-2">Sélectionner l'offre</p>

        {/* Bouton Achat Unique */}
        <label 
          className={cn(
            "flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer mb-3",
            !isSubscription ? "border-[#2c3e2e] bg-white shadow-sm" : "border-[#2c3e2e]/10 bg-white/50 hover:bg-white"
          )}
          onClick={() => setIsSubscription(false)}
        >
          <div className="flex items-center gap-4">
            <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", !isSubscription ? "border-[#2c3e2e]" : "border-[#2c3e2e]/30")}>
              {!isSubscription && <div className="w-2.5 h-2.5 bg-[#2c3e2e] rounded-full"></div>}
            </div>
            <span className={cn("text-[13px] font-bold", !isSubscription ? "text-[#2c3e2e]" : "text-[#2c3e2e]/60")}>Achat Unique</span>
          </div>
          <div className="flex flex-col items-end">
            <span className={cn("text-lg font-black", !isSubscription ? "text-[#2c3e2e]" : "text-[#2c3e2e]/60")}>
              {formatPrice(selectedVariant.price)}
            </span>
            {selectedVariant.compareAtPrice && (
              <span className="text-[11px] text-[#4a5f4c] line-through font-medium">
                {formatPrice(selectedVariant.compareAtPrice)}
              </span>
            )}
          </div>
        </label>

        {/* Bouton Abonnement */}
        <label 
          className={cn(
            "flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden",
            isSubscription ? "border-[#2c3e2e] bg-[#e6efe1] shadow-sm" : "border-[#2c3e2e]/10 bg-white/50 hover:bg-[#e6efe1]/50"
          )}
          onClick={() => setIsSubscription(true)}
        >
          <div className="absolute top-0 right-0 bg-[#2c3e2e] text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1 rounded-bl-xl">
            Recommandé
          </div>
          <div className="flex items-center gap-4">
            <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", isSubscription ? "border-[#2c3e2e] bg-white" : "border-[#2c3e2e]/30")}>
              {isSubscription && <div className="w-2.5 h-2.5 bg-[#2c3e2e] rounded-full"></div>}
            </div>
            <div className="flex flex-col">
              <span className={cn("text-[13px] font-bold", isSubscription ? "text-[#2c3e2e]" : "text-[#2c3e2e]/60")}>S'abonner & économiser</span>
              <span className="text-[11px] font-medium text-[#4a5f4c]">-10% sur chaque commande</span>
            </div>
          </div>
          <div className="flex flex-col items-end mr-2">
            <span className={cn("text-lg font-black", isSubscription ? "text-[#2c3e2e]" : "text-[#2c3e2e]/60")}>
              {subscriptionPrice ? formatPrice(subscriptionPrice) : formatPrice(selectedVariant.price)}
            </span>
          </div>
        </label>
      </div>

      {/* Sélecteurs dynamiques (Saveur / Poids) */}
      {variants.length > 1 && (
        <div className="mb-6 space-y-5">
          {/* SÉLECTEUR DE SAVEUR */}
          {flavors.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c] mb-2">Saveur</p>
              <div className="flex flex-wrap gap-2">
                {flavors.map((flavor) => {
                  const isAvailable = variants.some(v => v.title.includes(flavor) && v.availableForSale)
                  return (
                    <button
                      key={flavor}
                      onClick={() => handleOptionChange(flavor, selectedSize)}
                      disabled={!isAvailable}
                      className={cn(
                        'px-4 py-2 rounded-full border text-[13px] font-bold transition-all duration-300',
                        selectedFlavor === flavor
                          ? 'border-[#2c3e2e] bg-[#2c3e2e] text-white shadow-md'
                          : 'border-[#2c3e2e]/20 text-[#2c3e2e]/70 hover:border-[#2c3e2e] hover:text-[#2c3e2e]',
                        !isAvailable && 'opacity-40 cursor-not-allowed line-through'
                      )}
                    >
                      {flavor}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* SÉLECTEUR DE FORMAT */}
          {defaultSizes.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#4a5f4c] mb-2">Format</p>
              <div className="flex flex-wrap gap-2">
                {defaultSizes.map((size) => {
                  const isAvailable = variants.some(v => v.title.includes(selectedFlavor) && v.title.includes(size) && v.availableForSale)
                  return (
                    <button
                      key={size}
                      onClick={() => handleOptionChange(selectedFlavor, size)}
                      disabled={!isAvailable}
                      className={cn(
                        'px-4 py-2 rounded-full border text-[13px] font-bold transition-all duration-300',
                        selectedSize === size
                          ? 'border-[#2c3e2e] bg-[#2c3e2e] text-white shadow-md'
                          : 'border-[#2c3e2e]/20 text-[#2c3e2e]/70 hover:border-[#2c3e2e] hover:text-[#2c3e2e]',
                        !isAvailable && 'opacity-40 cursor-not-allowed line-through'
                      )}
                    >
                      {size}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-4 mb-4 mt-8">
        {/* Sélecteur de quantité */}
        <div className="inline-flex items-center border-2 border-[#2c3e2e]/10 rounded-full overflow-hidden h-[60px] bg-white/50 shrink-0">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-12 h-full flex items-center justify-center text-[#2c3e2e]/60 hover:text-[#2c3e2e] hover:bg-black/5 transition-colors"
            aria-label="Réduire la quantité"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-10 text-center font-bold text-[#2c3e2e] text-lg">{quantity}</span>
          <button
            onClick={() => setQuantity(Math.min(10, quantity + 1))}
            className="w-12 h-full flex items-center justify-center text-[#2c3e2e]/60 hover:text-[#2c3e2e] hover:bg-black/5 transition-colors"
            aria-label="Augmenter la quantité"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Bouton Ajouter au panier */}
        <button
          onClick={handleAddToCart}
          disabled={!selectedVariant?.availableForSale || adding}
          aria-label={`Ajouter ${productTitle} au panier`}
          className={cn(
            'flex-1 h-[60px] rounded-full text-white font-black uppercase tracking-widest text-[13px] lg:text-sm flex items-center justify-center gap-2 transition-all duration-300 px-2 lg:px-4',
            selectedVariant?.availableForSale && !adding
              ? 'bg-[#2c3e2e] hover:bg-[#1f2c21] shadow-xl hover:shadow-2xl hover:-translate-y-1'
              : 'bg-gray-300 cursor-not-allowed'
          )}
        >
          {adding ? (
            <>
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </>
          ) : added ? (
            <>
              <Check className="w-5 h-5" />
              AJOUTÉ AU PANIER
            </>
          ) : selectedVariant?.availableForSale ? (
            <>
              AJOUTER AU PANIER
            </>
          ) : (
            'RUPTURE DE STOCK'
          )}
        </button>
      </div>

      {/* STICKY ADD TO CART BAR */}
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-[#2c3e2e]/10 py-4 px-6 z-50 transform transition-transform duration-500 flex items-center justify-between md:justify-center md:gap-12 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]",
          isStickyVisible ? "translate-y-0" : "translate-y-full"
        )}
      >
         <div className="hidden md:flex flex-col">
            <span className="font-black text-[#2c3e2e] text-sm uppercase tracking-wider">{productTitle}</span>
            <span className="text-[#4a5f4c] text-xs font-bold">{selectedVariant.title}</span>
         </div>
         <div className="flex items-center gap-6 w-full md:w-auto">
            <span className="font-black text-[#2c3e2e] text-xl hidden md:block">
              {isSubscription && subscriptionPrice ? formatPrice(subscriptionPrice) : formatPrice(selectedVariant.price)}
            </span>
            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant?.availableForSale || adding}
              className={cn(
                'w-full md:w-auto px-10 h-12 rounded-full text-white font-black uppercase tracking-widest text-[13px] flex items-center justify-center gap-2 transition-all duration-300',
                selectedVariant?.availableForSale && !adding
                  ? 'bg-[#2c3e2e] hover:bg-[#1f2c21] shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 cursor-not-allowed'
              )}
            >
              {adding ? 'EN COURS...' : added ? 'AJOUTÉ' : 'AJOUTER'}
            </button>
         </div>
      </div>
    </div>
  )
}
