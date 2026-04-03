import React from 'react'

const BADGES = [
  { icon: '🏆', label: 'Certifié Qualité' },
  { icon: '🔬', label: 'Formules Scientifiques' },
  { icon: '🚚', label: 'Livraison 48h' },
  { icon: '⭐', label: 'Avis vérifiés' },
  { icon: '🌿', label: 'Ingrédients tracés' },
]

export default function ProofBar() {
  return (
    <div className="bg-white border-y border-cream-300 py-4">
      <div className="container">
        <div className="flex items-center justify-center overflow-x-auto scrollbar-hide gap-6 md:gap-10">
          {BADGES.map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-2 flex-shrink-0">
              <span className="text-sm">{icon}</span>
              <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
