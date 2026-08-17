'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { ShoppingCart, Check, Minus, Plus, Truck, Store, ShieldCheck, RotateCcw, Award, Star } from 'lucide-react'
import { formatPrice, cn } from '@/lib/utils'
import { GOOGLE_LISTING_URL, GOOGLE_RATING } from '@/lib/store-info'
import { useCart } from '@/hooks/useCart'
import ProductGalleryV2 from './ProductGalleryV2'
import BundleGalleryV2 from './BundleGalleryV2'
import BundleSelectorsV2 from './BundleSelectorsV2'
import { getBundleComponentDetailsFromVariant, pickInitialBundleVariant } from '@/lib/shopify/bundle'
import type { ShopifyImage, ShopifyProductVariant, BodyStartStore } from '@/lib/shopify/types'

interface BuyBoxV2Props {
  images: ShopifyImage[]
  variants: ShopifyProductVariant[]
  title: string
  discountPct: number | null
  collectionName: string | null
  collectionHandle: string | null
  activeStore?: BodyStartStore
  /**
   * gid du produit — sert au fetch CLIENT du stock boutique par variante
   * (/api/inventory?productId=…&locationId=…). La page est en ISR : le stock
   * C&C reste temps réel car il est chargé au montage, pas au rendu serveur.
   * Le bloc stock n'apparaît qu'une fois la réponse reçue (pas de flash faux).
   */
  productId?: string
  benefits?: string[]
  /** Format / grammage du produit (ex: "1,5 kg"). Source : metafield Shopify. */
  format?: string | null
  /** Fournisseur Shopify (vendor) du produit, affiche en eyebrow. */
  vendor?: string | null
  /**
   * Si true, on bascule en mode bundle : galerie gauche = BundleGalleryV2
   * (grille des composants sur fond vegetal, dynamique selon la variante
   * de bundle selectionnee) + selecteurs par composant via BundleSelectorsV2.
   * La logique d'achat (panier, sticky bar) reste exactement la meme.
   *
   * On derive les details bundle dynamiquement de selectedVariant en
   * interne (image variant-specific, format, etc.).
   */
  isBundle?: boolean
}

const LOW_STOCK_THRESHOLD = 5

// Décomposition du titre de variante Shopify « Saveur / Format ».
// Matching EXACT sur chaque segment — l'ancien `title.includes(flavor)`
// était fragile (« vanille » matchait « vanille-1 », etc.).
const variantFlavor = (v: ShopifyProductVariant) => v.title.split(' / ')[0]?.trim() || v.title
const variantSize = (v: ShopifyProductVariant) => v.title.split(' / ')[1]?.trim() ?? ''

/**
 * Buy box V2 — galerie gauche + panneau achat droite.
 * Cf. tech-specs/redesign-v2-direction-artistique.md §B.Fiche produit.1
 *      tech-specs/site-rewrite-copy-v1.md §4.1 (abonnement RETIRE)
 *
 * Decisions appliquees :
 * - Pas d'abonnement (achat unique only)
 * - Stock <= 5 → chiffre exact terracotta ; sinon "En stock" sage
 * - Reassurance sous le bouton : livraison 85 € · retrait quelques minutes · paiement securise
 */
