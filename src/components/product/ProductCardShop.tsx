'use client'

/**
 * Carte produit V2 — LA carte unique du site (DA claire).
 *
 * Extraite de ProductsPageClient (sprint 2 « cohérence DA », 2026-07-04) pour
 * remplacer les 3 designs qui coexistaient : ProductCard V1 (/categories,
 * /search — overlay noir, palette brand/cream), carte inline BestSellersV2
 * (home — faux bouton « + » décoratif) et celle-ci. Un produit = une seule tête,
 * quelle que soit la page.
 *
 * Comportements :
 *   - fond végétal + badges DA (Épuisé / -X% / Best-seller / Santé / stock bas)
 *   - quick-add « + » : mono-variante dispo → ajout direct ; multi-variantes →
 *     navigation vers la fiche (choix de saveur) ; épuisé → grisé
 *   - cible tactile 44px, aria-labels explicites
 */
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import type { ShopifyProduct } from '@/lib/shopify/types'

// ─── Badges (tags Shopify → pastilles) ───

const SANTE_TAGS = new Set(['sante', 'santé', 'omega', 'omega-3', 'magnesium', 'vitamine', 'collagene', 'collagene-marin', 'immunite'])

export function isSanteProduct(p: ShopifyProduct): boolean {
  return (p.tags ?? []).some((t) => SANTE_TAGS.has(t.toLowerCase()))
}

export function isBestSeller(p: ShopifyProduct): boolean {
  return (p.tags ?? []).some((t) => {
    const tag = t.toLowerCase()
    return tag === 'best-seller' || tag === 'bestseller' || tag === 'best_seller'
  })
}

