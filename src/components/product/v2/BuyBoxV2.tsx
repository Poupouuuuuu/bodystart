'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ShoppingCart, Check, Minus, Plus, Truck, Store, ShieldCheck } from 'lucide-react'
import { formatPrice, cn } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import ProductGalleryV2 from './ProductGalleryV2'
import type { ShopifyImage, ShopifyProductVariant, BodyStartStore } from '@/lib/shopify/types'

interface BuyBoxV2Props {
  images: ShopifyImage[]
  variants: ShopifyProductVariant[]
  title: string
  discountPct: number | null
  collectionName: string | null
  collectionHandle: string | null
  activeStore?: BodyStartStore
  storeInventory: Record<string, number>
  benefits?: string[]
}

const LOW_STOCK_THRESHOLD = 5

/**
 * Buy box V2 — galerie gauche + panneau achat droite.
 * Cf. tech-specs/redesign-v2-direction-artistique.md §B.Fiche produit.1
 *      tech-specs/site-rewrite-copy-v1.md §4.1 (abonnement RETIRE)
 *
 * Decisions appliquees :
 * - Pas d'abonnement (achat unique only)
 * - Stock <= 5 → chiffre exact terracotta ; sinon "En stock" sage
 * - Reassurance sous le bouton : livraison 85 € · retrait quelques minutes · paiement securise
 */
