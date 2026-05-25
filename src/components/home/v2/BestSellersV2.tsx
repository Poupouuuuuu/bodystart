import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Plus } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/types'
import { formatPrice } from '@/lib/utils'

/**
 * "Les plus pris en boutique" — 4 best-sellers.
 * Cf. tech-specs/site-rewrite-copy-v1.md §3.3
 *      tech-specs/redesign-v2-direction-artistique.md §B.Home.3
 *
 * DA : cartes blanches, bordure fine, badge moutarde best-seller, pastilles
 * benefices vert pale. Au moins 1 produit sante (decision Adam — l'ordre des
 * produits vient de Shopify, c'est a Adam de garantir le mix dans son admin).
 */
interface BestSellersV2Props {
  products: ShopifyProduct[]
}

// Tags Shopify qui qualifient un produit comme "sante"
const SANTE_TAGS = new Set(['sante', 'santé', 'omega-3', 'magnesium', 'vitamine', 'collagene'])

function isSanteProduct(p: ShopifyProduct): boolean {
  return (p.tags ?? []).some((t) => SANTE_TAGS.has(t.toLowerCase()))
}

export default function BestSellersV2({ products }: BestSellersV2Props) {
  const items = products.slice(0, 4)
  if (items.length === 0) return null

  return (
    <section className="bg-canvas">
      <div className="container py-14 md:py-18">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-9">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3">
              Les plus pris en boutique
            </p>
            <h2 className="font-display text-[32px] md:text-[42px] font-extrabold text-spruce leading-[1.05] tracking-tight">
              Ce qui part vite chez nous
            </h2>
          </div>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-spruce font-semibold text-[14px] hover:text-fresh-deep transition-colors group"
          >
            Voir tout le catalogue
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {items.map((product, idx) => {
            const variant = product.variants.nodes[0]
            const image = product.featuredImage
            const isFirst = idx === 0
            const isSante = isSanteProduct(product)

            return (
              <Link
                key={product.id}
                href={`/products/${product.handle}`}
                className="group bg-white rounded-2xl border border-spruce/10 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(45,90,45,0.08)]"
              >
                {/* Image carre, fond blanc, padding genereux */}
                <div className="relative aspect-square bg-white overflow-hidden">
                  {/* Badges */}
                  <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
                    {isFirst && (
                      <span className="inline-flex items-center bg-mustard text-mustard-ink text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                        Best-seller
                      </span>
                    )}
                    {isSante && (
                      <span className="inline-flex items-center bg-sage text-spruce text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                        Santé
                      </span>
                    )}
                  </div>

                  {image ? (
                    <Image
                      src={image.url}
                      alt={image.altText ?? product.title}
                      fill
                      sizes="(min-width: 1024px) 280px, 50vw"
                      className="object-contain p-6 transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-ink-mute/40">
                      <span className="text-xs font-semibold">Photo a venir</span>
                    </div>
                  )}
                </div>

                {/* Infos produit */}
                <div className="p-5">
                  <h3 className="font-display font-bold text-[15px] text-ink leading-tight mb-2 line-clamp-2">
                    {product.title}
                  </h3>
                  <div className="flex items-center justify-between">
                    {variant && (
                      <p className="font-semibold text-[16px] text-spruce">
                        {formatPrice(variant.price)}
                      </p>
                    )}
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-sage text-spruce transition-colors group-hover:bg-fresh group-hover:text-white">
                      <Plus className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