/** Capitalise la 1re lettre uniquement (sentence case, pas title case). */
function capitalizeFirst(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Tags techniques qui font déjà office de badge → exclus du bénéfice court.
const TECHNICAL_TAGS = new Set([
  'best-seller', 'bestseller', 'nouveau', 'new', 'sante', 'santé', 'whey', 'vegan',
  'sans-sucre', 'sans-gluten', 'bio', 'anti-dopage', 'made-in-france',
])

export interface ProductCardShopProps {
  product: ShopifyProduct
  /** Stock boutique (badge « Plus que X en stock ») — /products uniquement. */
  stockAtStore?: number
}

export function ProductCardShop({ product, stockAtStore }: ProductCardShopProps) {
  const variant = product.variants.nodes[0]
  const soldOut = product.availableForSale === false
  const { addItem } = useCart()
  const [adding, setAdding] = useState(false)
  const router = useRouter()
  // Multi-variantes (saveurs/formats) : le quick-add « + » ajoutait silencieusement
  // la 1re variante → mauvaise saveur commandée. On navigue vers la fiche à la place.
  const hasMultipleVariants = product.variants.nodes.length > 1

  // Vrai libelle categorie (collection title preferee, sinon productType, sinon null)
  const categoryLabel = product.collections?.nodes?.[0]?.title ?? product.productType ?? null

  // Bénéfice court : on prend le 1er tag "humain" lisible si disponible
  const shortBenefit = (product.tags ?? []).find(
    (t) => t.length <= 30 && !TECHNICAL_TAGS.has(t.toLowerCase()) && !t.includes('_')
  )

  const isSante = isSanteProduct(product)
  const isBest = isBestSeller(product)
  const showLowStock = stockAtStore !== undefined && stockAtStore > 0 && stockAtStore <= 5

  // Promo si compareAtPrice > price
  const hasDiscount =
    variant?.compareAtPrice &&
    parseFloat(variant.compareAtPrice.amount) > parseFloat(variant.price.amount)
  const discountPct = hasDiscount
    ? Math.round(
        ((parseFloat(variant!.compareAtPrice!.amount) - parseFloat(variant!.price.amount)) /
          parseFloat(variant!.compareAtPrice!.amount)) *
          100
      )
    : null

  // Le bouton est actif si : multi-variantes AVEC au moins une dispo (→ fiche),
  // ou mono-variante disponible (→ ajout direct). Produit épuisé → grisé,
  // cohérent avec les cartes mono-variante (la carte reste cliquable ailleurs).
  const canQuickAct = hasMultipleVariants ? !soldOut : !!variant?.availableForSale

  async function handleAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (!canQuickAct) return
    if (hasMultipleVariants) {
      // Le client doit choisir sa saveur/son format sur la fiche.
      router.push(`/products/${product.handle}`)
      return
    }
    setAdding(true)
    try {
      await addItem(variant.id)
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden flex flex-col bg-white border border-spruce/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(45,90,45,0.08)] group">
      {/* Zone image avec fond vegetal */}
      <Link
        href={`/products/${product.handle}`}
        className="relative w-full aspect-[4/5] bg-cover bg-bottom bg-no-repeat overflow-hidden block"
        style={{ backgroundImage: "url('/bg-vegetal.webp')" }}
      >
        <div className="absolute inset-0 flex items-end justify-center pb-4">
          {product.featuredImage ? (
            <Image
              src={product.featuredImage.url}
              alt={product.featuredImage.altText ?? product.title}
              width={200}
              height={200}
              className={cn("relative z-10 w-auto h-[65%] object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105", soldOut && "opacity-60")}
            />
          ) : (
            <div className="relative z-10 w-16 h-16 bg-white/40 rounded-full flex items-center justify-center mb-8">
              <span className="font-display font-bold text-lg text-white/70">BS</span>
            </div>
          )}
        </div>

        {/* Gradient fondu blanc en bas (raccord avec la carte) */}
        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-white to-transparent z-0" />

        {/* Badges discrets - palette DA. Si épuisé : on n'affiche que « Épuisé ». */}
        <div className="absolute top-3 left-3 z-30 flex flex-col gap-1.5 items-start">
          {soldOut ? (
            <span className="inline-flex items-center bg-ink text-white text-[10px] font-semibold px-2.5 py-1 rounded-full shadow-sm">
              Épuisé
            </span>
          ) : (
            <>
              {/* !! : discountPct peut valoir 0 (remise < 0,5 % arrondie) — {0 && …}
                  rendrait le littéral « 0 » dans le JSX. */}
              {!!discountPct && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-terracotta text-white">
                  -{discountPct}%
                </span>
              )}
              {isBest && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-mustard text-mustard-ink">
                  Best-seller
                </span>
              )}
              {isSante && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-sage text-spruce">
                  Santé
                </span>
              )}
              {showLowStock && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-terracotta text-white">
                  Plus que {stockAtStore} en stock
                </span>
              )}
            </>
          )}
        </div>
      </Link>

      {/* Contenu */}
      <div className="p-5 flex flex-col flex-1">
        {/* Libelle categorie reelle (si dispo) */}
        {categoryLabel && (
          <span className="text-[11px] text-ink-mute font-medium mb-1.5">
            {categoryLabel}
          </span>
        )}

        {/* Titre - sentence case (pas d'uppercase CSS) */}
        <Link href={`/products/${product.handle}`}>
          <h3 className="font-display font-bold text-spruce text-[15px] leading-snug mb-1.5 line-clamp-2 min-h-[2.5rem] hover:text-fresh-deep transition-colors">
            {product.title}
          </h3>
        </Link>

        {/* Une ligne de benefice court (optionnelle, capitalisee) */}
        {shortBenefit && (
          <p className="text-[12px] text-ink-mute leading-snug mb-3 line-clamp-1">
            {capitalizeFirst(shortBenefit)}
          </p>
        )}

        {/* Prix + bouton ajout discret (icone +) */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex items-baseline gap-2">
            <span className="font-display font-extrabold text-spruce text-[18px]">
              {formatPrice(product.priceRange.minVariantPrice)}
            </span>
            {variant?.compareAtPrice && hasDiscount && (
              <span className="text-[12px] text-ink-mute line-through">
                {formatPrice(variant.compareAtPrice)}
              </span>
            )}
          </div>

          <button
            onClick={handleAdd}
            disabled={!canQuickAct || adding}
            aria-label={
              hasMultipleVariants
                ? `Choisir la saveur de ${product.title}`
                : `Ajouter ${product.title} au panier`
            }
            className={cn(
              // w-11 = 44px : minimum tactile. flex-shrink-0 : ne pas se faire
              // comprimer par la ligne prix sur les colonnes étroites.
              'flex items-center justify-center w-11 h-11 flex-shrink-0 rounded-full transition-colors',
              canQuickAct && !adding
                ? 'bg-fresh text-white hover:bg-fresh-deep'
                : 'bg-spruce/10 text-spruce/30 cursor-not-allowed'
            )}
          >
            {adding ? (
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
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
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
