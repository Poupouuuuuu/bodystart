'use client'

// STANDBY 2026-05-23 : coaching masque (cf. middleware redirect 301).
// Le toggle isCoaching a ete retire de CartDrawer en 2026-05-25 : tout le panier
// est desormais nutrition-only (titre "Mon panier").
// Re-theme DA claire V2 (2026-05-31) : surfaces creme/blanc, vert frais en
// accent, sentence case. Aucune logique panier/checkout touchee.
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { X, Minus, Plus, ArrowRight, Package, Store, Truck, MapPin, Clock, CheckCircle2 } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { formatPrice, cn } from '@/lib/utils'
import { BODY_START_STORES } from '@/lib/shopify/types'
import { getCartLineComponentImages } from '@/lib/shopify/bundle'
import BundleComposite from '@/components/pack/v2/BundleComposite'
import { CagnotteCartWidget } from './CagnotteCartWidget'

const activeStore = BODY_START_STORES.find((s) => s.isActive)
const FREE_SHIPPING_THRESHOLD = 85

export default function CartDrawer() {
  const { cart, isOpen, isLoading, closeCart, updateItem, removeItem, setCartAttributes } = useCart()

  const [isClickAndCollect, setIsClickAndCollect] = useState(false)

  const items = cart?.lines?.nodes ?? []
  const isEmpty = items.length === 0

  const subtotalAmount = parseFloat(cart?.cost?.subtotalAmount?.amount ?? '0')
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotalAmount)
  const freeShippingProgress = Math.min(100, (subtotalAmount / FREE_SHIPPING_THRESHOLD) * 100)
  const hasFreeShipping = subtotalAmount >= FREE_SHIPPING_THRESHOLD

  async function toggleClickAndCollect() {
    const newValue = !isClickAndCollect
    setIsClickAndCollect(newValue)

    if (activeStore) {
      await setCartAttributes(
        newValue
          ? [
              { key: '__click_and_collect', value: 'true' },
              { key: 'pickup_location_id', value: activeStore.shopifyLocationId },
            ]
          : [
              { key: '__click_and_collect', value: 'false' },
              { key: 'pickup_location_id', value: '' },
            ]
      )
    }
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-40 animate-fade-in"
          onClick={closeCart}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full sm:w-[480px] bg-canvas z-50 flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Ton panier"
      >
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between px-8 py-7">
          <h2 className="font-display text-[20px] font-extrabold tracking-tight text-spruce">
            Mon panier
          </h2>
          <button
            onClick={closeCart}
            className="p-2 -mr-2 rounded-full text-ink-mute hover:text-spruce hover:bg-spruce/5 transition-colors"
            aria-label="Fermer le panier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── Barre livraison gratuite ─── */}
        {!isEmpty && !isClickAndCollect && (
          <div className="px-8 pb-5">
            <div className="bg-white border border-spruce/10 rounded-xl p-4">
              {hasFreeShipping ? (
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-fresh flex-shrink-0" />
                  <p className="text-[12px] font-semibold text-spruce">
                    Ta livraison est offerte !
                  </p>
                </div>
              ) : (
                <p className="text-[12px] font-medium text-ink-mute mb-2.5">
                  Plus que{' '}
                  <span className="font-bold text-spruce">
                    {formatPrice({
                      amount: remainingForFreeShipping.toFixed(2),
                      currencyCode: cart?.cost?.subtotalAmount?.currencyCode ?? 'EUR',
                    })}
                  </span>{' '}
                  pour la livraison offerte
                </p>
              )}
              <div className="relative h-1.5 bg-spruce/10 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-fresh rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${freeShippingProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ─── Contenu ─── */}
        {isEmpty ? (
          /* Panier vide */
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center text-ink">
            <p className="font-display font-bold text-lg text-spruce mb-2">Ton panier est vide</p>
            <p className="text-ink-mute font-medium mb-8 max-w-[250px] text-sm">
              Ajoute des produits pour voir ton résumé de commande.
            </p>
            <Link
              href="/products"
              onClick={closeCart}
              className="h-14 w-full text-[14px] font-semibold rounded-full inline-flex justify-center items-center gap-2 transition-colors bg-fresh text-white hover:bg-fresh-deep"
            >
              Acheter maintenant
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Liste des produits */
          <div className="flex-1 overflow-y-auto px-8 pt-2 pb-8 space-y-6">
            {items.map((item) => {
              const product = item.merchandise.product
              const image = product.featuredImage
              // Bundle sans featuredImage (volontaire) → repli sur les images
              // des composants (empilées, max 3), sinon placeholder.
              const componentImages = image ? [] : getCartLineComponentImages(item.merchandise)

              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex gap-5 pb-6 border-b border-spruce/10 last:border-0',
                    isLoading && 'opacity-60 pointer-events-none'
                  )}
                >
                  {/* Image */}
                  <Link
                    href={`/products/${product.handle}`}
                    onClick={closeCart}
                    className="relative w-20 h-24 flex-shrink-0 bg-white rounded-lg overflow-hidden flex items-center justify-center border border-spruce/10"
                  >
                    {image ? (
                      <Image
                        src={image.url}
                        alt={image.altText ?? product.title}
                        fill
                        className="object-contain p-2"
                        sizes="80px"
                      />
                    ) : componentImages.length > 0 ? (
                      // Pack : même composite que les cartes /packs (pots des
                      // composants empilés sur fond végétal), réduit à la vignette.
                      // Le composite remplit le slot (w-full h-full) via variant thumb.
                      <BundleComposite
                        images={componentImages}
                        alt={product.title}
                        variant="thumb"
                        sizes="80px"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-spruce/25" />
                    )}
                  </Link>

                  {/* Infos */}
                  <div className="flex-1 min-w-0 flex flex-col justify-start pt-1">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <Link href={`/products/${product.handle}`} onClick={closeCart}>
                          <p className="font-display font-bold text-ink text-[14px] leading-tight line-clamp-2">
                            {product.title}
                          </p>
                        </Link>
                        {item.merchandise.title !== 'Default Title' && (
                          <p className="text-[12px] font-medium text-ink-mute mt-0.5">
                            {item.merchandise.title}
                          </p>
                        )}

                        {/* Remove link */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[12px] font-medium text-ink-mute underline underline-offset-2 hover:text-terracotta mt-1 transition-colors"
                        >
                          Retirer
                        </button>
                      </div>
                      <span className="font-semibold text-spruce text-sm whitespace-nowrap">
                        {formatPrice(item.cost.totalAmount)}
                      </span>
                    </div>

                    <div className="mt-auto pt-4">
                      {/* Quantité pill */}
                      <div className="inline-flex items-center bg-white border border-spruce/15 rounded-full px-1 py-1">
                        <button
                          onClick={() => updateItem(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-6 h-6 flex items-center justify-center rounded-full text-ink-mute hover:bg-spruce/5 disabled:opacity-30 transition-all"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-[12px] font-bold text-ink">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateItem(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-full text-ink-mute hover:bg-spruce/5 transition-all"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ─── Widget Cagnotte (loyalty) ─── */}
        {!isEmpty && <CagnotteCartWidget />}

        {/* ─── Footer récap + checkout ─── */}
        {!isEmpty && cart && (
          <div className="px-8 pb-8 pt-5 border-t border-spruce/10 bg-canvas shadow-[0_-8px_20px_-12px_rgba(0,0,0,0.08)]">

            {/* ─── Toggle Livraison / Click & Collect ─── */}
            {activeStore && (
              <div className="flex bg-white p-1 rounded-xl mb-5 border border-spruce/10">
                <button
                  onClick={() => isClickAndCollect && toggleClickAndCollect()}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold rounded-lg transition-colors',
                    !isClickAndCollect
                      ? 'bg-sage text-spruce'
                      : 'text-ink-mute hover:text-spruce'
                  )}
                >
                  <Truck className="w-3.5 h-3.5" />
                  Livraison
                </button>
                <button
                  onClick={() => !isClickAndCollect && toggleClickAndCollect()}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold rounded-lg transition-colors',
                    isClickAndCollect
                      ? 'bg-sage text-spruce'
                      : 'text-ink-mute hover:text-spruce'
                  )}
                >
                  <Store className="w-3.5 h-3.5" />
                  Retrait
                </button>
              </div>
            )}

            {/* Récap prix */}
            <div className="space-y-3 mb-6 bg-white p-4 rounded-xl border border-spruce/10">
              <div className="flex justify-between text-[13px] text-ink-mute font-medium">
                <span>Sous-total</span>
                <span className="font-semibold text-ink">{formatPrice(cart.cost.subtotalAmount)}</span>
              </div>
              <div className="flex justify-between text-[13px] text-ink-mute font-medium">
                <span>Livraison</span>
                <span className="font-semibold text-ink">
                  {isClickAndCollect ? 'Gratuit' : 'Calculée à l\'étape suivante'}
                </span>
              </div>
              {cart.cost.totalTaxAmount && (
                <div className="flex justify-between text-[13px] text-ink-mute font-medium">
                  <span>Dont TVA</span>
                  <span className="font-semibold text-ink">{formatPrice(cart.cost.totalTaxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-spruce/10 mt-1">
                <span className="text-[14px] font-bold text-ink">Total</span>
                <span className="font-display font-extrabold text-2xl text-spruce">
                  {formatPrice(cart.cost.totalAmount)}
                </span>
              </div>
            </div>

            {/* Bouton checkout */}
            <div className="flex flex-col gap-3">
              <a
                href={cart.checkoutUrl}
                className="w-full h-14 flex items-center justify-center text-[14px] font-semibold rounded-full transition-colors bg-fresh text-white hover:bg-fresh-deep"
              >
                {isClickAndCollect ? 'Valider le retrait' : 'Paiement sécurisé'}
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
