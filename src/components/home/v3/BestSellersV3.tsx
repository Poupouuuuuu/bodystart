import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/types'
import { ProductCardShop } from '@/components/product/ProductCardShop'
import { formatPrice } from '@/lib/utils'

/**
 * Best-sellers V3 — grille « bento » asymétrique.
 *
 * V2 : 4 cartes identiques alignées = la grille de n'importe quelle boutique.
 * V3 : le produit n°1 est MIS EN SCÈNE dans une grande tuile (2 colonnes ×
 * 2 rangées sur desktop, pleine largeur sur mobile), les 4 suivants gardent
 * la carte catalogue. Même données Shopify, hiérarchie visuelle nouvelle.
 */
interface BestSellersV3Props {
  products: ShopifyProduct[]
}

function FeaturedTile({ product }: { product: ShopifyProduct }) {
  const variant = product.variants.nodes[0]
  const price = variant
    ? formatPrice({ amount: variant.price.amount, currencyCode: variant.price.currencyCode })
    : null
  const image = product.featuredImage
  const blurb = product.description?.trim().split(/[.\n]/)[0]?.trim()

  return (
    <Link
      href={`/products/${product.handle}`}
      className="group col-span-2 lg:row-span-2"
      aria-label={`Voir ${product.title}`}
    >
      {/* Double enceinte : plateau crème-vert + cœur blanc, rayons concentriques. */}
      <div className="h-full rounded-[2rem] bg-spruce/[0.06] p-1.5 ring-1 ring-spruce/10 transition-all duration-700 ease-out-expo group-hover:-translate-y-1.5 group-hover:shadow-lift">
        <div className="flex h-full flex-col overflow-hidden rounded-[calc(2rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
          <div
            className="relative flex min-h-[300px] flex-1 items-center justify-center bg-cover bg-center sm:min-h-[380px] lg:min-h-0"
            style={{ backgroundImage: "url('/bg-vegetal.webp')" }}
          >
            <span className="absolute left-5 top-5 z-10 inline-flex items-center rounded-lg bg-mustard px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-mustard-ink shadow-soft">
              Best-seller
            </span>
            {image ? (
              <div className="relative h-[78%] w-[78%]">
                <Image
                  src={image.url}
                  alt={image.altText ?? product.title}
                  fill
                  sizes="(max-width: 1024px) 90vw, 560px"
                  className="object-contain transition-transform duration-700 ease-out-expo [filter:drop-shadow(0_28px_32px_rgba(45,90,45,0.32))] group-hover:scale-[1.05]"
                />
              </div>
            ) : null}
          </div>

          <div className="flex items-end justify-between gap-6 px-6 pb-6 pt-5 md:px-8 md:pb-8">
            <div className="min-w-0">
              {product.productType && (
                <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-ink-mute">
                  {product.productType}
                </p>
              )}
              <h3 className="font-display text-[24px] font-bold leading-[1.05] tracking-tight text-spruce md:text-[30px]">
                {product.title}
              </h3>
              {blurb && (
                <p className="mt-2 line-clamp-2 max-w-[440px] text-[14px] leading-[1.55] text-ink-mute md:text-[15px]">
                  {blurb}
                </p>
              )}
              {price && (
                <p className="mt-4 font-display text-[26px] font-extrabold tabular-nums text-spruce md:text-[30px]">
                  {price}
                </p>
              )}
            </div>
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-spruce text-canvas transition-transform duration-700 ease-out-expo group-hover:-rotate-45 md:h-14 md:w-14">
              <ArrowRight className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function BestSellersV3({ products }: BestSellersV3Props) {
  const items = products.slice(0, 5)
  if (items.length === 0) return null
  // La grande tuile met en scène un produit qui la remplit : d'abord un
  // produit tagué best-seller, sinon le plus cher des 5 (un pot de whey ou de
  // créatine, pas une barre à 2,90 € perdue dans 600 px de fond végétal —
  // c'est ce que donnait l'ordre brut de la collection Shopify).
  const priceOf = (p: ShopifyProduct) => parseFloat(p.variants.nodes[0]?.price.amount ?? '0')
  const featured =
    items.find((p) => (p.tags ?? []).some((t) => /best.?seller/i.test(t))) ??
    [...items].sort((a, b) => priceOf(b) - priceOf(a))[0]
  const rest = items.filter((p) => p.id !== featured.id).slice(0, 4)

  return (
    <section className="bg-canvas">
      <div className="container py-20 md:py-28">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10">
          <div>
            <span className="inline-flex items-center rounded-full border border-spruce/15 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-mute">
              Les plus pris en boutique
            </span>
            <h2 className="mt-5 font-display text-[40px] font-extrabold leading-[0.98] tracking-tight text-spruce md:text-[56px] lg:text-[64px] [text-wrap:balance]">
              Ce qui part vite
              <br />
              chez nous.
            </h2>
          </div>
          <Link
            href="/products"
            className="group inline-flex w-max items-center gap-3 rounded-full border border-spruce/20 py-1.5 pl-5 pr-1.5 text-[14px] font-semibold text-spruce transition-all duration-500 ease-out-expo hover:border-spruce hover:bg-white"
          >
            Tout le catalogue
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sage text-spruce transition-all duration-500 ease-out-expo group-hover:translate-x-0.5 group-hover:bg-spruce group-hover:text-canvas">
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-4 lg:grid-rows-2 lg:gap-6">
          <FeaturedTile product={featured} />
          {rest.map((product) => (
            <ProductCardShop key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
