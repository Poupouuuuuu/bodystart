/**
 * Section valeurs nutritionnelles V2.
 * Cf. tech-specs/redesign-v2-direction-artistique.md §B.Fiche produit.4
 *
 * Source : metafield Shopify custom.valeurs_nutritionnelles (multiline text).
 * Affichage simple en respectant les sauts de ligne (whitespace-pre-line).
 * Fallback : placeholder neutre si metafield absent ou vide.
 */
import type { ShopifyMetafield } from '@/lib/shopify/types'

interface NutritionTableV2Props {
  metafields?: ShopifyMetafield[] | null
}

function extractValeursNutritionnelles(metafields?: ShopifyMetafield[] | null): string | null {
  if (!metafields || metafields.length === 0) return null
  const found = metafields.find((m) => m && m.key === 'valeurs_nutritionnelles')
  const value = found?.value?.trim()
  return value || null
}

export default function NutritionTableV2({ metafields }: NutritionTableV2Props) {
  const content = extractValeursNutritionnelles(metafields)

  return (
    <section className="bg-white">
      <div className="container py-14 md:py-18">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3">
              Valeurs nutritionnelles
            </p>
            <h2 className="font-display text-[28px] md:text-[36px] font-extrabold text-spruce leading-[1.1] tracking-tight">
              Ce qu&apos;il y a dedans
            </h2>
          </div>

          {content ? (
            <div className="bg-canvas border border-spruce/10 rounded-2xl p-7 md:p-9">
              <div className="text-[14px] md:text-[15px] text-ink leading-[1.7] whitespace-pre-line font-mono">
                {content}
              </div>
              <p className="mt-6 pt-5 border-t border-spruce/10 text-[12px] text-ink-mute">
                Valeurs par portion indiquée sur l&apos;étiquette. Les compléments alimentaires
                ne se substituent pas à une alimentation variée et équilibrée.
              </p>
            </div>
          ) : (
            <div className="bg-canvas border border-spruce/10 rounded-2xl p-7 text-[14px] text-ink-mute">
              Les valeurs nutritionnelles détaillées seront ajoutées prochainement. En attendant,
              tu peux nous demander la fiche technique par mail ou en boutique.
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
