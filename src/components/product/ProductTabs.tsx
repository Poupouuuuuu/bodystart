'use client'

import { useState } from 'react'
import { ChevronDown, FlaskConical, BookOpen, Utensils } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductTabsProps {
  descriptionHtml?: string
  tags?: string[]
}

const TABS = [
  { id: 'description', label: 'Description', icon: BookOpen },
  { id: 'nutrition', label: 'Valeurs Nutritionnelles', icon: Utensils },
  { id: 'science', label: 'Backing Scientifique', icon: FlaskConical },
] as const

type TabId = typeof TABS[number]['id']

export default function ProductTabs({ descriptionHtml, tags = [] }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('description')

  return (
    <div className="mt-16">
      {/* Tab headers */}
      <div className="flex border-b border-cream-300 gap-1 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px',
              activeTab === id
                ? 'border-brand-500 text-brand-500'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="py-8">
        {activeTab === 'description' && (
          <div>
            {descriptionHtml ? (
              <div
                className="prose prose-gray max-w-none prose-p:text-gray-600 prose-p:leading-relaxed prose-headings:font-display prose-headings:font-bold prose-headings:text-gray-900 prose-a:text-brand-500 prose-a:no-underline hover:prose-a:underline"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            ) : (
              <p className="text-gray-500 text-sm">Aucune description disponible pour ce produit.</p>
            )}
          </div>
        )}

        {activeTab === 'nutrition' && (
          <div>
            <NutritionAccordion />
          </div>
        )}

        {activeTab === 'science' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ScienceCard
              title="Dosages cliniques"
              description="Chaque ingrédient est dosé selon les recommandations issues d'études cliniques publiées, pour une efficacité prouvée."
            />
            <ScienceCard
              title="Transparence totale"
              description="Formule ouverte sans mélanges propriétaires. Vous savez exactement ce que contient chaque dose."
            />
            <ScienceCard
              title="Fabriqué en France"
              description="Produit dans nos laboratoires certifiés en France, selon les normes les plus strictes de qualité et de sécurité."
            />
            <ScienceCard
              title="Sans additifs inutiles"
              description="Pas de colorants artificiels, pas de conservateurs controversés. Uniquement l'essentiel pour votre performance."
            />
          </div>
        )}
      </div>
    </div>
  )
}

function ScienceCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-brand-50 rounded-2xl p-6 border border-brand-50">
      <div className="flex items-center gap-2 mb-2">
        <FlaskConical className="w-4 h-4 text-brand-500" />
        <h4 className="font-semibold text-gray-900 text-sm">{title}</h4>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}

const NUTRITION_ITEMS = [
  { label: 'Protéines', value: 'Voir étiquette produit' },
  { label: 'Glucides', value: 'Voir étiquette produit' },
  { label: 'Lipides', value: 'Voir étiquette produit' },
  { label: 'Fibres', value: 'Voir étiquette produit' },
  { label: 'Sel', value: 'Voir étiquette produit' },
]

function NutritionAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="space-y-0 border border-cream-300 rounded-2xl overflow-hidden">
      <div className="bg-cream-50 px-5 py-3 border-b border-cream-300">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Valeurs nutritionnelles pour 100g / par dose
        </p>
      </div>
      {NUTRITION_ITEMS.map((item, i) => (
        <button
          key={i}
          onClick={() => setOpenIndex(openIndex === i ? null : i)}
          className="w-full flex items-center justify-between px-5 py-4 text-left border-b border-cream-200 last:border-b-0 hover:bg-cream-50 transition-colors"
        >
          <span className="text-sm font-medium text-gray-700">{item.label}</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{item.value}</span>
            <ChevronDown className={cn(
              'w-4 h-4 text-gray-400 transition-transform duration-200',
              openIndex === i && 'rotate-180'
            )} />
          </div>
        </button>
      ))}
      <div className="bg-cream-50 px-5 py-3 border-t border-cream-300">
        <p className="text-xs text-gray-400">
          Les valeurs nutritionnelles exactes sont indiquées sur l&apos;étiquette de chaque produit. Consultez le packaging pour les informations détaillées.
        </p>
      </div>
    </div>
  )
}
