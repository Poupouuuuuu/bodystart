/**
 * Squelette /stores — PREMIUM V2. L'ancien squelette gardait le style V1
 * (gris neutres, bordures 2px, ombres dures) : pendant 1 s la page changeait
 * d'identité avant de charger. Ici : mêmes surfaces (crème, cartes blanches
 * à ombre teintée, rayon 20px) que la page finale, barres vert très pâle.
 */
export default function StoresLoading() {
  return (
    <div className="bg-canvas animate-pulse" aria-busy="true" aria-label="Chargement des boutiques">
      {/* En-tête */}
      <div className="border-b border-spruce/10">
        <div className="container py-12">
          <div className="mb-4 h-3 w-24 rounded bg-spruce/10" />
          <div className="mb-3 h-10 w-72 rounded-lg bg-spruce/10" />
          <div className="h-4 w-80 rounded bg-spruce/[0.06]" />
        </div>
      </div>

      {/* Cartes boutique */}
      <div className="container py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="rounded-[20px] bg-white p-8 shadow-card">
              <div className="mb-6 h-6 w-2/3 rounded-lg bg-spruce/10" />
              <div className="space-y-3">
                <div className="h-4 w-full rounded bg-spruce/[0.06]" />
                <div className="h-4 w-3/4 rounded bg-spruce/[0.06]" />
                <div className="h-4 w-1/2 rounded bg-spruce/[0.06]" />
              </div>
              <div className="mt-8 border-t border-spruce/10 pt-6">
                <div className="mb-4 h-4 w-32 rounded bg-spruce/10" />
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex justify-between">
                      <div className="h-3 w-24 rounded bg-spruce/[0.06]" />
                      <div className="h-3 w-20 rounded bg-spruce/[0.06]" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
