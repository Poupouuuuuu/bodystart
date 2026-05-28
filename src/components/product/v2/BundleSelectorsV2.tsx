'use client'

import { ChevronDown } from 'lucide-react'
import { useMemo } from 'react'
import type { ShopifyProductVariant } from '@/lib/shopify/types'

interface BundleSelectorsV2Props {
  variants: ShopifyProductVariant[]
  selectedVariant: ShopifyProductVariant
  onVariantChange: (variant: ShopifyProductVariant) => void
}

interface ComponentAxis {
  productTitle: string
  productHandle: string
  /** Grammage / contenance lu sur le metafield custom.format du produit composant. */
  format: string | null
  /**
   * Valeurs uniques de productVariant.title observees a cet indice de
   * composant a travers tous les bundle variants. C'est la liste de choix
   * pour ce composant.
   */
  options: string[]
}

const DEFAULT_VARIANT_TITLE = 'Default Title'

/**
 * Selecteurs de variante pour bundle Shopify (Shopify Bundles app).
 *
 * Cf. tech-specs/redesign-v2-direction-artistique.md §B.Fiche pack.2
 *
 * Principe : un bundle Shopify Variant agrege les selections de chaque
 * composant. Pour un pack avec 3 composants A/B/C, chaque bundle variant
 * a `components.nodes = [{productVariant: A_choice}, {productVariant:
 * B_choice}, {productVariant: C_choice}]`. Le nombre total de bundle
 * variants = produit cartesien des choix par composant.
 *
 * On reconstruit donc, pour chaque INDICE de composant (0..N-1) :
 *   - le nom du produit (= label du selecteur)
 *   - le grammage (lu sur metafield custom.format du produit composant)
 *   - la liste des `productVariant.title` uniques observes a cet indice
 *
 * Rendu UI (decision Adam) :
 *   - 1 option seulement → "Nom — inclus" (texte gris, pas de selecteur)
 *   - 2+ options → TOUJOURS dropdown <select> DA V2 (border spruce/15,
 *     focus ring vert frais), meme avec 2-3 options. Coherence visuelle
 *     dans la fiche bundle ou des composants ont 10 saveurs et d'autres 3.
 *
 * Lorsqu'on change une option d'un composant, on cherche le bundle variant
 * qui satisfait la nouvelle combinaison complete et on remonte au parent.
 * Si la combinaison n'est pas disponible (selling availability), on prend
 * le bundle variant le plus proche (premier match partiel + disponible).
 */
export default function BundleSelectorsV2({
  variants,
  selectedVariant,
  onVariantChange,
}: BundleSelectorsV2Props) {
  // Construire les axes a partir de variants[0].components.
  const axes: ComponentAxis[] = useMemo(() => {
    const v0 = variants[0]
    const comps0 = v0?.components?.nodes ?? []
    if (comps0.length === 0) return []

    return comps0.map((c0, k) => {
      const optionsSet = new Map<string, true>()
      for (const v of variants) {
        const compK = v.components?.nodes?.[k]
        const title = compK?.productVariant?.title
        if (title) optionsSet.set(title, true)
      }
      const format = (() => {
        const metafields = c0.productVariant.product.metafields ?? []
        const found = metafields.find((m) => m && m.key === 'format')
        return found?.value?.trim() || null
      })()
      return {
        productTitle: c0.productVariant.product.title,
        productHandle: c0.productVariant.product.handle,
        format,
        options: Array.from(optionsSet.keys()),
      }
    })
  }, [variants])

  // Selection actuelle par axe (lue depuis selectedVariant.components)
  const currentSelection: string[] = useMemo(() => {
    const comps = selectedVariant.components?.nodes ?? []
    return comps.map((c) => c.productVariant?.title ?? '')
  }, [selectedVariant])

  /**
   * Quand l'utilisateur change un axe : on construit la nouvelle selection,
   * on cherche le variant qui matche EXACTEMENT, ou un match partiel
   * disponible si l'exacte n'existe pas / est en rupture.
   */
  const handleAxisChange = (axisIndex: number, newValue: string) => {
    const nextSelection = [...currentSelection]
    nextSelection[axisIndex] = newValue

    // Match exact d'abord
    let next = variants.find((v) => {
      const comps = v.components?.nodes ?? []
      return comps.every((c, k) => (c.productVariant?.title ?? '') === nextSelection[k])
    })

    if (!next) {
      // Match partiel : impose l'axe modifie, accepte n'importe quoi sur les autres,
      // privilegie disponible
      const candidates = variants.filter((v) => {
        const compK = v.components?.nodes?.[axisIndex]
        return (compK?.productVariant?.title ?? '') === newValue
      })
      next = candidates.find((v) => v.availableForSale) ?? candidates[0]
    }

    if (next) onVariantChange(next)
  }

  if (axes.length === 0) return null

  return (
    <div className="space-y-5 mb-2">
      {axes.map((axis, k) => {
        const isLocked = axis.options.length === 1
        const lockedValue = axis.options[0]
        const isDefaultOnly = isLocked && lockedValue === DEFAULT_VARIANT_TITLE

        // Label : "ISO ZERO 100% WHEY — 1,5 kg" si format renseigne, sinon
        // juste le nom. Pas de tiret orphelin si format vide.
        const label = axis.format
          ? `${axis.productTitle} — ${axis.format}`
          : axis.productTitle

        return (
          <div key={`axis-${k}`}>
            {/* Label = nom du produit composant + format eventuel */}
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-2.5">
              {label}
            </p>

            {isLocked ? (
              // Composant a 1 seule option : ligne discrete "inclus(e)"
              <p className="text-[13px] text-ink-mute">
                {isDefaultOnly
                  ? 'Inclus dans le pack'
                  : `${lockedValue} · Inclus dans le pack`}
              </p>
            ) : (
              // 2+ options : TOUJOURS dropdown <select> DA V2
              <div className="relative inline-block w-full sm:max-w-[360px]">
                <select
                  value={currentSelection[k] ?? ''}
                  onChange={(e) => handleAxisChange(k, e.target.value)}
                  className="appearance-none w-full bg-white border border-spruce/15 rounded-full pl-4 pr-11 py-2.5 text-[13px] font-semibold text-spruce hover:border-spruce/30 transition-colors cursor-pointer focus:outline-none focus:border-fresh focus:ring-1 focus:ring-fresh/30"
                >
                  {axis.options.map((opt) => {
                    const isAvailable = variants.some(
                      (v) =>
                        (v.components?.nodes?.[k]?.productVariant?.title ?? '') === opt &&
                        v.availableForSale
                    )
                    return (
                      <option key={opt} value={opt} disabled={!isAvailable}>
                        {opt}
                        {!isAvailable ? ' (épuisé)' : ''}
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
