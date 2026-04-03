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
    <section className="pt-8 md:pt-16 pb-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">
        {/* Colonne gauche — Valeurs nutritionnelles */}
        <div>
          <h2 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tighter text-gray-900 mb-8 border-b-2 border-gray-900 pb-4">
            Valeurs Nutritionnelles
          </h2>

          <NutritionTable rows={rows} />

          {/* Accordéon Composition (séparé) */}
          {compositionVal && (
            <CompositionAccordion html={compositionVal} />
          )}
        </div>

        {/* Colonne droite — Scientifiquement prouvé */}
        <div>
          <h2 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tighter text-gray-900 mb-8 border-b-2 border-gray-900 pb-4">
            Scientifiquement Prouvé
          </h2>

          <div className="space-y-8 mt-12">
            {SCIENCE_CARDS.map(({ icon, title, description }) => (
              <div
                key={title}
                className="flex flex-col items-start gap-3 mt-4"
              >
                <div className="w-14 h-14 bg-white/50 border border-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  {icon}
                </div>
                <div>
                  <h4 className="font-display font-black text-gray-900 text-lg uppercase tracking-tight mb-2">
                    {title}
                  </h4>
                  <p className="text-sm text-gray-700 font-medium leading-relaxed max-w-sm">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Tableau nutritionnel (Stylé Accordéon Fake) ───
function NutritionTable({ rows }: { rows: NutritionRow[] }) {
  return (
    <div className="w-full">
      <div className="divide-y divide-gray-300">
        {rows.map((row, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center justify-between py-4 cursor-pointer hover:bg-black/5 transition-colors',
              row.indent && 'pl-8'
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-gray-400 font-light text-lg">+</span>
              <span className={cn(
                'text-sm uppercase tracking-widest',
                row.indent
                  ? 'text-gray-600'
                  : !row.value
                    ? 'font-black text-gray-900'
                    : 'font-bold text-gray-900'
              )}>
                {row.label}
              </span>
            </div>
            {row.value && (
              <span className="text-sm font-bold text-gray-700">
                {row.value}
              </span>
            )}
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
    <div className="mt-8 border-t border-gray-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 hover:bg-black/5 transition-colors"
      >
        <div className="flex items-center gap-3">
           <span className="text-gray-400 font-light text-lg">{isOpen ? '-' : '+'}</span>
           <span className="text-sm font-black uppercase tracking-widest text-gray-900">Composition</span>
        </div>
      </button>
      {isOpen && (
        <div className="pb-6 pt-2 pl-6">
          <p className="text-sm text-gray-700 font-medium leading-relaxed">
            {plainText}
          </p>
        </div>
      )}
    </div>
  )
}