export default function BuyBoxV2({
  images,
  variants,
  title,
  discountPct,
  collectionHandle,
  activeStore,
  productId,
  benefits = [],
  format = null,
  vendor = null,
  isBundle = false,
}: BuyBoxV2Props) {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  // Pour un bundle, on démarre sur une variante COMPLÈTE (composants tous
  // présents) : évite d'afficher un prix / une galerie issus d'une
  // combinaison cassée (ex Sub Zero chocolate-muffin 810g qui n'existe pas).
  const [selectedVariant, setSelectedVariant] = useState<ShopifyProductVariant>(() =>
    isBundle ? pickInitialBundleVariant(variants) : variants[0]
  )
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [isStickyVisible, setIsStickyVisible] = useState(false)
  const { addItem } = useCart()

  // Mode bundle : on derive les details des composants depuis la variante
  // ACTUELLEMENT selectionnee. Quand BundleSelectorsV2 change la variante,
  // ce useMemo recompute → BundleGalleryV2 re-render avec les bonnes
  // images (image variant-specific en priorite, sinon featuredImage produit).
  const bundleDetails = useMemo(() => {
    if (!isBundle) return []
    return getBundleComponentDetailsFromVariant(selectedVariant)
  }, [isBundle, selectedVariant])
  const isBundleMode = bundleDetails.length > 0

  // Saveurs / formats
  const flavors = Array.from(new Set(variants.map(variantFlavor)))
  const defaultSizes = Array.from(
    new Set(variants.map(variantSize).filter(Boolean))
  )
  const [selectedFlavor, setSelectedFlavor] = useState<string>(
    variantFlavor(selectedVariant) || flavors[0]
  )
  const [selectedSize, setSelectedSize] = useState<string>(
    variantSize(selectedVariant) || defaultSizes[0] || ''
  )

  const handleOptionChange = (flavor: string, size: string) => {
    // ⚠️ Ne JAMAIS mettre à jour les pastilles avant d'avoir résolu la
    // variante : l'ancien code posait selectedFlavor/Size d'abord — si la
    // combinaison saveur × format n'existait pas (ex. Vanilla Ice Cream
    // seulement en 6.8kg alors qu'on est sur 2.27kg), la pastille s'affichait
    // sélectionnée mais prix + « Ajouter au panier » restaient sur l'ANCIENNE
    // saveur → mauvaise saveur commandée.
    let found = size ? variants.find((v) => variantFlavor(v) === flavor && variantSize(v) === size) : undefined
    if (!found) {
      // Combinaison inexistante : on bascule sur un format EXISTANT de la
      // saveur demandée (achetable de préférence) — comportement standard.
      const flavorVariants = variants.filter((v) => variantFlavor(v) === flavor)
      found = flavorVariants.find((v) => v.availableForSale) ?? flavorVariants[0]
    }
    if (!found) return // saveur inconnue → on ne touche à rien (zéro désync)

    setSelectedVariant(found)
    setSelectedFlavor(variantFlavor(found))
    setSelectedSize(variantSize(found))
    // Sync image galerie si la variante a une image dediee
    if (found.image?.url) {
      const matchIndex = images.findIndex((img) => img.url === found.image?.url)
      if (matchIndex >= 0) setSelectedImageIndex(matchIndex)
    }
  }

  /**
   * Sens inverse galerie → selecteur de saveur (synchro bidirectionnelle).
   *
   * Quand on clique une vignette, on remonte cette image au mapping
   * variant.image.url existant (deja utilise pour le sens forward
   * saveur → image). Si elle correspond au featured media d'une variante,
   * on bascule aussi la selection de saveur/format pour que le pill
   * actif suive l'image affichee.
   *
   * Cas image secondaire (produit avec plus d'images que de variantes) :
   * matchingVariant est undefined, on update juste l'index image sans
   * toucher a la variante selectionnee. Pas de desselection, pas de reset.
   */
  const handleImageChange = useCallback(
    (index: number) => {
      setSelectedImageIndex(index)

      const clickedImage = images[index]
      if (!clickedImage) return

      const matchingVariant = variants.find((v) => v.image?.url === clickedImage.url)
      if (!matchingVariant) return // image secondaire non rattachee a une variante
      if (matchingVariant.id === selectedVariant.id) return // deja selectionnee

      setSelectedVariant(matchingVariant)
      const parts = matchingVariant.title.split(' / ').map((s) => s.trim())
      const flavor = parts[0]
      const size = parts[1] ?? ''
      if (flavor) setSelectedFlavor(flavor)
      setSelectedSize(size)
    },
    [images, variants, selectedVariant.id]
  )

  async function handleAddToCart() {
    if (!selectedVariant.availableForSale) return
    setAdding(true)
    try {
      // UN SEUL appel avec la quantité (addItem la supporte nativement) —
      // la boucle historique faisait N aller-retours Shopify + N toasts.
      // « Ajouté ✓ » UNIQUEMENT si l'ajout a réellement réussi : addItem avale
      // ses erreurs (toast) et renvoie false — avant, le bouton passait au
      // vert même quand l'appel Shopify échouait (panier vide au checkout).
      const ok = await addItem(selectedVariant.id, quantity)
      if (ok) {
        setAdded(true)
        setTimeout(() => setAdded(false), 2000)
      }
    } finally {
      setAdding(false)
    }
  }

  // Sticky bar visible quand on scroll au-dela du bouton principal
  useEffect(() => {
    const handleScroll = () => setIsStickyVisible(window.scrollY > 800)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // A11y : la sticky bar cachée n'est que translate-y-full (hors écran mais
  // dans le DOM) — sans inert, son bouton restait tabbable en permanence.
  const stickyBarRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const bar = stickyBarRef.current
    if (!bar) return
    if (isStickyVisible) bar.removeAttribute('inert')
    else bar.setAttribute('inert', '')
  }, [isStickyVisible])

  // Stock boutique PAR VARIANTE, fetché côté client (page en ISR → le rendu
  // serveur est caché, mais ce fetch tourne à chaque visite = temps réel).
  // null = pas encore chargé / échec → bloc stock masqué (storeStock undefined).
  const [variantStock, setVariantStock] = useState<Record<string, number> | null>(null)
  useEffect(() => {
    // Bundles : le bloc stock est toujours masqué (un pack n'a pas d'inventaire
    // propre) → inutile de consommer un appel Admin + le rate-limit du visiteur.
    if (isBundle) return
    if (!productId || !activeStore?.shopifyLocationId) return
    let cancelled = false
    const params = new URLSearchParams({
      productId,
      locationId: activeStore.shopifyLocationId,
    })
    fetch(`/api/inventory?${params}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (cancelled || !j?.variants) return
        const map: Record<string, number> = {}
        for (const v of j.variants as { variantId: string; available: number }[]) {
          map[v.variantId] = v.available
        }
        setVariantStock(map)
      })
      .catch(() => {
        // Best-effort : sans stock, le bloc reste simplement masqué.
      })
    return () => {
      cancelled = true
    }
  }, [productId, activeStore?.shopifyLocationId, isBundle])

  const storeStock = activeStore ? variantStock?.[selectedVariant.id] : undefined
  const showExactStock = storeStock !== undefined && storeStock > 0 && storeStock <= LOW_STOCK_THRESHOLD

  // Disponibilité en ligne de la variante sélectionnée (achat e-commerce).
  const selectedUnavailable = !selectedVariant?.availableForSale
  // Une autre variante (saveur/format) est-elle dispo ? → on invite à la choisir.
  const hasOtherAvailableVariant = variants.some((v) => v.availableForSale)

  // Eyebrow (sus-titre) : fournisseur du produit. "Packs" pour un bundle.
  // Fallback "BodyStart Nutrition" si le vendor est vide ou generique.
  const vendorClean = (vendor ?? '').trim()
  const isGenericVendor =
    vendorClean === '' || ['bodystart', 'bodystart nutrition'].includes(vendorClean.toLowerCase())
  const eyebrowLabel = isBundle ? 'Packs' : isGenericVendor ? 'BodyStart Nutrition' : vendorClean
  const eyebrowHref = isBundle
    ? '/packs'
    : collectionHandle
      ? `/products?cat=${collectionHandle}`
      : '/products'

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-start">
        {/* ─── Galerie ─── */}
        <div className="lg:sticky lg:top-24">
          {isBundleMode ? (
            <BundleGalleryV2
              components={bundleDetails}
              title={title}
              discountPct={discountPct}
            />
          ) : (
            <ProductGalleryV2
              images={images}
              title={title}
              discountPct={discountPct}
              selectedIndex={selectedImageIndex}
              onImageChange={handleImageChange}
            />
          )}
        </div>

        {/* ─── Panneau achat ─── */}
        <div>
          {/* Fournisseur (vendor) — "Packs" pour un bundle */}
          <Link
            href={eyebrowHref}
            className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3 inline-block hover:text-spruce transition-colors"
          >
            {eyebrowLabel}
          </Link>

          {/* Titre */}
          <h1 className="font-display text-[28px] md:text-[36px] lg:text-[40px] font-extrabold text-spruce leading-[1.1] tracking-tight mb-2">
            {title}
          </h1>

          {/* Format / grammage (metafield Shopify) */}
          {format && (
            <p className="text-[14px] text-ink-mute font-medium mb-5">{format}</p>
          )}
          {!format && <div className="mb-5" />}

          {/* Pastilles benefices (sage + spruce) */}
          {benefits.length > 0 && (
            <ul className="flex flex-wrap gap-2 mb-6">
              {benefits.map((b) => (
                <li
                  key={b}
                  className="inline-flex items-center bg-sage text-spruce text-[12px] font-semibold px-3 py-1.5 rounded-full"
                >
                  {b}
                </li>
              ))}
            </ul>
          )}

          {/* Prix */}
          <div className="flex items-baseline gap-3 mb-7">
            <span className="font-display text-[32px] md:text-[36px] font-extrabold text-spruce leading-none">
              {formatPrice(selectedVariant.price)}
            </span>
            {selectedVariant.compareAtPrice &&
              parseFloat(selectedVariant.compareAtPrice.amount) >
                parseFloat(selectedVariant.price.amount) && (
                <span className="text-[16px] text-ink-mute line-through font-medium">
                  {formatPrice(selectedVariant.compareAtPrice)}
                </span>
              )}
          </div>

          {/* Selecteurs : BundleSelectorsV2 si bundle, sinon saveur/format produit normal */}
          {isBundleMode ? (
            <BundleSelectorsV2
              variants={variants}
              selectedVariant={selectedVariant}
              onVariantChange={(v) => {
                setSelectedVariant(v)
                // Pour un bundle on ne resync pas la galerie (BundleGalleryV2
                // ne depend pas du variant courant), donc on s'arrete la.
              }}
            />
          ) : (
            <>
              {/* Selecteur saveur (produit non-bundle) */}
              {variants.length > 1 && flavors.length > 1 && (
                <div className="mb-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-2.5">
                    Saveur
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {flavors.map((flavor) => {
                      const isAvailable = variants.some(
                        (v) => variantFlavor(v) === flavor && v.availableForSale
                      )
                      return (
                        <button
                          key={flavor}
                          onClick={() => handleOptionChange(flavor, selectedSize)}
                          disabled={!isAvailable}
                          aria-pressed={selectedFlavor === flavor}
                          className={cn(
                            'px-4 py-2 rounded-full border text-[13px] font-semibold transition-colors',
                            selectedFlavor === flavor
                              ? 'border-spruce bg-spruce text-white'
                              : 'border-spruce/20 text-spruce hover:border-spruce/40',
                            !isAvailable && 'opacity-40 cursor-not-allowed line-through'
                          )}
                        >
                          {flavor}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Selecteur format (produit non-bundle) */}
              {variants.length > 1 && defaultSizes.length > 1 && (
                <div className="mb-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-2.5">
                    Format
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {defaultSizes.map((size) => {
                      // Grisé si la combinaison n'EXISTE pas pour la saveur
                      // courante ou n'est pas achetable (matching exact).
                      const isAvailable = variants.some(
                        (v) =>
                          variantFlavor(v) === selectedFlavor &&
                          variantSize(v) === size &&
                          v.availableForSale
                      )
                      return (
                        <button
                          key={size}
                          onClick={() => handleOptionChange(selectedFlavor, size)}
                          disabled={!isAvailable}
                          aria-pressed={selectedSize === size}
                          className={cn(
                            'px-4 py-2 rounded-full border text-[13px] font-semibold transition-colors',
                            selectedSize === size
                              ? 'border-spruce bg-spruce text-white'
                              : 'border-spruce/20 text-spruce hover:border-spruce/40',
                            !isAvailable && 'opacity-40 cursor-not-allowed line-through'
                          )}
                        >
                          {size}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Bandeau épuisé (au-dessus du bouton d'achat) */}
          {selectedUnavailable && (
            <div className="mt-7 rounded-2xl border border-spruce/15 bg-sage/50 px-5 py-4">
              <p className="text-[14px] font-semibold text-spruce">
                Ce produit est momentanément épuisé, il revient bientôt.
              </p>
              {hasOtherAvailableVariant && (
                <p className="text-[13px] text-ink-mute mt-1">
                  Une autre option est disponible — choisis-la ci-dessus.
                </p>
              )}
            </div>
          )}

          {/* Quantite + Ajouter au panier */}
          <div className={cn('flex items-stretch gap-3', selectedUnavailable ? 'mt-4' : 'mt-7')}>
            <div className="inline-flex items-center border border-spruce/20 rounded-full overflow-hidden h-[56px] bg-white">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-11 h-full flex items-center justify-center text-spruce hover:bg-spruce/5 transition-colors"
                aria-label="Réduire la quantité"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-9 text-center font-semibold text-spruce text-[16px]">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(10, quantity + 1))}
                className="w-11 h-full flex items-center justify-center text-spruce hover:bg-spruce/5 transition-colors"
                aria-label="Augmenter la quantité"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={!selectedVariant?.availableForSale || adding}
              aria-label={`Ajouter ${title} au panier`}
              className={cn(
                // Le CTA le plus important du site : ombre teintée + retour
                // physique au clic, comme les CTA du hero.
                'flex h-[56px] flex-1 items-center justify-center gap-2 rounded-full text-[15px] font-semibold text-white transition-all duration-200 ease-out-expo',
                selectedVariant?.availableForSale && !adding
                  ? 'bg-fresh shadow-card hover:bg-fresh-deep hover:shadow-lift active:scale-[0.985]'
                  : 'cursor-not-allowed bg-ink-mute/40'
              )}
            >
              {adding ? (
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
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
              ) : added ? (
                <>
                  <Check className="w-5 h-5" />
                  Ajouté au panier
                </>
              ) : selectedVariant?.availableForSale ? (
                <>
                  <ShoppingCart className="w-5 h-5" />
                  Ajouter au panier
                </>
              ) : (
                'Épuisé'
              )}
            </button>
          </div>

          {/* Reassurance sous le bouton (DA §B.Fiche produit.1) */}
          <ul className="mt-6 space-y-2.5 text-[13px] text-ink">
            <li className="flex items-center gap-2.5">
              <Truck className="w-4 h-4 text-spruce flex-shrink-0" />
              <span>
                Livraison offerte dès <span className="font-semibold">85 €</span>
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <Store className="w-4 h-4 text-spruce flex-shrink-0" />
              <span>
                Click &amp; Collect gratuit à Coignières, souvent prêt en quelques minutes
              </span>
            </li>
            <li className="flex items-center gap-2.5">
              <RotateCcw className="w-4 h-4 text-spruce flex-shrink-0" />
              <span>Retour sous 14 jours</span>
            </li>
            <li className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-spruce flex-shrink-0" />
              <span>Paiement sécurisé (CB, Visa, Mastercard)</span>
            </li>
          </ul>

          {/* Réassurance confiance : le vrai différenciant BodyStart (boutique
              physique depuis 13 ans, « on consomme ce qu'on vend », conseil)
              posé AU POINT DE DÉCISION. Sur un site de compléments, la confiance
              est le 1er frein à l'achat — cet atout était sous-exploité ici. */}
          <div className="mt-5 flex items-start gap-2.5 rounded-2xl bg-sage/50 px-4 py-3">
            <Award className="w-4 h-4 text-fresh flex-shrink-0 mt-0.5" />
            <div className="text-[12.5px] text-spruce leading-[1.5]">
              <p>
                <span className="font-semibold">Une vraie boutique à Coignières depuis 13 ans.</span>{' '}
                On ne vend que ce qu&apos;on consomme — et on te conseille comme au comptoir.
              </p>
              {/* Note Google réelle (source unique GOOGLE_RATING, relevée à la main). */}
              <a
                href={GOOGLE_LISTING_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1.5 font-semibold underline underline-offset-2 hover:text-fresh-deep transition-colors"
              >
                <Star className="w-3.5 h-3.5 text-mustard fill-current" aria-hidden="true" />
                {GOOGLE_RATING.value.toLocaleString('fr-FR')}/5 sur Google · {GOOGLE_RATING.count} avis
              </a>
            </div>
          </div>

          {/* Stock (DA §B.Fiche produit.1 : decision Adam) */}
          {/* Masque pour les bundles : un pack n'a pas d'inventaire propre a
              l'emplacement, son stock boutique depend de ses composants (et de
              la variante selectionnee). On ne montre donc jamais "Indisponible
              en boutique" a tort sur un pack. */}
          {/* L'ESPACE est réservé dès le 1er rendu (min-h + placeholder) : le
              stock arrive par fetch client ~1s après — avant, le bloc
              s'insérait d'un coup et décalait toute la page sous le doigt (CLS). */}
          {!isBundle && productId && activeStore?.shopifyLocationId && (
            <div className="mt-6 pt-5 border-t border-spruce/10 min-h-[42px]">
              {variantStock === null ? (
                <div className="inline-flex items-center gap-2 text-[13px] font-medium text-ink-mute/50">
                  <span className="w-2 h-2 bg-spruce/15 rounded-full" />
                  Disponibilité en boutique…
                </div>
              ) : storeStock === undefined ? null : storeStock === 0 ? (
                <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-terracotta">
                  <span className="w-2 h-2 bg-terracotta rounded-full" />
                  Indisponible en boutique
                </div>
              ) : showExactStock ? (
                <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-terracotta">
                  <span className="w-2 h-2 bg-terracotta rounded-full" />
                  Plus que {storeStock} en stock à Coignières
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 text-[13px] font-semibold text-spruce">
                  <span className="w-2 h-2 bg-fresh rounded-full" />
                  En stock à Coignières
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* A11y : confirmation d'ajout annoncée aux lecteurs d'écran (le
          changement de libellé du bouton n'est pas annoncé de façon fiable). */}
      <span className="sr-only" role="status" aria-live="polite">
        {added ? 'Produit ajouté au panier' : ''}
      </span>

      {/* ─── Sticky buy bar ─── */}
      <div
        ref={stickyBarRef}
        className={cn(
          'fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-spruce/10 py-3 px-4 md:px-6 z-50 transition-transform duration-300 shadow-[0_-4px_20px_rgba(45,90,45,0.06)]',
          isStickyVisible ? 'translate-y-0' : 'translate-y-full'
        )}
      >
        <div className="container flex items-center gap-4">
          <div className="hidden md:flex flex-col min-w-0 flex-1">
            <span className="font-semibold text-ink text-[14px] truncate">{title}</span>
            <span className="text-ink-mute text-[12px]">{selectedVariant.title}</span>
          </div>
          <span className="hidden md:block font-display font-extrabold text-spruce text-[18px]">
            {formatPrice(selectedVariant.price)}
          </span>
          <button
            onClick={handleAddToCart}
            disabled={!selectedVariant?.availableForSale || adding}
            className={cn(
              'w-full md:w-auto h-11 px-7 rounded-full text-white font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors flex-shrink-0',
              selectedVariant?.availableForSale && !adding
                ? 'bg-fresh hover:bg-fresh-deep'
                : 'bg-ink-mute/40 cursor-not-allowed'
            )}
          >
            {adding ? 'Ajout…' : added ? 'Ajouté ✓' : selectedUnavailable ? 'Épuisé' : 'Ajouter au panier'}
          </button>
        </div>
      </div>
    </>
  )
}
