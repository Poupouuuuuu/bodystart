'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Truck } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { formatPrice } from '@/lib/utils'
import { isBundle, getBundleComponentImages } from '@/lib/shopify/bundle'
import type { ShopifyProduct } from '@/lib/shopify/types'

interface CrossSellV2Props {
  products: ShopifyProduct[]
  currentHandle: string
}

const FRANCO_THRESHOLD_CENTS = 8500 // 85 €

/**
 * Cross-sell "Pour completer" + nudge franco (panier moyen +).
 * Cf. tech-specs/redesign-v2-direction-artistique.md §B.Fiche produit.7
 *
 * Le nudge franco affiche "Plus que X € pour la livraison offerte" en
 * fonction du subtotal panier en temps reel.
 */
export default function CrossSellV2({ products, currentHandle }: CrossSellV2Props) {
  const { cart } = useCart()
  const items = products.filter((p) => p.handle !== currentHandle).slice(0, 4)
  if (items.length === 0) return null

  const subtotalCents = cart?.cost?.subtotalAmount?.amount
    ? Math.round(parseFloat(cart.cost.subtotalAmount.amount) * 100)
    : 0
  const remainingCents = Math.max(0, FRANCO_THRESHOLD_CENTS - subtotalCents)
  const remainingEuros = (remainingCents / 100).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <section className="bg-canvas">
      <div className="container py-14 md:py-18">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-9">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3">
              Pour compléter
            </p>
            <h2 className="font-display text-[28px] md:text-[36px] font-extrabold text-spruce leading-[1.1] tracking-tight">
              Ça va bien avec
            </h2>
          </div>

          {/* Nudge franco (visible uniquement si panier > 0 et < 85€) */}
          {subtotalCents > 0 && remainingCents > 0 && (
            <div className="inline-flex items-center gap-2 bg-sage text-spruce text-[13px] font-semibold px-4 py-2 rounded-full">
              <Truck className="w-3.5 h-3.5" />
              Plus que {remainingEuros} € pour la livraison offerte
            </div>
          )}
          {subtotalCents > 0 && remainingCents === 0 && (
            <div className="inline-flex items-center gap-2 bg-sage text-spruce text-[13px] font-semibold px-4 py-2 rounded-full">
              <Truck className="w-3.5 h-3.5" />
              Livraison offerte débloquée 🎉
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((product) => {
            const variant = product.variants.nodes[0]
            const productIsBundle = isBundle(product)
            const componentImages = productIsBundle ? getBundleComponentImages(product) : []
            const hasComponents = componentImages.length > 0

            // Echelle dynamique de la stack pour s'adapter a la petite zone visuelle
            // d'une carte cross-sell (4 colonnes desktop, plus compact que /packs).
            const overlapClass =
              componentImages.length >= 4
                ? '-space-x-5 md:-space-x-7'
                : componentImages.length === 3
                  ? '-space-x-4 md:-space-x-5'
                  : '-space-x-2 md:-space-x-3'
            const stackWidthClass =
              componentImages.length >= 4
                ? 'w-[88%]'
                : componentImages.length === 3
                  ? 'w-[80%]'
                  : 'w-[68%]'

            return (
              <Link
                key={product.id}
                href={`/products/${product.handle}`}
                className="group bg-white rounded-2xl border border-spruce/10 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(45,90,45,0.08)]"
              >
                <div
                  className="relative w-full aspect-[4/5] bg-cover bg-bottom bg-no-repeat overflow-hidden"
                  style={{ backgroundImage: "url('/Background.webp')" }}
                >
                  <div className="absolute inset-0 flex items-end justify-center pb-4">
                    {hasComponents ? (
                      // Bundle : stack des images des composants
                      <div
                        className={`flex items-end ${overlapClass} ${stackWidthClass} transition-transform duration-500 group-hover:scale-105`}
                      >
                        {componentImages.slice(0, 5).map((img, i) => (
                          <Image
                            key={`${img.url}-${i}`}
                            src={img.url}
                            alt={img.altText ?? img.productTitle}
                            width={160}
                            height={160}
                            className="flex-1 w-0 min-w-0 h-auto object-contain drop-shadow-2xl"
                            style={{ zIndex: 10 + i }}
                          />
                        ))}
                      </div>
                    ) : product.featuredImage ? (
                      <Image
                        src={product.featuredImage.url}
                        alt={product.featuredImage.altText ?? product.title}
                        width={200}
                        height={200}
                        className="relative z-10 w-auto h-[65%] object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="relative z-10 w-16 h-16 bg-white/40 rounded-full flex items-center justify-center mb-8">
                        <span className="font-display font-bold text-lg text-white/70">BS</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-white to-transparent z-0" />
                </div>
                <div className="p-5">
                  <h3 className="font-display font-bold text-[15px] text-ink leading-tight mb-2 line-clamp-2">
                    {product.title}
                  </h3>
                  {variant && (
                    <p className="font-semibold text-[15px] text-spruce">
                      {formatPrice(variant.price)}
                    </p>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
