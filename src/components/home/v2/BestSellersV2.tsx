import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Plus } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/types'
import { formatPrice } from '@/lib/utils'
import { isBundle, getBundleComponentImages } from '@/lib/shopify/bundle'
import BundleComposite from '@/components/pack/v2/BundleComposite'

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
            const productIsBundle = isBundle(product)
            const bundleImages = productIsBundle ? getBundleComponentImages(product) : []

            return (
              <Link
                key={product.id}
                href={`/products/${product.handle}`}
                className="group bg-white rounded-2xl border border-spruce/10 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(45,90,45,0.08)] flex flex-col"
              >
                {/* Zone image avec Background vegetal /Background.webp
                    (meme traitement que /products — cf. ProductsPageClient.tsx
                    + FeaturedProducts.tsx V1) */}
                <div
                  className="relative w-full aspect-[4/5] bg-cover bg-bottom bg-no-repeat overflow-hidden"
                  style={{ backgroundImage: "url('/Background.webp')" }}
                >
                  {/* Badges au-dessus du fond vegetal */}
                  <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
                    {isFirst && (
                      <span className="inline-flex items-center bg-mustard text-mustard-ink text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                        Best-seller
                      </span>
                    )}
                    {isSante && (
                      <span className="inline-flex items-center bg-sage text-spruce text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
                        Santé
                      </span>
                    )}
                  </div>

                  {bundleImages.length > 0 ? (
                    // Pack : meme composite que /packs (pots empiles), au lieu du "BS"
                    <BundleComposite
                      images={bundleImages}
                      alt={product.title}
                      variant="card"
                      fallbackImage={product.featuredImage}
                      sizes="(min-width: 1024px) 280px, 50vw"
                    />
                  ) : (
                    <>
                      {/* Image produit en bas-centre, ombre portee, hover scale */}
                      <div className="absolute inset-0 flex items-end justify-center pb-4">
                        {image ? (
                          <Image
                            src={image.url}
                            alt={image.altText ?? product.title}
                            width={220}
                            height={220}
                            sizes="(min-width: 1024px) 280px, 50vw"
                            className="relative z-10 w-auto h-[65%] object-contain drop-shadow-2xl transition-transform duration-700 ease-out group-hover:scale-110"
                          />
                        ) : (
                          <div className="relative z-10 w-16 h-16 bg-white/30 rounded-full flex items-center justify-center mb-6">
                            <span className="font-display font-black text-xl text-white/60">BS</span>
                          </div>
                        )}
                      </div>

                      {/* Gradient fondu blanc en bas (raccord visuel avec la carte) */}
                      <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-white to-transparent z-0" />
                    </>
                  )}
                </div>

                {/* Infos produit */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <h3 className="font-display font-bold text-[15px] text-ink leading-tight mb-3 line-clamp-2">
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
