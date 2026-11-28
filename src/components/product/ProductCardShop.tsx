'use client'

/**
 * Carte produit V2 — LA carte unique du site (DA claire).
 *
 * Extraite de ProductsPageClient (sprint 2 « cohérence DA », 2026-07-04) pour
 * remplacer les 3 designs qui coexistaient. Un produit = une seule tête,
 * quelle que soit la page (catalogue, pages /products/page/N, catégories,
 * collections, recherche, accueil).
 *
 * Refonte « site qui vend » (nuit du 28/11/2026) :
 *   - image plus grande ; nom, format et nombre de parfums (lib/carte-produit,
 *     calculés côté serveur), prix (lib/product-price) ;
 *   - pastilles vraies seulement, 2 au plus : remise réelle (prix barré
 *     Shopify supérieur au prix), « Plus que X » (une seule variante, stock
 *     réel déjà lu), « Nouveau », Best-seller, Santé ;
 *   - ajout rapide, bouton à part (aucun lien imbriqué) : une variante →
 *     ajout direct (le tiroir panier s'ouvre) ; plusieurs → feuille de choix
 *     chargée au premier appui (next/dynamic) ; pack ou coffret à plusieurs
 *     variantes → la fiche, seule à savoir composer un pack ; épuisé → la
 *     fiche (alerte de retour).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Image from '@/components/ui/Image'
import { Check, Plus } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import type { ShopifyProduct } from '@/lib/shopify/types'
import { productSubtitle } from '@/lib/product-subtitle'
import { cardPriceOf } from '@/lib/product-price'
import { altImage, altProduit } from '@/lib/alt-produit'
import { ligneDetailsCarte, stockBasCarte } from '@/lib/carte-produit'
import { chargerProduitAjout } from '@/components/product/ajout-rapide/donnees'

// Chargée au premier appui sur « Choisir » : rien dans le JS initial.
const FeuilleAjoutRapide = dynamic(() => import('@/components/product/ajout-rapide/FeuilleAjoutRapide'), {
  ssr: false,
})

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

/** Pack ou coffret (variante à composants) : composé sur sa fiche, jamais dans la feuille. */
function estCompose(p: ShopifyProduct): boolean {
  if ((p.productType ?? '').trim().toLowerCase() === 'pack') return true
  if ((p.tags ?? []).some((t) => ['pack', 'coffret-noel'].includes(t.toLowerCase()))) return true
  return p.variants.nodes.some((v) => v.requiresComponents)
}

export interface ProductCardShopProps {
  product: ShopifyProduct
  /** Stock boutique (badge « Plus que X ») : /products et /products/page/N. */
  stockAtStore?: number
  /** Recherche « whey vanille » : la fiche s'ouvre sur cette variante (?variant=). */
  varianteId?: string | null
  /** Parfum ou format trouvé, affiché à la place du sous-titre. */
  parfum?: string | null
  /**
   * Première rangée d'une grille en haut de page (/products, recherche) :
   * l'image du produit est l'élément LCP sur mobile depuis qu'elle est plus
   * grande, elle part donc en priorité (priority + fetchPriority high).
   */
  prioritaire?: boolean
  /**
   * Pastille d'offre passée par la page (« Offerte dès 100 € », accueil),
   * prioritaire sur les autres. Sans elle, celle calculée côté serveur pour
   * /products et les catégories (product.carte.offre, lib/offres-cartes).
   */
  pastilleOffre?: string
}

type EtatAjout = 'repos' | 'ajout' | 'ajoute'

