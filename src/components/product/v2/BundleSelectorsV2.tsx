'use client'

import { ChevronDown } from 'lucide-react'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { ShopifyProductVariant } from '@/lib/shopify/types'

interface BundleSelectorsV2Props {
  variants: ShopifyProductVariant[]
  selectedVariant: ShopifyProductVariant
  onVariantChange: (variant: ShopifyProductVariant) => void
}

interface ComponentAxis {
  productTitle: string
  productHandle: string
  // Valeurs uniques de productVariant.title vu sur cette position de composant
  // a travers tous les bundle variants. C'est la liste de choix pour ce composant.
  options: string[]
}

const PILLS_MAX_OPTIONS = 5
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
 *   - la liste des `productVariant.title` uniques observes a cet indice
 *     a travers tous les bundle variants (= options du selecteur)
 *
 * Rendu UI :
 *   - 1 option seulement → "Nom du produit — inclus" (texte gris, pas de selecteur)
 *   - 2..5 options → pills (coherent avec le selecteur non-bundle)
 *   - >=6 options → <select> deroulant style DA V2 (pour ne pas charger l'ecran)
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
  // Construire les axes a partir de variants[0].components (titre produit)
  // + balayage de tous les variants (collecte des options uniques).
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
      return {
        productTitle: c0.productVariant.product.title,
        productHandle: c0.productVariant.product.handle,
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
        const isPills = axis.options.length <= PILLS_MAX_OPTIONS
        const lockedValue = axis.options[0]
        const isDefaultOnly = isLocked && lockedValue === DEFAULT_VARIANT_TITLE

        return (
          <div key={`axis-${k}`}>
            {/* Label = nom du produit composant */}
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-2.5">
              {axis.productTitle}
            </p>

            {isLocked ? (
              // Composant a 1 seule option : ligne discrete "inclus(e)"
              <p className="text-[13px] text-ink-mute">
                {isDefaultOnly
                  ? 'Inclus dans le pack'
                  : `${lockedValue} · Inclus dans le pack`}
              </p>
            ) : isPills ? (
              // 2..5 options : pills
              <div className="flex flex-wrap gap-2">
                {axis.options.map((opt) => {
                  const isSelected = currentSelection[k] === opt
                  // Disponibilite : existe-t-il un variant ou ce composant=opt et availableForSale ?
                  const isAvailable = variants.some(
                    (v) =>
                      (v.components?.nodes?.[k]?.productVariant?.title ?? '') === opt &&
                      v.availableForSale
                  )
                  return (
                    <button
                      key={opt}
                      onClick={() => handleAxisChange(k, opt)}
                      disabled={!isAvailable}
                      className={cn(
                        'px-4 py-2 rounded-full border text-[13px] font-semibold transition-colors',
                        isSelected
                          ? 'border-spruce bg-spruce text-white'
                          : 'border-spruce/20 text-spruce hover:border-spruce/40',
                        !isAvailable && 'opacity-40 cursor-not-allowed line-through'
                      )}
                    >
                      {opt}
                    </button>
                  )
                })}
              </div>
            ) : (
              // >=6 options : select deroulant
              <div className="relative inline-block w-full sm:w-auto sm:min-w-[280px]">
                <select
                  value={currentSelection[k] ?? ''}
                  onChange={(e) => handleAxisChange(k, e.target.value)}
                  className="appearance-none w-full bg-white border border-spruce/20 rounded-full pl-4 pr-11 py-2.5 text-[13px] font-semibold text-spruce hover:border-spruce/40 transition-colors cursor-pointer focus:outline-none focus:border-spruce"
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
