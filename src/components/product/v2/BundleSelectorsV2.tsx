'use client'

import { ChevronDown } from 'lucide-react'
import { useMemo } from 'react'
import {
  getCompleteBundleVariants,
  buildBundleAxes,
  variantOptionValue,
  isBundleOptionAvailable,
  resolveBundleVariantOnChange,
} from '@/lib/shopify/bundle'
import type { ShopifyProductVariant } from '@/lib/shopify/types'

interface BundleSelectorsV2Props {
  variants: ShopifyProductVariant[]
  selectedVariant: ShopifyProductVariant
  onVariantChange: (variant: ShopifyProductVariant) => void
}

// Types d'option qui désignent un poids/contenance : on n'ajoute pas le
// grammage en suffixe pour ces axes (il est déjà choisi explicitement).
const WEIGHT_RE = /poids|poid|weight|taille|grammage|contenance/i
const TITLE_OPTION = 'Title'

/** Parse "Sub Zero Whey Isolate (Poids)" → { productTitle, optionType }. */
function parseOptionName(name: string): { productTitle: string; optionType: string } | null {
  const m = name.match(/^(.*) \(([^)]+)\)$/)
  if (!m) return null
  return { productTitle: m[1].trim(), optionType: m[2].trim() }
}

/**
 * Sélecteurs de variante pour bundle Shopify (Shopify Bundles app).
 * Cf. tech-specs/redesign-v2-direction-artistique.md §B.Fiche pack.2
 *
 * Renderer mince : toute la logique (variantes complètes, axes, dépendance
 * entre options, résolution de variante) vit dans lib/shopify/bundle.ts
 * et est couverte par bundle.test.ts.
 *
 * Comportement clé :
 * - Axes = options nommées du bundle ("{Produit} ({Type})"), pas l'ordre
 *   des composants → robuste aux composants manquants.
 * - Dépendance : une valeur grisée si aucune variante COMPLÈTE ne l'offre
 *   avec les autres sélections en cours (ex : Sub Zero 810g ⇒ seules les
 *   saveurs existant en 810g sont proposées).
 * - Le changement remonte une variante complète au parent → le prix
 *   affiché (lié à selectedVariant dans BuyBoxV2) se met à jour.
 * - Tous les sélecteurs sont des <select> DA V2 (cohérence visuelle).
 */
export default function BundleSelectorsV2({
  variants,
  selectedVariant,
  onVariantChange,
}: BundleSelectorsV2Props) {
  const completeVariants = useMemo(() => getCompleteBundleVariants(variants), [variants])
  const axes = useMemo(() => buildBundleAxes(completeVariants), [completeVariants])

  // Map produit → custom.format (grammage) pour suffixer les labels.
  const formatByProduct = useMemo(() => {
    const map = new Map<string, string>()
    for (const v of variants) {
      for (const c of v.components?.nodes ?? []) {
        const prod = c.productVariant?.product
        if (!prod) continue
        const mf = (prod.metafields ?? []).find((m) => m && m.key === 'format')
        const val = mf?.value?.trim()
        if (val && !map.has(prod.title)) map.set(prod.title, val)
      }
    }
    return map
  }, [variants])

  // Produits ayant un axe de poids dédié → pas de suffixe grammage sur leurs
  // autres axes (le poids est déjà un sélecteur).
  const productsWithWeightAxis = useMemo(() => {
    const s = new Set<string>()
    for (const a of axes) {
      const p = parseOptionName(a.name)
      if (p && WEIGHT_RE.test(p.optionType)) s.add(p.productTitle)
    }
    return s
  }, [axes])

  const currentSelection = useMemo(() => {
    const m: Record<string, string> = {}
    for (const o of selectedVariant.selectedOptions ?? []) m[o.name] = o.value
    return m
  }, [selectedVariant])

  const handleChange = (name: string, value: string) => {
    const next = resolveBundleVariantOnChange(completeVariants, axes, currentSelection, name, value)
    if (next) onVariantChange(next)
  }

  // On masque l'axe "Title/Default Title" (bundle mono-variante) : pas de
  // sélecteur réel à afficher.
  const realAxes = axes.filter((a) => !(a.name === TITLE_OPTION && a.values.length === 1))
  if (realAxes.length === 0) return null

  return (
    <div className="space-y-5 mb-2">
      {realAxes.map((axis) => {
        const parsed = parseOptionName(axis.name)
        const productTitle = parsed?.productTitle
        const format = productTitle ? formatByProduct.get(productTitle) : undefined
        const showFormat = !!format && !!productTitle && !productsWithWeightAxis.has(productTitle)
        const label = showFormat ? `${axis.name} — ${format}` : axis.name
        const isLocked = axis.values.length === 1

        return (
          <div key={axis.name}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-2.5">
              {label}
            </p>

            {isLocked ? (
              <p className="text-[13px] text-ink-mute">{axis.values[0]} · Inclus dans le pack</p>
            ) : (
              <div className="relative inline-block w-full sm:max-w-[360px]">
                <select
                  value={currentSelection[axis.name] ?? ''}
                  onChange={(e) => handleChange(axis.name, e.target.value)}
                  className="appearance-none w-full bg-white border border-spruce/15 rounded-full pl-4 pr-11 py-2.5 text-[13px] font-semibold text-spruce hover:border-spruce/30 transition-colors cursor-pointer focus:outline-none focus:border-fresh focus:ring-1 focus:ring-fresh/30"
                >
                  {axis.values.map((val) => {
                    const avail = isBundleOptionAvailable(
                      completeVariants,
                      axes,
                      currentSelection,
                      axis.name,
                      val
                    )
                    return (
                      <option key={val} value={val} disabled={!avail}>
                        {val}
                        {!avail ? ' (indisponible)' : ''}
                      </option>
                    )
                  })}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-spruce/60" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