export function ProductCardShop({
  product,
  stockAtStore,
  varianteId,
  parfum,
  prioritaire = false,
  pastilleOffre,
}: ProductCardShopProps) {
  const href = `/products/${product.handle}${varianteId ? `?variant=${varianteId}` : ''}`
  const variantes = product.variants.nodes
  const variant = variantes[0]
  // Épuisé : aucune variante vendable, ou toutes à 0 en précommande
  // (carte.epuise) : jamais d'ajout rapide, la fiche (alerte de retour).
  const soldOut = product.availableForSale === false || !!product.carte?.epuise
  const { addItem } = useCart()
  const [etat, setEtat] = useState<EtatAjout>('repos')
  const [feuille, setFeuille] = useState(false)
  const bouton = useRef<HTMLButtonElement>(null)
  // variants(first: 2) : deux nœuds = plusieurs parfums ou formats.
  const plusieurs = variantes.length > 1
  // Pack à plusieurs variantes : la fiche (formules, composants) ; un pack à
  // une seule variante s'ajoute comme sur sa fiche.
  const versLaFiche = soldOut || (plusieurs && estCompose(product)) || (!plusieurs && !variant?.availableForSale)

  // Vrai libellé de catégorie (collection, sinon productType, sinon rien).
  const categoryLabel = product.collections?.nodes?.[0]?.title ?? product.productType ?? null

  // Sous-titre : libellé propre tiré d'une liste blanche d'étiquettes, jamais
  // la catégorie en double ni une étiquette brute (lib/product-subtitle).
  const subtitle = productSubtitle(product.tags, {
    category: categoryLabel,
    title: product.title,
    productType: product.productType,
  })
  const details = parfum || ligneDetailsCarte(product.carte)

  // Badge « Santé » seulement si la catégorie affichée ne le dit pas déjà.
  const isSante =
    isSanteProduct(product) &&
    (categoryLabel ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase() !== 'sante'
  const isBest = isBestSeller(product)
  const stockBas = stockBasCarte(variantes, stockAtStore)

  // Prix de la variante en stock la moins chère, « dès » si les prix varient,
  // remise seulement sur CETTE variante (lib/product-price).
  const prix = cardPriceOf(product)
  const discountPct = prix?.discountPct ?? null

  // Offre calculée côté serveur : retirée à la fin de la période, même si la
  // page (ISR) a été rendue avant (effet, jamais au rendu : pas d'écart
  // d'hydratation).
  const offreFin = pastilleOffre ? undefined : product.carte?.offreFin
  const [offreFinie, setOffreFinie] = useState(false)
  useEffect(() => {
    if (!offreFin) return
    const reste = Date.parse(offreFin) - Date.now()
    if (Number.isNaN(reste)) return
    if (reste <= 0) {
      setOffreFinie(true)
      return
    }
    if (reste > 24 * 60 * 60 * 1000) return
    const t = setTimeout(() => setOffreFinie(true), reste)
    return () => clearTimeout(t)
  }, [offreFin])
  const offre = pastilleOffre?.trim() || (offreFinie ? null : product.carte?.offre ?? null)

  // Par ordre d'utilité commerciale, PLAFONNÉS À 2 (règle du design system).
  // `!!discountPct` : la remise peut valoir 0 (arrondi) et 0 est falsy.
  const badges = [
    // Offre (cadeau d'un palier) en premier, couleur d'accent du thème.
    ...(offre ? [{ label: offre, className: 'badge-saison bg-mustard text-mustard-ink' }] : []),
    ...(discountPct ? [{ label: `-${discountPct}\u00a0%`, className: 'bg-terracotta text-white' }] : []),
    ...(stockBas ? [{ label: `Plus que ${stockBas}`, className: 'bg-terracotta/90 text-white' }] : []),
    ...(product.carte?.nouveau ? [{ label: 'Nouveau', className: 'bg-spruce text-white' }] : []),
    // badge-saison : couleur d'accent pendant une période du mode saison (lib/saison)
    ...(isBest ? [{ label: 'Best-seller', className: 'badge-saison bg-mustard text-mustard-ink' }] : []),
    ...(isSante ? [{ label: 'Santé', className: 'bg-sage/95 text-spruce' }] : []),
  ].slice(0, 2)

  // Retour visuel « Ajouté » quelques secondes après un ajout réussi.
  useEffect(() => {
    if (etat !== 'ajoute') return
    const t = setTimeout(() => setEtat('repos'), 2200)
    return () => clearTimeout(t)
  }, [etat])

  const ajouter = useCallback(
    async (variantId: string) => {
      setEtat('ajout')
      const ok = await addItem(variantId)
      setEtat(ok ? 'ajoute' : 'repos')
    },
    [addItem]
  )

  // Les variantes se lisent dès que le doigt (ou la souris) appuie, avant le
  // clic : la feuille s'ouvre souvent déjà remplie. Pas au survol, pour ne pas
  // lancer une requête par carte survolée. Une seule requête par produit et par visite.
  const precharger = () => {
    if (plusieurs && !versLaFiche) chargerProduitAjout(product.handle).catch(() => {})
  }

  function auClic() {
    if (etat === 'ajout') return
    if (plusieurs) {
      precharger()
      setFeuille(true)
      return
    }
    if (variant) void ajouter(variant.id)
  }

  const fermerFeuille = useCallback(() => {
    setFeuille(false)
    bouton.current?.focus()
  }, [])

  // La feuille se ferme avant l'ajout : le tiroir panier qui s'ouvre ensuite
  // garde seul la page figée (pas deux verrous de défilement imbriqués).
  const ajouterDepuisFeuille = useCallback(
    (variantId: string) => {
      setFeuille(false)
      bouton.current?.focus()
      void ajouter(variantId)
    },
    [ajouter]
  )

  const libelle =
    etat === 'ajout' ? 'Ajout…' : etat === 'ajoute' ? 'Ajouté' : plusieurs ? 'Choisir' : 'Ajouter'

  return (
    // PREMIUM V2 (2026-08) : pas de bordure, l'ombre teintée verte détache la
    // carte du fond crème. Rayon 20px, plus généreux que les éléments internes.
    <div className="carte-produit group flex flex-col overflow-hidden rounded-[20px] bg-white shadow-card transition-all duration-300 ease-out-expo hover:-translate-y-1.5 hover:shadow-lift">
      {/* Zone image avec fond végétal */}
      <Link
        href={href}
        className="relative block w-full aspect-[4/5] overflow-hidden bg-cover bg-bottom bg-no-repeat"
        style={{ backgroundImage: "url('/bg-vegetal-800.webp')" }}
      >
        <div className="absolute inset-0 flex items-end justify-center pb-2">
          {product.featuredImage ? (
            <Image
              src={product.featuredImage.url}
              alt={altImage(product.featuredImage, altProduit(product))}
              width={200}
              height={200}
              priority={prioritaire}
              fetchPriority={prioritaire ? 'high' : undefined}
              // h-[84%] (70 % avant le 28/11/2026) : le produit est la star de
              // la carte. Ombre portée TEINTÉE verte, jamais noire.
              className={cn(
                'relative z-10 h-[84%] w-auto max-w-[90%] object-contain transition-transform duration-500 ease-out-expo group-hover:scale-[1.05]',
                '[filter:drop-shadow(0_16px_20px_rgba(45,90,45,0.26))]',
                soldOut && 'opacity-60 saturate-[0.55]'
              )}
            />
          ) : (
            <div className="relative z-10 w-16 h-16 bg-white/40 rounded-full flex items-center justify-center mb-8">
              <span className="font-display font-bold text-lg text-white/70">BS</span>
            </div>
          )}
        </div>

        {/* Fondu blanc en bas (raccord avec la carte) */}
        <div className="absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-t from-white to-transparent z-0" />

        {/* Pastilles : 2 au plus, coins doux (rounded-lg). */}
        {/* right borné : une pastille longue (« Offerte dès 100 € ») passe à la ligne au lieu d'être rognée. */}
        <div className="absolute left-2.5 right-2.5 top-2.5 z-30 flex flex-col items-start gap-1.5 sm:left-3 sm:right-3 sm:top-3">
          {soldOut ? (
            <span className="inline-flex items-center rounded-lg bg-ink/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-white backdrop-blur-sm">
              Épuisé
            </span>
          ) : (
            badges.map((b) => (
              <span
                key={b.label}
                className={cn(
                  'inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold uppercase leading-tight tracking-[0.06em] backdrop-blur-sm',
                  b.className
                )}
              >
                {b.label}
              </span>
            ))
          )}
        </div>
      </Link>

      {/* Contenu. p-3.5 sous sm : à 360 px la carte fait 154 px de large. */}
      <div className="flex flex-1 flex-col p-3.5 sm:p-5">
        {(subtitle || categoryLabel) && (
          <span className="mb-1 line-clamp-1 text-[12px] font-medium text-ink-mute">{subtitle || categoryLabel}</span>
        )}

        {/* Nom en Fraunces, 2 lignes réservées pour aligner les prix d'une rangée. */}
        <Link href={href} className="rounded-sm">
          <h3 className="line-clamp-2 min-h-[2.5rem] font-display text-[15px] font-bold leading-[1.25] text-spruce transition-colors hover:text-fresh-deep sm:min-h-[2.6rem] sm:text-[16px]">
            {product.title}
          </h3>
        </Link>

        {/* Format et parfums (« 1 kg · 6 parfums ») ; parfum trouvé par la recherche à la place. */}
        <p className="mt-1 min-h-[1.25rem] line-clamp-1 text-[13px] leading-snug text-ink-mute">{details}</p>

        <div className="mt-auto pt-2.5">
          {/* Prix : « dès », prix, prix barré réel ; passe à la ligne sur carte étroite. */}
          <div className="mb-2.5 flex min-w-0 flex-wrap items-baseline gap-x-1.5">
            {prix?.from && <span className="text-[13px] font-medium text-ink-mute">dès</span>}
            <span className="whitespace-nowrap font-display text-[19px] font-extrabold tracking-tight text-spruce">
              {formatPrice(prix?.price ?? product.priceRange.minVariantPrice)}
            </span>
            {prix?.compareAt && (
              <span className="whitespace-nowrap text-[12px] text-ink-mute line-through">{formatPrice(prix.compareAt)}</span>
            )}
          </div>

          {versLaFiche ? (
            <Link
              href={href}
              aria-label={
                soldOut || !variant?.availableForSale
                  ? `${product.title} épuisé : voir la fiche pour être prévenu du retour`
                  : `Composer ${product.title} sur sa fiche`
              }
              className="press inline-flex h-11 w-full items-center justify-center rounded-full border border-spruce/20 text-[14px] font-semibold text-spruce transition-colors hover:border-spruce/50 hover:bg-spruce/5"
            >
              {soldOut || !variant?.availableForSale ? 'M’alerter' : 'Composer'}
            </Link>
          ) : (
            <button
              ref={bouton}
              type="button"
              onClick={auClic}
              onPointerDown={precharger}
              onFocus={precharger}
              aria-busy={etat === 'ajout'}
              aria-haspopup={plusieurs ? 'dialog' : undefined}
              aria-label={
                plusieurs ? `Choisir le parfum et le format de ${product.title}` : `Ajouter ${product.title} au panier`
              }
              className={cn(
                'press inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full text-[14px] font-semibold text-white shadow-soft transition-colors',
                etat === 'ajoute' ? 'bg-spruce' : 'bg-fresh hover:bg-fresh-deep'
              )}
            >
              {etat === 'ajout' ? (
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : etat === 'ajoute' ? (
                <Check className="h-4 w-4" aria-hidden="true" />
              ) : (
                !plusieurs && <Plus className="h-4 w-4" aria-hidden="true" />
              )}
              <span aria-live="polite">{libelle}</span>
            </button>
          )}
        </div>
      </div>

      {feuille && (
        <FeuilleAjoutRapide
          handle={product.handle}
          titre={product.title}
          href={href}
          image={product.featuredImage}
          varianteInitiale={varianteId}
          onFermer={fermerFeuille}
          onAjouter={ajouterDepuisFeuille}
        />
      )}
    </div>
  )
}
