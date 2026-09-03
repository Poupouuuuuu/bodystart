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

  // Badges par ordre d'utilité commerciale décroissante, PLAFONNÉS À 2 (cf. le
  // bloc de rendu). La promo passe toujours en premier quand elle existe.
  // `!!discountPct` : la remise peut valoir 0 (arrondi d'un écart < 0,5 %) et
  // 0 est falsy — on ne veut ni « -0% », ni un littéral 0 rendu dans le JSX.
  const badges = [
    ...(discountPct
      ? [{ label: `-${discountPct}%`, className: 'bg-terracotta text-white' }]
      : []),
    ...(isBest ? [{ label: 'Best-seller', className: 'bg-mustard text-mustard-ink' }] : []),
    ...(showLowStock
      ? [{ label: `Plus que ${stockAtStore}`, className: 'bg-terracotta/90 text-white' }]
      : []),
    ...(isSante ? [{ label: 'Santé', className: 'bg-sage/95 text-spruce' }] : []),
  ].slice(0, 2)

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
    // PREMIUM V2 (2026-08) : la bordure permanente est retirée. Bordure + ombre
    // + fond blanc est LE trio le plus générique du web — l'élévation seule
    // (ombre teintée verte) suffit à détacher la carte du fond crème, et la
    // grille respire beaucoup plus. Le rayon est volontairement plus généreux
    // (20px) que celui des éléments internes : hiérarchie de rayons.
    <div className="group flex flex-col overflow-hidden rounded-[20px] bg-white shadow-card transition-all duration-300 ease-out-expo hover:-translate-y-1.5 hover:shadow-lift">
      {/* Zone image avec fond vegetal */}
      <Link
        href={`/products/${product.handle}`}
        className="relative block w-full aspect-[4/5] overflow-hidden bg-cover bg-bottom bg-no-repeat"
        style={{ backgroundImage: "url('/bg-vegetal.webp')" }}
      >
        <div className="absolute inset-0 flex items-end justify-center pb-4">
          {product.featuredImage ? (
            <Image
              src={product.featuredImage.url}
              alt={product.featuredImage.altText ?? product.title}
              width={200}
              height={200}
              // h-[70%] (au lieu de 65) : le produit occupe plus de place, c'est
              // lui la star. Ombre portée TEINTÉE verte au lieu du drop-shadow-2xl
              // noir, qui grisait le végétal derrière.
              className={cn(
                'relative z-10 h-[70%] w-auto object-contain transition-transform duration-500 ease-out-expo group-hover:scale-[1.07]',
                '[filter:drop-shadow(0_18px_22px_rgba(45,90,45,0.28))]',
                soldOut && 'opacity-60 saturate-[0.55]'
              )}
            />
          ) : (
            <div className="relative z-10 w-16 h-16 bg-white/40 rounded-full flex items-center justify-center mb-8">
              <span className="font-display font-bold text-lg text-white/70">BS</span>
            </div>
          )}
        </div>

        {/* Gradient fondu blanc en bas (raccord avec la carte) */}
        <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-white to-transparent z-0" />

        {/* Badges — PREMIUM V2 : HIÉRARCHISÉS ET PLAFONNÉS À 2.
            Avant, un produit pouvait empiler « -20% + Best-seller + Santé +
            Plus que 3 en stock » : quatre pastilles = effet sapin de Noël, plus
            aucune ne se lit. On garde la promo (l'argument le plus vendeur) puis
            UN seul badge secondaire, par ordre d'utilité commerciale.
            Étiquettes à coins doux (rounded-lg) et non des pilules : plus sobre,
            moins « composant par défaut ». */}
        <div className="absolute left-3 top-3 z-30 flex flex-col items-start gap-1.5">
          {soldOut ? (
            <span className="inline-flex items-center rounded-lg bg-ink/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm">
              Épuisé
            </span>
          ) : (
            badges.map((b) => (
              <span
                key={b.label}
                className={cn(
                  'inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] backdrop-blur-sm',
                  b.className
                )}
              >
                {b.label}
              </span>
            ))
          )}
        </div>
      </Link>

      {/* Contenu */}
      <div className="p-5 flex flex-col flex-1">
        {/* Libelle categorie reelle (si dispo) */}
        {categoryLabel && (
          <span className="text-[12px] text-ink-mute font-medium mb-1.5">
            {categoryLabel}
          </span>
        )}

        {/* Titre — Fraunces : un cran plus grand qu'avant, le serif porte le nom
            du produit. min-h réservé pour aligner les prix d'une même rangée. */}
        <Link href={`/products/${product.handle}`}>
          <h3 className="mb-1.5 line-clamp-2 min-h-[2.6rem] font-display text-[16px] font-bold leading-[1.25] text-spruce transition-colors hover:text-fresh-deep">
            {product.title}
          </h3>
        </Link>

        {/* Une ligne de benefice court (optionnelle, capitalisee) */}
        {shortBenefit && (
          <p className="text-[13px] text-ink-mute leading-snug mb-3 line-clamp-1">
            {capitalizeFirst(shortBenefit)}
          </p>
        )}

        {/* Prix + bouton ajout discret (icone +) */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex items-baseline gap-2">
            {/* Le prix en serif extrabold : c'est LE chiffre de la carte, il doit
                dominer le titre (19px contre 16px). */}
            <span className="font-display text-[19px] font-extrabold tracking-tight text-spruce">
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
              'flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200 ease-out-expo',
              canQuickAct && !adding
                ? 'bg-fresh text-white shadow-soft hover:scale-105 hover:bg-fresh-deep hover:shadow-card active:scale-95'
                : 'cursor-not-allowed bg-spruce/10 text-spruce/30'
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
