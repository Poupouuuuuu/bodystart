'use client'

import { useState } from 'react'
import { ChevronDown, FlaskConical, Dumbbell, Leaf } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ShopifyMetafield } from '@/lib/shopify/types'
import type { ReactNode } from 'react'

interface NutritionAndScienceProps {
  metafields?: (ShopifyMetafield | null)[]
}

interface NutritionRow {
  label: string
  value: string
  indent?: boolean
}

// ─── Parse HTML brut des valeurs nutritionnelles Shopify ───
// Le metafield contient souvent un <table> HTML avec styles inline pour fond sombre.
// On extrait les paires label/valeur des <tr> via regex côté client.
function parseHtmlTable(html: string): NutritionRow[] {
  const rows: NutritionRow[] = []

  const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let trMatch: RegExpExecArray | null

  while ((trMatch = trRegex.exec(html)) !== null) {
    const trContent = trMatch[1]

    const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi
    const cells: string[] = []
    let cellMatch: RegExpExecArray | null

    while ((cellMatch = cellRegex.exec(trContent)) !== null) {
      const text = cellMatch[1]
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .trim()
      if (text) cells.push(text)
    }

    if (cells.length >= 2) {
      const label = cells[0]
      const value = cells.slice(1).join(' | ')
      const isIndent = /^(\s{2,}|dont |- |— |· )/.test(label) || label.startsWith('dont ')
      rows.push({
        label: label.replace(/^(dont |- |— |· )/, 'dont ').trim(),
        value,
        indent: isIndent,
      })
    } else if (cells.length === 1) {
      rows.push({ label: cells[0], value: '', indent: false })
    }
  }

  return rows
}

// Parse un metafield en lignes nutritionnelles
function parseMetafieldToRows(val: string): NutritionRow[] {
  // 1. HTML table
  if (val.includes('<t') && (val.includes('<table') || val.includes('<tr'))) {
    const parsed = parseHtmlTable(val)
    if (parsed.length > 0) return parsed
  }

  // 2. JSON structuré
  try {
    const parsed = JSON.parse(val)
    if (Array.isArray(parsed)) {
      return parsed.map((item: { label?: string; name?: string; value?: string; amount?: string }) => ({
        label: item.label || item.name || '',
        value: item.value || item.amount || '',
      }))
    }
  } catch {
    // Not JSON
  }

  // 3. Texte ligne par ligne : "Protéines: 24g\nGlucides: 5g"
  const lines = val.split('\n').filter((l: string) => l.trim())
  if (lines.length > 0 && lines.some((l: string) => l.includes(':'))) {
    return lines.map((line: string) => {
      const [label, ...rest] = line.split(':')
      return {
        label: label.trim(),
        value: rest.join(':').trim() || '—',
      }
    })
  }

  return []
}

// ─── Extraction des metafields par clé ───
function findMetafield(metafields: (ShopifyMetafield | null)[] | undefined, ...keys: string[]): string | null {
  if (!metafields) return null
  for (const key of keys) {
    const meta = metafields.find((m) => m && m.namespace === 'custom' && m.key === key)
    if (meta?.value) return meta.value
  }
  return null
}

const FALLBACK_NUTRITION: NutritionRow[] = [
  { label: 'Protéines', value: 'Voir étiquette' },
  { label: 'Glucides', value: 'Voir étiquette' },
  { label: 'Lipides', value: 'Voir étiquette' },
  { label: 'Fibres', value: 'Voir étiquette' },
  { label: 'Sel', value: 'Voir étiquette' },
]

const SCIENCE_CARDS: { icon: ReactNode; title: string; description: string }[] = [
  {
    icon: <FlaskConical className="w-5 h-5 text-brand-600" />,
    title: 'Testé en laboratoire',
    description: 'Chaque lot est analysé en laboratoire indépendant pour garantir pureté et dosages.',
  },
  {
    icon: <Dumbbell className="w-5 h-5 text-brand-600" />,
    title: 'Soutien Musculaire',
    description: 'Formules conçues pour optimiser la récupération musculaire post-entraînement.',
  },
  {
    icon: <Leaf className="w-5 h-5 text-brand-600" />,
    title: 'Ingrédients Naturels',
    description: 'Ingrédients d\'origine naturelle, sans colorants artificiels ni conservateurs controversés.',
  },
]

