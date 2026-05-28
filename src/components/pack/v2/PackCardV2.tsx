import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Truck, Package } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { getBundleComponentImages } from '@/lib/shopify/bundle'
import type { ShopifyProduct, ShopifyMetafield } from '@/lib/shopify/types'

interface PackCardV2Props {
  product: ShopifyProduct
}

const FRANCO_THRESHOLD = 85 // euros

/**
 * Carte pack V2 — page /packs.
 * Cf. tech-specs/redesign-v2-direction-artistique.md §B.Packs
 *
 * Hierarchie visuelle :
 *  - Image du pack sur fond Background.webp (coherence catalogue/cross-sell).
 *  - Titre court, ligne benefice optionnelle (1-2 lignes max, depuis description).
 *  - Nombre de composants ("X produits inclus") deduit du metafield
 *    custom.composition (1 ligne = 1 produit, lignes vides ignorees).
 *    Fallback : "Pack complet" si metafield absent.
 *  - Prix barre (variant.compareAtPrice) + prix pack en sapin.
 *  - Pastille moutarde "Economise X €" si savings > 0.
 *  - Chip sage "Livraison offerte" si prix pack >= 85 € (franco declenche).
 *  - CTA "Voir le pack" qui mene a la fiche.
 */
function countComposition(metafields?: ShopifyMetafield[] | null): number | null {
  if (!metafields || metafields.length === 0) return null
  const found = metafields.find(
    (m) => m && m.namespace === 'custom' && m.key === 'composition'
  )
  if (!found?.value) return null
  const lines = found.value
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  return lines.length > 0 ? lines.length : null
}

function extractShortBenefit(description?: string): string | null {
  if (!description) return null
  // Premiere phrase ou 110 char max — coupe propre sur l'espace.
  const trimmed = description.trim()
  if (trimmed.length === 0) return null
  const firstSentence = trimmed.split(/[.\n]/)[0]?.trim()
  if (firstSentence && firstSentence.length > 0 && firstSentence.length <= 130) {
    return firstSentence
  }
  if (trimmed.length <= 130) return trimmed
  const cut = trimmed.slice(0, 110)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut) + '…'
}

export default function PackCardV2({ product }: PackCardV2Props) {
  const variant = product.variants.nodes[0]
  const priceAmount = variant ? parseFloat(variant.price.amount) : 0
  const compareAmount = variant?.compareAtPrice
    ? parseFloat(variant.compareAtPrice.amount)
    : 0
  const hasSavings = compareAmount > priceAmount && priceAmount > 0
  const savingsAmount = hasSavings ? compareAmount - priceAmount : 0
  const currency = variant?.price.currencyCode ?? 'EUR'

  // Source de verite visuelle = images des composants du bundle.
  // Adam : les bundles n'ont pas (et n'auront pas) d'image propre uploadee,
  // on construit donc le visuel a partir des featuredImage des produits
  // composants, accessibles via variants[0].components.productVariant.product.
  const componentImages = getBundleComponentImages(product)
  const hasComponents = componentImages.length > 0

  // Composants : on prefere le compte des composants Storefront, fallback
  // sur le metafield custom.composition s'il est rempli.
  const components = hasComponents ? componentImages.length : countComposition(product.metafields)
  const benefit = extractShortBenefit(product.description)

  const isFranco = priceAmount >= FRANCO_THRESHOLD

  return (
    <Link
      href={`/products/${product.handle}`}
      className="group flex flex-col bg-white rounded-2xl border border-spruce/10 overflow-hidden transition-all hover:-translate-y-1 hover:shadow-[0_10px_36px_rgba(45,90,45,0.08)]"
    >
      {/* ─── Visuel ─── */}
      <div
        className="relative w-full aspect-[4/5] bg-cover bg-bottom bg-no-repeat overflow-hidden"
        style={{ backgroundImage: "url('/Background.webp')" }}
      >
        {/* Pastille economies (mustard) */}
        {hasSavings && (
          <div className="absolute top-3 left-3 z-20 bg-mustard text-mustard-ink text-[11px] font-bold px-3 py-1.5 rounded-full shadow-sm">
            Économise {formatPrice({ amount: savingsAmount.toFixed(2), currencyCode: currency })}
          </div>
        )}

        {hasComponents ? (
          // Pots des composants empiles sur le fond. Plus il y en a, plus
          // on resserre (negative margin) pour rester dans la zone visible.
          <div className="absolute inset-0 flex items-end justify-center pb-5">
            <div
              className={`flex items-end justify-center ${
                componentImages.length >= 4
                  ? '-space-x-7 md:-space-x-9'
                  : componentImages.length === 3
                    ? '-space-x-5 md:-space-x-7'
                    : '-space-x-3 md:-space-x-5'
              }`}
            >
              {componentImages.slice(0, 5).map((img, i) => {
                // Taille decroissante des cotes pour donner du relief
                const heightPct =
                  componentImages.length >= 4
                    ? '54%'
                    : componentImages.length === 3
                      ? '60%'
                      : '65%'
                return (
                  <div
                    key={`${img.url}-${i}`}
                    className="relative transition-transform duration-500 group-hover:scale-105"
                    style={{ height: heightPct, zIndex: 10 + i }}
                  >
                    <Image
                      src={img.url}
                      alt={img.altText ?? img.productTitle}
                      width={200}
                      height={200}
                      className="h-full w-auto object-contain drop-shadow-2xl"
                    />
                  </div>
                )
              })}
            </div>
          </div>
        ) : product.featuredImage ? (
          // Fallback : bundle a quand meme une featuredImage uploadee
          <div className="absolute inset-0 flex items-end justify-center pb-5">
            <Image
              src={product.featuredImage.url}
              alt={product.featuredImage.altText ?? product.title}
              width={260}
              height={260}
              className="relative z-10 w-auto h-[68%] object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-12 h-12 text-spruce/30" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-white to-transparent z-0" />
      </div>

      {/* ─── Corps ─── */}
      <div className="flex flex-col flex-1 p-5 md:p-6">
        <h3 className="font-display font-bold text-[17px] md:text-[18px] text-ink leading-tight mb-2">
          {product.title}
        </h3>

        {benefit && (
          <p className="text-[13.5px] text-ink-mute leading-[1.55] mb-4 line-clamp-2">
            {benefit}
          </p>
        )}

        {/* Composants */}
        <div className="inline-flex items-center gap-1.5 text-[12px] text-ink-mute font-medium mb-5">
          <Package className="w-3.5 h-3.5" />
          {components ? `${components} produits inclus` : 'Pack complet'}
        </div>

        {/* Prix + CTA — au fond de la carte */}
        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="font-display text-[22px] md:text-[24px] font-extrabold text-spruce">
              {formatPrice({ amount: priceAmount.toFixed(2), currencyCode: currency })}
            </span>
            {hasSavings && (
              <span className="text-[14px] text-ink-mute line-through tabular-nums">
                {formatPrice({ amount: compareAmount.toFixed(2), currencyCode: currency })}
              </span>
            )}
          </div>

          {isFranco && (
            <div className="inline-flex items-center gap-1.5 bg-sage text-spruce text-[11.5px] font-semibold px-2.5 py-1 rounded-full mb-3">
              <Truck className="w-3 h-3" />
              Livraison offerte
            </div>
          )}

          <div className="inline-flex items-center gap-2 bg-fresh text-white font-semibold text-[14px] px-5 py-2.5 rounded-full transition-colors group-hover:bg-fresh-deep">
            Voir le pack
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </Link>
  )
}