export default function BuyBoxV2({
  images,
  variants,
  title,
  discountPct,
  collectionName,
  collectionHandle,
  activeStore,
  storeInventory,
  benefits = [],
}: BuyBoxV2Props) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<ShopifyProductVariant>(variants[0])
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [isStickyVisible, setIsStickyVisible] = useState(false)
  const { addItem } = useCart()

  // Saveurs / formats
  const flavors = Array.from(new Set(variants.map((v) => v.title.split(' / ')[0]?.trim() || v.title)))
  const defaultSizes = Array.from(
    new Set(variants.map((v) => v.title.split(' / ')[1]?.trim()).filter(Boolean) as string[])
  )
  const [selectedFlavor, setSelectedFlavor] = useState<string>(
    selectedVariant.title.split(' / ')[0]?.trim() || flavors[0]
  )
  const [selectedSize, setSelectedSize] = useState<string>(
    selectedVariant.title.split(' / ')[1]?.trim() || defaultSizes[0] || ''
  )

  const handleOptionChange = (flavor: string, size: string) => {
    setSelectedFlavor(flavor)
    if (size) setSelectedSize(size)
    const targetTitle = size ? `${flavor} / ${size}` : flavor
    const foundVariant = variants.find(
      (v) => v.title === targetTitle || (v.title.includes(flavor) && (!size || v.title.includes(size)))
    )
    if (foundVariant) {
      setSelectedVariant(foundVariant)
      // Sync image galerie si la variante a une image dediee
      if (foundVariant.image?.url) {
        const matchIndex = images.findIndex((img) => img.url === foundVariant.image?.url)
        if (matchIndex >= 0) setSelectedImageIndex(matchIndex)
      }
    }
  }

  /**
   * Sens inverse galerie → selecteur de saveur (synchro bidirectionnelle).
   *
   * Quand on clique une vignette, on remonte cette image au mapping
   * variant.image.url existant (deja utilise pour le sens forward
   * saveur → image). Si elle correspond au featured media d'une variante,
   * on bascule aussi la selection de saveur/format pour que le pill
   * actif suive l'image affichee.
   *
   * Cas image secondaire (produit avec plus d'images que de variantes) :
   * matchingVariant est undefined, on update juste l'index image sans
   * toucher a la variante selectionnee. Pas de desselection, pas de reset.
   */
  const handleImageChange = useCallback(
    (index: number) => {
      setSelectedImageIndex(index)

      const clickedImage = images[index]
      if (!clickedImage) return

      const matchingVariant = variants.find((v) => v.image?.url === clickedImage.url)
      if (!matchingVariant) return // image secondaire non rattachee a une variante
      if (matchingVariant.id === selectedVariant.id) return // deja selectionnee

      setSelectedVariant(matchingVariant)
      const parts = matchingVariant.title.split(' / ').map((s) => s.trim())
      const flavor = parts[0]
      const size = parts[1] ?? ''
      if (flavor) setSelectedFlavor(flavor)
      setSelectedSize(size)
    },
    [images, variants, selectedVariant.id]
  )

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

  // Sticky bar visible quand on scroll au-dela du bouton principal
  useEffect(() => {
    const handleScroll = () => setIsStickyVisible(window.scrollY > 800)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const storeStock = activeStore ? storeInventory[activeStore.id] : undefined
  const showExactStock = storeStock !== undefined && storeStock > 0 && storeStock <= LOW_STOCK_THRESHOLD

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-start">
        {/* ─── Galerie ─── */}
        <div className="lg:sticky lg:top-24">
          <ProductGalleryV2
            images={images}
            title={title}
            discountPct={discountPct}
            selectedIndex={selectedImageIndex}
            onImageChange={handleImageChange}
          />
        </div>

        {/* ─── Panneau achat ─── */}
        <div>
          {/* Categorie / marque */}
          <Link
            href={collectionHandle ? `/products?cat=${collectionHandle}` : '/products'}
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3 inline-block hover:text-spruce transition-colors"
          >
            {collectionName ?? 'BodyStart'}
          </Link>

          {/* Titre */}
          <h1 className="font-display text-[28px] md:text-[36px] lg:text-[40px] font-extrabold text-spruce leading-[1.1] tracking-tight mb-5">
            {title}
          </h1>

          {/* Pastilles benefices (sage + spruce) */}
          {benefits.length > 0 && (
            <ul className="flex flex-wrap gap-2 mb-6">
              {benefits.map((b) => (
                <li
                  key={b}
                  className="inline-flex items-center bg-sage text-spruce text-[12px] font-semibold px-3 py-1.5 rounded-full"
                >
                  {b}
                </li>
              ))}
            </ul>
          )}

          {/* Prix */}
          <div className="flex items-baseline gap-3 mb-7">
            <span className="font-display text-[32px] md:text-[36px] font-extrabold text-spruce leading-none">
              {formatPrice(selectedVariant.price)}
            </span>
            {selectedVariant.compareAtPrice &&
              parseFloat(selectedVariant.compareAtPrice.amount) >
                parseFloat(selectedVariant.price.amount) && (
                <span className="text-[16px] text-ink-mute line-through font-medium">
                  {formatPrice(selectedVariant.compareAtPrice)}
                </span>
              )}
          </div>

          {/* Selecteur saveur */}
          {variants.length > 1 && flavors.length > 1 && (
            <div className="mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-2.5">
                Saveur
              </p>
              <div className="flex flex-wrap gap-2">
                {flavors.map((flavor) => {
                  const isAvailable = variants.some(
                    (v) => v.title.includes(flavor) && v.availableForSale
                  )
                  return (
                    <button
                      key={flavor}
                      onClick={() => handleOptionChange(flavor, selectedSize)}
                      disabled={!isAvailable}
                      className={cn(
                        'px-4 py-2 rounded-full border text-[13px] font-semibold transition-colors',
                        selectedFlavor === flavor
                          ? 'border-spruce bg-spruce text-white'
                          : 'border-spruce/20 text-spruce hover:border-spruce/40',
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

          {/* Selecteur format */}
          {variants.length > 1 && defaultSizes.length > 1 && (
            <div className="mb-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-2.5">
                Format
              </p>
              <div className="flex flex-wrap gap-2">
                {defaultSizes.map((size) => {
                  const isAvailable = variants.some(
                    (v) =>
                      v.title.includes(selectedFlavor) && v.title.includes(size) && v.availableForSale
                  )
                  return (
                    <button
                      key={size}
                      onClick={() => handleOptionChange(selectedFlavor, size)}
                      disabled={!isAvailable}
                      className={cn(
                        'px-4 py-2 rounded-full border text-[13px] font-semibold transition-colors',
                        selectedSize === size
                          ? 'border-spruce bg-spruce text-white'
                          : 'border-spruce/20 text-spruce hover:border-spruce/40',
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

          {/* Quantite + Ajouter au panier */}
          <div className="flex items-stretch gap-3 mt-7">
            <div className="inline-flex items-center border border-spruce/20 rounded-full overflow-hidden h-[56px] bg-white">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-11 h-full flex items-center justify-center text-spruce hover:bg-spruce/5 transition-colors"
                aria-label="Réduire la quantité"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-9 text-center font-semibold text-spruce text-[16px]">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                className="w-11 h-full flex items-center justify-center text-spruce hover:bg-spruce/5 transition-colors"
                aria-label="Augmenter la quantité"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant?.availableForSale || adding}
              aria-label={`Ajouter ${title} au panier`}
              className={cn(
                'flex-1 h-[56px] rounded-full text-white font-semibold text-[15px] flex items-center justify-center gap-2 transition-colors',
                selectedVariant?.availableForSale && !adding
                  ? 'bg-fresh hover:bg-fresh-deep'
                  : 'bg-ink-mute/40 cursor-not-allowed'
              )}
            >
              {adding ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  />
                </svg>
              ) : added ? (
                <>
                  <Check className="w-5 h-5" />
                  Ajouté au panier
                </>
              ) : selectedVariant?.availableForSale ? (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Ajouter au panier
                </>
              ) : (
                'Rupture de stock'
              )}
            </button>
          </div>

          {/* Reassurance sous le bouton (DA §B.Fiche produit.1) */}
          <ul className="mt-6 space-y-2.5 text-[13px] text-ink">
            <li className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-spruce flex-shrink-0" />
              <span>
                Livraison offerte dès <span className="font-semibold">85 €</span>
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <Store className="w-4 h-4 text-spruce flex-shrink-0" />
              <span>
                Click &amp; Collect gratuit à Coignières, souvent prêt en quelques minutes
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-spruce flex-shrink-0" />
              <span>Paiement sécurisé (CB, Visa, Mastercard)</span>
            </li>
          </ul>

          {/* Stock (DA §B.Fiche produit.1 : decision Adam) */}
          {storeStock !== undefined && (
            <div className="mt-6 pt-5 border-t border-spruce/10">
              {storeStock === 0 ? (
                <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-terracotta">
                  <span className="w-2 h-2 bg-terracotta rounded-full" />
                  Indisponible en boutique
                </div>
              ) : showExactStock ? (
                <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-terracotta">
                  <span className="w-2 h-2 bg-terracotta rounded-full" />
                  Plus que {storeStock} en stock à Coignières
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-spruce">
                  <span className="w-2 h-2 bg-fresh rounded-full" />
                  En stock à Coignières
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Sticky buy bar ─── */}
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-spruce/10 py-3 px-4 md:px-6 z-50 transition-transform duration-300 shadow-[0_-4px_20px_rgba(45,90,45,0.06)]',
          isStickyVisible ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="container flex items-center gap-4">
          <div className="hidden md:flex flex-col min-w-0 flex-1">
            <span className="font-semibold text-ink text-[14px] truncate">{title}</span>
            <span className="text-ink-mute text-[12px]">{selectedVariant.title}</span>
          </div>
          <span className="hidden md:block font-display font-extrabold text-spruce text-[18px]">
            {formatPrice(selectedVariant.price)}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant?.availableForSale || adding}
            className={cn(
              'w-full md:w-auto h-11 px-7 rounded-full text-white font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors flex-shrink-0',
              selectedVariant?.availableForSale && !adding
                ? 'bg-fresh hover:bg-fresh-deep'
                : 'bg-ink-mute/40 cursor-not-allowed'
            )}
          >
            {adding ? 'Ajout…' : added ? 'Ajouté ✓' : 'Ajouter au panier'}
          </button>
        </div>
      </div>
    </>
  )
}