export default function NutritionAndScience({ metafields }: NutritionAndScienceProps) {
  // UNIQUEMENT custom.valeurs_nutritionnelles (puis fallback nutrition_facts)
  const nutritionVal = findMetafield(metafields, 'valeurs_nutritionnelles', 'nutrition_facts')
  const nutritionRows = nutritionVal ? parseMetafieldToRows(nutritionVal) : []
  const rows = nutritionRows.length > 0 ? nutritionRows : FALLBACK_NUTRITION

  // Composition / ingrédients — metafield séparé
  const compositionVal = findMetafield(metafields, 'composition', 'ingredients')

  return (
    <section className="py-6 md:py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
        {/* Colonne gauche — Nutrition Facts */}
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-[#2c3e2e] mb-6 border-b border-[#2c3e2e]/20 pb-4">
            Valeurs Nutritionnelles
          </h2>
          <NutritionTable rows={rows} />
        </div>

        {/* Colonne droite — Scientifiquement prouvé & Composition */}
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest text-[#2c3e2e] mb-6 border-b border-[#2c3e2e]/20 pb-4">
            Scientifiquement Prouvé
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
            {SCIENCE_CARDS.map(({ icon, title, description }) => (
              <div
                key={title}
                className="flex flex-col items-center text-center gap-4"
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                  {icon}
                </div>
                <div>
                  <h4 className="font-bold text-[#2c3e2e] text-[11px] uppercase tracking-widest mb-2 leading-tight">
                    {title}
                  </h4>
                  <p className="text-[11px] text-[#4a5f4c] font-medium leading-relaxed">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Accordéon Composition (déplacé sous la science) */}
          <div className="mt-8">
            {compositionVal && (
              <CompositionAccordion html={compositionVal} />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Tableau nutritionnel (Stylé clean minimal) ───
function NutritionTable({ rows }: { rows: NutritionRow[] }) {
  return (
    <div className="w-full">
      <div className="divide-y divide-[#2c3e2e]/10">
        {rows.map((row, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center justify-between py-3',
              row.indent && 'pl-4'
            )}
          >
            <span className={cn(
              'text-[13px] tracking-wide',
              row.indent
                ? 'text-[#4a5f4c]'
                : !row.value
                  ? 'font-bold text-[#2c3e2e]'
                  : 'font-semibold text-[#2c3e2e]'
            )}>
              {row.label}
            </span>
            <div className="flex items-center gap-3">
              {row.value && (
                <span className="text-[13px] font-medium text-[#4a5f4c]">
                  {row.value}
                </span>
              )}
              {!row.indent && <ChevronDown className="w-4 h-4 text-[#2c3e2e]/40" />}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Accordéon Composition ───
function CompositionAccordion({ html }: { html: string }) {
  const [isOpen, setIsOpen] = useState(false)

  // Strip les tags HTML pour afficher en texte propre
  const plainText = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()

  if (!plainText) return null

  return (
    <div className="mt-6 border-t border-[#2c3e2e]/20">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 group"
      >
        <span className="text-[13px] font-bold text-[#2c3e2e] tracking-wide group-hover:text-black transition-colors">Composition</span>
        <ChevronDown className={cn(
          "w-4 h-4 text-[#2c3e2e]/40 transition-transform duration-300",
          isOpen && "rotate-180"
        )} />
      </button>
      {isOpen && (
        <div className="pb-6">
          <p className="text-[13px] text-[#4a5f4c] leading-relaxed">
            {plainText}
          </p>
        </div>
      )}
    </div>
  )
}
