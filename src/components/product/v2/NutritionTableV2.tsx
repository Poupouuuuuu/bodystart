/**
 * Section valeurs nutritionnelles V2 — tableau parse.
 * Cf. tech-specs/redesign-v2-direction-artistique.md §B.Fiche produit.4
 *
 * Source : metafield Shopify custom.valeurs_nutritionnelles (multiline).
 * Format attendu : delimite par '|', exemple :
 *
 *   Pour 30g | %AJR | Pour 100g
 *   Energie | 470kJ/110kcal | 1567kJ/367kcal
 *   Proteines | 26g | 87g
 *   dont leucine | 2.8g | 9.3g
 *   Total BCAA : 5.6g par dose
 *
 * Parsing :
 *   - Decoupe par lignes (\n).
 *   - Premiere ligne avec '|' = entete <th> (3 colonnes attendues).
 *   - Lignes suivantes avec '|' = donnees <td>.
 *     Cellule 1 = label (gauche), cellules 2+ = chiffres (droite alignees).
 *   - Ligne dont la 1re cellule commence par "dont" (insensible casse) =
 *     sous-ligne indentee + style label nutritionnel.
 *   - Ligne SANS '|' (apres en-tete) = note sous le tableau (pas dedans).
 *   - Si metafield vide ou sans '|' = placeholder.
 */
import type { ShopifyMetafield } from '@/lib/shopify/types'

interface NutritionTableV2Props {
  metafields?: ShopifyMetafield[] | null
}

interface ParsedTable {
  headers: string[]
  rows: { cells: string[]; isSubRow: boolean }[]
  notes: string[]
}

function extractValeursNutritionnelles(
  metafields?: ShopifyMetafield[] | null
): string | null {
  if (!metafields || metafields.length === 0) return null
  const found = metafields.find((m) => m && m.key === 'valeurs_nutritionnelles')
  const value = found?.value?.trim()
  return value || null
}

function parseTable(content: string): ParsedTable | null {
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0)
  if (lines.length === 0) return null

  let headers: string[] = []
  const rows: { cells: string[]; isSubRow: boolean }[] = []
  const notes: string[] = []
  let headerSeen = false

  for (const line of lines) {
    if (line.includes('|')) {
      const cells = line.split('|').map((c) => c.trim())
      if (!headerSeen) {
        headers = cells
        headerSeen = true
      } else {
        const firstCell = cells[0]?.toLowerCase() ?? ''
        const isSubRow = firstCell.startsWith('dont ') || firstCell === 'dont'
        rows.push({ cells, isSubRow })
      }
    } else {
      // Ligne sans pipe → note
      notes.push(line)
    }
  }

  if (!headerSeen) return null // pas de structure tableau detectee
  return { headers, rows, notes }
}

export default function NutritionTableV2({ metafields }: NutritionTableV2Props) {
  const content = extractValeursNutritionnelles(metafields)
  const table = content ? parseTable(content) : null

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

          {table ? (
            <>
              <div className="bg-canvas border border-spruce/10 rounded-2xl overflow-hidden">
                <table className="w-full text-[14px] md:text-[15px]">
                  <thead>
                    <tr className="bg-spruce/5 border-b border-spruce/15">
                      {table.headers.map((h, i) => (
                        <th
                          key={`${h}-${i}`}
                          className={`px-4 md:px-5 py-3 font-semibold text-spruce ${
                            i === 0 ? 'text-left' : 'text-right'
                          }`}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row, idx) => (
                      <tr
                        key={`row-${idx}`}
                        className={`border-b border-spruce/10 last:border-b-0 ${
                          idx % 2 === 1 ? 'bg-sage/20' : ''
                        }`}
                      >
                        {row.cells.map((cell, i) => (
                          <td
                            key={`cell-${idx}-${i}`}
                            className={`px-4 md:px-5 py-3 ${
                              i === 0
                                ? `text-left ${
                                    row.isSubRow
                                      ? 'pl-8 md:pl-10 text-ink-mute italic'
                                      : 'text-ink font-medium'
                                  }`
                                : `text-right tabular-nums ${
                                    row.isSubRow ? 'text-ink-mute italic' : 'text-ink'
                                  }`
                            }`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Notes (lignes sans |) sous le tableau */}
              {table.notes.length > 0 && (
                <div className="mt-4 space-y-1">
                  {table.notes.map((note, i) => (
                    <p key={`note-${i}`} className="text-[13px] text-ink-mute leading-[1.6]">
                      {note}
                    </p>
                  ))}
                </div>
              )}

              {/* Mention statique unique sous le tableau (DA) */}
              <p className="mt-5 text-[12px] text-ink-mute italic leading-[1.6]">
                Valeurs indicatives pour la portion indiquée, susceptibles de légères variations
                selon la saveur.
              </p>
            </>
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
