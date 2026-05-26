/**
 * Tableau valeurs nutritionnelles V2.
 * Cf. tech-specs/redesign-v2-direction-artistique.md §B.Fiche produit.4
 *
 * Source : metafields Shopify (parsed dans une string JSON ou format flat).
 * Si pas de metafield disponible, on affiche un placeholder neutre.
 */
import type { ShopifyMetafield } from '@/lib/shopify/types'

interface NutritionTableV2Props {
  metafields?: ShopifyMetafield[] | null
}

interface NutritionRow {
  label: string
  value: string
  unit?: string
}

function parseNutritionRows(metafields?: ShopifyMetafield[] | null): NutritionRow[] {
  if (!metafields || metafields.length === 0) return []
  // Cherche un metafield "nutrition_facts" (JSON [{label, value, unit}]) ou un format clef:valeur
  const facts = metafields.find((m) => m?.key === 'nutrition_facts' || m?.key === 'nutrition')
  if (!facts?.value) return []
  try {
    const parsed = JSON.parse(facts.value)
    if (Array.isArray(parsed)) {
      return parsed
        .filter((r) => r && typeof r === 'object' && 'label' in r && 'value' in r)
        .map((r) => ({ label: String(r.label), value: String(r.value), unit: r.unit ? String(r.unit) : undefined }))
    }
  } catch {
    // Format texte multilignes "label: value unit"
    return facts.value
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && line.includes(':'))
      .map((line) => {
        const [label, rest] = line.split(':', 2)
        const match = rest?.trim().match(/^([0-9.,]+)\s*(.*)$/)
        return {
          label: label.trim(),
          value: match?.[1] ?? rest?.trim() ?? '',
          unit: match?.[2]?.trim() || undefined,
        }
      })
  }
  return []
}

export default function NutritionTableV2({ metafields }: NutritionTableV2Props) {
  const rows = parseNutritionRows(metafields)

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

          {rows.length > 0 ? (
            <div className="bg-canvas border border-spruce/10 rounded-2xl overflow-hidden">
              <table className="w-full">
                <tbody>
                  {rows.map((row, idx) => (
                    <tr
                      key={`${row.label}-${idx}`}
                      className="border-b border-spruce/10 last:border-b-0"
                    >
                      <td className="py-3.5 px-5 md:px-7 text-[14px] text-ink-mute">
                        {row.label}
                      </td>
                      <td className="py-3.5 px-5 md:px-7 text-[14px] text-ink font-semibold text-right">
                        {row.value}
                        {row.unit && <span className="text-ink-mute font-normal ml-1">{row.unit}</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-5 md:px-7 py-3 text-[12px] text-ink-mute border-t border-spruce/10 bg-sage/30">
                Valeurs par portion indiquee sur l&apos;etiquette. Les compléments alimentaires
                ne se substituent pas a une alimentation variee et equilibree.
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
