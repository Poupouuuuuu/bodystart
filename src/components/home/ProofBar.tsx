import React from 'react'

const BADGES = [
  { icon: '🏆', label: 'Certifié Qualité' },
  { icon: '🔬', label: 'Formules Scientifiques' },
  { icon: '🚚', label: 'Livraison 48h' },
  { icon: '⭐', label: 'Avis vérifiés Judge.me' },
  { icon: '🌿', label: 'Ingrédients tracés' },
]

export default function ProofBar() {
  return (
    <div className="bg-gray-950 border-y border-gray-900 py-3 shadow-inner">
      <div className="container">
        <div className="flex items-center overflow-x-auto scrollbar-hide">
          {BADGES.map(({ icon, label }, index) => (
            <React.Fragment key={label}>
              <div className="flex items-center gap-2 px-4 py-1 flex-shrink-0">
                <span className="text-sm">{icon}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300 whitespace-nowrap">{label}</span>
              </div>
              {index < BADGES.length - 1 && (
                <div className="w-px h-4 bg-gray-800 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
