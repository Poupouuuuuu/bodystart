'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useSearchParams } from 'next/navigation'
import { X, ShoppingBag, Minus, Plus, Trash2, ArrowRight, Package, Store, Truck, MapPin, Clock } from 'lucide-react'
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
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-fade-in"
          onClick={closeCart}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 h-full w-full sm:w-[420px] bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Votre panier"
      >
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between px-6 py-5 border-b-2 border-gray-200">
          <div className="flex items-center gap-3">
            <ShoppingBag className={cn("w-6 h-6", isCoaching ? "text-coaching-cyan-500" : "text-brand-700")} />
            <h2 className="font-display font-black uppercase tracking-tight text-gray-900 text-2xl pt-1">
              Mon panier
            </h2>
            {!isEmpty && (
              <span className="w-6 h-6 bg-gray-900 text-white text-[10px] rounded-sm flex items-center justify-center font-black">
                {cart?.totalQuantity ?? 0}
              </span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-2 rounded-sm border-2 border-transparent text-gray-900 hover:border-gray-900 hover:bg-gray-50 transition-colors"
            aria-label="Fermer le panier"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ─── Contenu ─── */}
        {isEmpty ? (
          /* Panier vide */
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-24 h-24 bg-gray-50 border-2 border-gray-200 rounded-sm flex items-center justify-center mb-6">
              <ShoppingBag className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="font-display font-black uppercase tracking-tight text-gray-900 text-2xl mb-3">
              Votre panier est vide
            </h3>
            <p className="text-gray-500 font-medium mb-8 max-w-xs">
              Découvrez nos compléments et nos programmes, et commencez votre transformation.
            </p>
            <Link
              href={isCoaching ? "/coaching" : "/products"}
              onClick={closeCart}
              className={cn(
                "py-4 text-[10px] uppercase font-black tracking-widest px-8 rounded-sm inline-flex items-center",
                isCoaching
                  ? "bg-coaching-cyan-500 text-black border-2 border-transparent hover:bg-coaching-cyan-400"
                  : "bg-brand-700 text-white border-2 border-transparent hover:bg-brand-800"
              )}
            >
              {isCoaching ? "VOIR LE COACHING" : "VOIR NOS PRODUITS"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>
        ) : (
          /* Liste des produits */
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            {items.map((item) => {
              const product = item.merchandise.product
              const image = product.featuredImage

              return (
                <div
                  key={item.id}
                  className={cn(
                    'flex gap-4 p-4 rounded-sm border-2 border-gray-200 shadow-[4px_4px_0_theme(colors.gray.200)] hover:border-gray-900 hover:shadow-[6px_6px_0_theme(colors.gray.900)] hover:-translate-y-0.5 transition-all',
                    isLoading && 'opacity-60 pointer-events-none'
                  )}
                >
                  {/* Image */}
                  <Link
                    href={`/products/${product.handle}`}
                    onClick={closeCart}
                    className="relative w-24 h-24 flex-shrink-0 bg-gray-50 border-2 border-gray-200 rounded-sm overflow-hidden"
                  >
                    {image ? (
                      <Image
                        src={image.url}
                        alt={image.altText ?? product.title}
                        fill
                        className="object-cover"
                        sizes="96px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                        <Package className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </Link>

                  {/* Infos */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <Link
                        href={`/products/${product.handle}`}
                        onClick={closeCart}
                      >
                        <p className={cn(
                          "font-black uppercase tracking-tight leading-snug transition-colors line-clamp-2",
                          isCoaching ? "text-gray-900 hover:text-coaching-cyan-500" : "text-gray-900 hover:text-brand-700"
                        )}>
                          {product.title}
                        </p>
                      </Link>
                      {item.merchandise.title !== 'Default Title' && (
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-1">
                          {item.merchandise.title}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-3">
                      {/* Quantité */}
                      <div className="flex items-center gap-1 bg-white border-2 border-gray-200 rounded-sm p-0.5">
                        <button
                          onClick={() => updateItem(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="w-7 h-7 flex items-center justify-center rounded-sm text-gray-900 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                          aria-label="Réduire"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-[10px] font-black uppercase text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateItem(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center rounded-sm text-gray-900 hover:bg-gray-100 transition-colors"
                          aria-label="Augmenter"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Prix + Supprimer */}
                      <div className="flex items-center gap-3">
                        <span className="font-black text-gray-900 text-base">
                          {formatPrice(item.cost.totalAmount)}
                        </span>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-1.5 text-gray-400 border-2 border-transparent hover:border-red-500 hover:text-red-500 rounded-sm transition-colors"
                          aria-label="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
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
          <div className="border-t-4 border-gray-900 px-6 py-6 space-y-5 bg-gray-50/50">
            {/* Récap prix */}
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                <span>Sous-total</span>
                <span className="text-gray-900">{formatPrice(cart.cost.subtotalAmount)}</span>
              </div>
              {cart.cost.totalTaxAmount && (
                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <span>TVA</span>
                  <span className="text-gray-900">{formatPrice(cart.cost.totalTaxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200 mt-2">
                <span className="font-display font-black uppercase tracking-tight text-xl text-gray-900">Total</span>
                <span className="font-display font-black text-3xl text-gray-900">
                  {formatPrice(cart.cost.totalAmount)}
                </span>
              </div>
            </div>

            {/* ─── Toggle Livraison / Click & Collect ─── */}
            {activeStore && (
              <div className="border-2 border-gray-200 rounded-sm overflow-hidden">
                {/* Options */}
                <div className="flex">
                  <button
                    onClick={() => isClickAndCollect && toggleClickAndCollect()}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest transition-colors',
                      !isClickAndCollect
                        ? 'bg-gray-900 text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    )}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    Livraison
                  </button>
                  <button
                    onClick={() => !isClickAndCollect && toggleClickAndCollect()}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest transition-colors border-l-2 border-gray-200',
                      isClickAndCollect
                        ? 'bg-brand-700 text-white'
                        : 'bg-white text-gray-500 hover:bg-gray-50'
                    )}
                  >
                    <Store className="w-3.5 h-3.5" />
                    Retrait boutique
                  </button>
                </div>

                {/* Détails Click & Collect */}
                {isClickAndCollect && (
                  <div className="p-4 bg-brand-50 border-t-2 border-brand-200 space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-brand-700 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-gray-900">{activeStore.name}</p>
                        <p className="text-xs text-gray-600">{activeStore.address}, {activeStore.city}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 text-brand-700 mt-0.5 flex-shrink-0" />
                      <div>
                        {activeStore.hours.map((h, i) => (
                          <p key={i} className="text-xs text-gray-600">
                            <span className="font-semibold">{h.day}</span> {h.open} – {h.close}
                          </p>
                        ))}
                      </div>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-700 pt-1">
                      Prêt sous 2h après confirmation
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Livraison offerte (seulement en mode livraison) */}
            {!isClickAndCollect && (
              parseFloat(cart.cost.subtotalAmount.amount) < 60 ? (
                <div className={cn(
                  "flex items-center gap-3 p-4 border-2 rounded-sm",
                  isCoaching ? "bg-coaching-50 border-coaching-200" : "bg-brand-50 border-brand-200"
                )}>
                  <span className="text-xl">🚚</span>
                  <div className="flex-1">
                    <p className={cn(
                      "text-[10px] uppercase font-black tracking-widest mb-2",
                      isCoaching ? "text-coaching-700" : "text-brand-700"
                    )}>
                      Plus que{' '}
                      <strong className="bg-white px-1">
                        {formatPrice({
                          amount: String(60 - parseFloat(cart.cost.subtotalAmount.amount)),
                          currencyCode: cart.cost.subtotalAmount.currencyCode,
                        })}
                      </strong>{' '}
                      pour la livraison offerte !
                    </p>
                    <div className={cn(
                      "w-full bg-white border-2 rounded-sm h-3 p-0.5",
                      isCoaching ? "border-coaching-200" : "border-brand-200"
                    )}>
                      <div
                        className={cn(
                          "h-full rounded-sm transition-all duration-300",
                          isCoaching ? "bg-coaching-400" : "bg-brand-500"
                        )}
                        style={{ width: `${Math.min((parseFloat(cart.cost.subtotalAmount.amount) / 60) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className={cn(
                  "flex items-center gap-3 p-4 border-2 rounded-sm",
                  isCoaching ? "bg-coaching-50 border-coaching-200" : "bg-brand-50 border-brand-200"
                )}>
                  <span className="text-xl">🎉</span>
                  <p className={cn(
                    "text-[10px] uppercase font-black tracking-widest",
                    isCoaching ? "text-coaching-700" : "text-brand-700"
                  )}>
                    LIVRAISON OFFERTE !
                  </p>
                </div>
              )
            )}

            {/* Bouton checkout */}
            <a
              href={cart.checkoutUrl}
              className={cn(
                "w-full flex items-center justify-center py-4 text-[10px] font-black uppercase tracking-widest rounded-sm transition-colors",
                isCoaching
                  ? "bg-coaching-cyan-500 text-black hover:bg-coaching-cyan-400"
                  : "bg-brand-700 text-white hover:bg-brand-800"
              )}
            >
              {isClickAndCollect ? 'VALIDER LE RETRAIT' : 'PASSER LA COMMANDE'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>

            <button
              onClick={closeCart}
              className="w-full text-center text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-colors py-2"
            >
              CONTINUER MES ACHATS
            </button>
          </div>
        )}
      </div>
    </>
  )
}
