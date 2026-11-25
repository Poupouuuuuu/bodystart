import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import type { ShopifyProduct } from '@/lib/shopify/types'
import { ProductCardShop } from '@/components/product/ProductCardShop'
import { cn, formatPrice } from '@/lib/utils'
import { cardPriceOf } from '@/lib/product-price'
import { altImage, altProduit } from '@/lib/alt-produit'

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
  // Même prix que la carte catalogue : variante en stock la moins chère,
  // « dès » si les prix varient, prix barré seulement sur cette variante.
  const prix = cardPriceOf(product)
  const soldOut = product.availableForSale === false
  const image = product.featuredImage
  const blurb = product.description?.trim().split(/[.\n]/)[0]?.trim()

  return (
    <Link
      href={`/products/${product.handle}`}
      className="group col-span-2 lg:row-span-2"
      aria-label={`Voir ${product.title}`}
    >
      {/* Double enceinte : plateau crème-vert + cœur blanc, rayons concentriques. */}
      <div className="carte-produit h-full rounded-[2rem] bg-spruce/[0.06] p-1.5 ring-1 ring-spruce/10 transition-all duration-700 ease-out-expo group-hover:-translate-y-1.5 group-hover:shadow-lift">
        <div className="flex h-full flex-col overflow-hidden rounded-[calc(2rem-0.375rem)] bg-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.6)]">
          <div
            className="relative flex min-h-[300px] flex-1 items-center justify-center bg-cover bg-center sm:min-h-[380px] lg:min-h-0"
            style={{ backgroundImage: "url('/bg-vegetal-800.webp')" }}
          >
            {/* Même badge « Épuisé » que la carte catalogue (ProductCardShop). */}
            {soldOut ? (
              <span className="absolute left-5 top-5 z-10 inline-flex items-center rounded-lg bg-ink/90 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm">
                Épuisé
              </span>
            ) : (
              <span className="absolute left-5 top-5 z-10 badge-saison inline-flex items-center rounded-lg bg-mustard px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-mustard-ink shadow-soft">
                Best-seller
              </span>
            )}
            {image ? (
              <div className="relative h-[78%] w-[78%]">
                <Image
                  src={image.url}
                  alt={altImage(image, altProduit(product))}
                  fill
                  sizes="(max-width: 1024px) 90vw, 560px"
                  className={cn(
                    'object-contain transition-transform duration-700 ease-out-expo [filter:drop-shadow(0_28px_32px_rgba(45,90,45,0.32))] group-hover:scale-[1.05]',
                    soldOut && 'opacity-60 saturate-[0.55]'
                  )}
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
              {prix && (
                <p className="mt-4 flex items-baseline gap-2 font-display text-[26px] font-extrabold tabular-nums text-spruce md:text-[30px]">
                  {prix.from && <span className="font-sans text-[15px] font-medium text-ink-mute">dès</span>}
                  {formatPrice(prix.price)}
                  {prix.compareAt && (
                    <span className="font-sans text-[14px] font-medium text-ink-mute line-through">
                      {formatPrice(prix.compareAt)}
                    </span>
                  )}
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
  // Ordre imposé par le metafield bodystart.accueil_vedettes (19/10/2026) :
  // le premier produit prend la grande tuile, les 4 suivants les cartes. Un
  // produit épuisé ne prend la grande tuile que s'il n'y a rien d'autre.
  const featured = items.find((p) => p.availableForSale !== false) ?? items[0]
  const rest = items.filter((p) => p.id !== featured.id).slice(0, 4)

  return (
    // saison-* : marqueurs de la déco de saison (fond nuit, mot et icône du
    // titre), sans effet hors période (components/saison/halloween/styles.ts).
    <section className="saison-nuit bg-canvas">
      <div className="container py-14 md:py-28">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-10">
          <div>
            <span className="saison-nuit-libelle inline-flex items-center rounded-full border border-spruce/15 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-ink-mute">
              Les plus pris en boutique
            </span>
            <h2 className="saison-titre saison-nuit-titre mt-5 font-display text-[40px] font-extrabold leading-[0.98] tracking-tight text-spruce md:text-[56px] lg:text-[64px] [text-wrap:balance]">
              Ce qui part <span className="saison-mot">vite</span>
              <br />
              chez nous.
            </h2>
          </div>
          <Link
            href="/products"
            className="saison-nuit-lien group inline-flex w-max items-center gap-3 rounded-full border border-spruce/20 py-1.5 pl-5 pr-1.5 text-[14px] font-semibold text-spruce transition-all duration-500 ease-out-expo hover:border-spruce hover:bg-white"
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
