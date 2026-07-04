// Skeleton V2 de l'espace client — reproduit la structure exacte de page.tsx
// (bandeau blanc profil + grid lg:grid-cols-[280px_1fr] + cartes bg-white
// rounded-2xl border-spruce/10) pour éviter tout saut de layout au chargement.
export default function AccountLoading() {
  return (
    <div className="bg-canvas min-h-screen animate-pulse">
      {/* ─── Bandeau profil (blanc, avatar rond) ─── */}
      <div className="bg-white border-b border-spruce/10">
        <div className="container py-8 md:py-10 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-sage flex-shrink-0" />
            <div className="space-y-2.5">
              <div className="h-6 md:h-7 w-48 rounded-full bg-spruce/10" />
              <div className="h-4 w-56 rounded-full bg-spruce/5" />
            </div>
          </div>
          <div className="h-10 w-36 rounded-full bg-spruce/10" />
        </div>
      </div>

      <div className="container py-10 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* ─── Colonne gauche : nav (280px) ─── */}
          <div>
            <div className="rounded-2xl overflow-hidden bg-white border border-spruce/10">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between px-5 py-4 border-b last:border-0 border-spruce/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded bg-spruce/10" />
                    <div className="h-4 w-28 rounded-full bg-spruce/10" />
                  </div>
                  <div className="w-4 h-4 rounded bg-spruce/5" />
                </div>
              ))}
            </div>
          </div>

          {/* ─── Colonne droite : panneau (aperçu commandes) ─── */}
          <div>
            <div className="rounded-2xl overflow-hidden bg-white border border-spruce/10">
              <div className="flex items-center justify-between px-8 py-6 border-b border-spruce/10">
                <div className="h-6 w-52 rounded-full bg-spruce/10" />
                <div className="h-4 w-16 rounded-full bg-spruce/5" />
              </div>
              <div className="divide-y divide-spruce/10">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="p-6 md:p-8">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="h-4 w-36 rounded-full bg-spruce/10" />
                        <div className="h-3 w-24 rounded-full bg-spruce/5" />
                      </div>
                      <div className="flex gap-2">
                        <div className="h-6 w-16 rounded-full bg-sage" />
                        <div className="h-6 w-20 rounded-full bg-sage" />
                      </div>
                    </div>
                    <div className="flex gap-3 mb-6">
                      {Array.from({ length: 3 }).map((_, j) => (
                        <div
                          key={j}
                          className="w-14 h-14 rounded-xl bg-canvas border border-spruce/10 flex-shrink-0"
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="h-7 w-24 rounded-full bg-spruce/10" />
                      <div className="h-10 w-28 rounded-full bg-sage" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
