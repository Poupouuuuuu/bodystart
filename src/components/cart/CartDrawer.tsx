'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { X, Minus, Plus, ArrowRight, Package, Store, Truck, MapPin, Clock } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { formatPrice, cn } from '@/lib/utils'
import { BODY_START_STORES } from '@/lib/shopify/types'

const activeStore = BODY_START_STORES.find((s) => s.isActive)

export default function CartDrawer() {
  const { cart, isOpen, isLoading, closeCart, updateItem, removeItem, setCartAttributes } = useCart()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isCoaching = pathname?.startsWith('/coaching') || searchParams?.get('theme') === 'coaching'

  const [isClickAndCollect, setIsClickAndCollect] = useState(false)

  const items = cart?.lines?.nodes ?? []
  const isEmpty = items.length === 0

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
          className="fixed inset-0 bg-[#1a2e23]/30 backdrop-blur-sm z-40 animate-fade-in"
          onClick={closeCart}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full sm:w-[480px] bg-[#eef3eb] z-50 flex flex-col shadow-[-10px_0_40px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Votre panier"
      >
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between px-8 py-7">
          <h2 className="text-[18px] font-black uppercase text-[#1a2e23]">
            {isCoaching ? "Résumé Coaching" : "Mon Panier"}
          </h2>
          <button
            onClick={closeCart}
            className="p-2 -mr-2 rounded-full text-[#4a5f4c] hover:text-[#1a2e23] hover:bg-black/5 transition-colors"
            aria-label="Fermer le panier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── Contenu ─── */}
        {isEmpty ? (
          /* Panier vide */
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center text-[#1a2e23]">
            <p className="font-bold text-lg mb-2">Votre panier est vide</p>
            <p className="text-[#4a5f4c] font-medium mb-8 max-w-[250px] text-sm">
              Ajoutez des produits pour voir votre résumé de commande.
            </p>
            <Link
              href={isCoaching ? "/coaching" : "/products"}
              onClick={closeCart}
              className={cn(
                "py-4 h-14 w-full text-[13px] font-bold tracking-widest rounded-full inline-flex justify-center items-center transition-all",
                isCoaching
                  ? "bg-[#2ab0b0] text-white hover:bg-[#1a9898]"
                  : "bg-[#1a2e23] text-white hover:bg-[#2c4c39]"
              )}
            >
              {isCoaching ? "VOIR LE COACHING" : "ACHETER MAINTENANT"}
            </Link>
          </div>
        ) : (
          /* Liste des produits */
          <div className="flex-1 overflow-y-auto px-8 py-2 space-y-6">
            {items.map((item) => {
              const product = item.merchandise.product
              const image = product.featuredImage

              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex gap-5 pb-6 border-b border-[#1a2e23]/10 last:border-0',
                    isLoading && 'opacity-60 pointer-events-none'
                  )}
                >
                  {/* Image */}
                  <Link
                    href={`/products/${product.handle}`}
                    onClick={closeCart}
                    className="relative w-20 h-24 flex-shrink-0 bg-white rounded-lg shadow-sm overflow-hidden flex items-center justify-center border border-[#1a2e23]/5"
                  >
                    {image ? (
                      <Image
                        src={image.url}
                        alt={image.altText ?? product.title}
                        fill
                        className="object-contain p-2"
                        sizes="80px"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-[#1a2e23]/20" />
                    )}
                  </Link>

                  {/* Infos */}
                  <div className="flex-1 min-w-0 flex flex-col justify-start pt-1">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <Link href={`/products/${product.handle}`} onClick={closeCart}>
                          <p className="font-bold text-[#1a2e23] uppercase text-[13px] leading-tight line-clamp-2">
                            {product.title}
                          </p>
                        </Link>
                        {item.merchandise.title !== 'Default Title' && (
                          <p className="text-[11px] font-medium text-[#4a5f4c] mt-0.5">
                            {item.merchandise.title}
                          </p>
                        )}
                        
                        {/* Remove link */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[11px] font-medium text-[#4a5f4c]/60 underline underline-offset-2 hover:text-red-500 mt-1 transition-colors"
                        >
                          Retirer
                        </button>
                      </div>
                      <span className="font-bold text-[#1a2e23] text-sm whitespace-nowrap">
                        {formatPrice(item.cost.totalAmount)}
                      </span>
                    </div>

                    <div className="mt-auto pt-4">
                      {/* Quantité pill */}
                      <div className="inline-flex items-center bg-white/60 border border-[#1a2e23]/10 rounded-full px-1 py-1">
                        <button
                          onClick={() => updateItem(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-6 h-6 flex items-center justify-center rounded-full text-[#4a5f4c] hover:bg-white disabled:opacity-30 transition-all"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-[12px] font-bold text-[#1a2e23]">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateItem(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center rounded-full text-[#4a5f4c] hover:bg-white transition-all"
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

        {/* ─── Footer récap + checkout ─── */}
        {!isEmpty && cart && (
          <div className="px-8 pb-8 pt-4">
            
            {/* ─── Toggle Livraison / Click & Collect ─── */}
            {activeStore && (
              <div className="flex bg-white/50 p-1 rounded-xl mb-6 shadow-sm border border-[#1a2e23]/5">
                <button
                  onClick={() => isClickAndCollect && toggleClickAndCollect()}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors',
                    !isClickAndCollect
                      ? 'bg-white shadow-sm text-[#1a2e23]'
                      : 'text-[#4a5f4c] hover:text-[#1a2e23]'
                  )}
                >
                  <Truck className="w-3.5 h-3.5" />
                  Livraison
                </button>
                <button
                  onClick={() => !isClickAndCollect && toggleClickAndCollect()}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-colors',
                    isClickAndCollect
                      ? 'bg-white shadow-sm text-[#1a2e23]'
                      : 'text-[#4a5f4c] hover:text-[#1a2e23]'
                  )}
                >
                  <Store className="w-3.5 h-3.5" />
                  Retrait
                </button>
              </div>
            )}

            {/* Récap prix */}
            <div className="space-y-3 mb-6 bg-white/40 p-4 rounded-xl border border-[#1a2e23]/5">
              <div className="flex justify-between text-[13px] text-[#4a5f4c] font-medium">
                <span>Sous-total</span>
                <span className="font-bold text-[#1a2e23]">{formatPrice(cart.cost.subtotalAmount)}</span>
              </div>
              <div className="flex justify-between text-[13px] text-[#4a5f4c] font-medium">
                <span>Livraison</span>
                <span className="font-bold text-[#1a2e23]">
                  {isClickAndCollect ? 'Gratuit' : 'Calculée à l\'étape suivante'}
                </span>
              </div>
              {cart.cost.totalTaxAmount && (
                <div className="flex justify-between text-[13px] text-[#4a5f4c] font-medium">
                  <span>Dont TVA</span>
                  <span className="font-bold text-[#1a2e23]">{formatPrice(cart.cost.totalTaxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-[#1a2e23]/10 mt-1">
                <span className="text-[14px] font-black uppercase text-[#1a2e23]">Total</span>
                <span className="font-black text-2xl text-[#1a2e23]">
                  {formatPrice(cart.cost.totalAmount)}
                </span>
              </div>
            </div>

            {/* Bouton checkout */}
            <div className="flex flex-col gap-3">
              <a
                href={cart.checkoutUrl}
                className={cn(
                  "w-full h-14 flex items-center justify-center text-[14px] font-bold uppercase tracking-widest rounded-full transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5",
                  isCoaching
                    ? "bg-[#2ab0b0] text-white hover:bg-[#1a9898]"
                    : "bg-[#1a2e23] text-white hover:bg-[#2e4f3c]"
                )}
              >
                {isClickAndCollect ? 'VALIDER LE RETRAIT' : 'PAIEMENT SÉCURISÉ'}
              </a>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
