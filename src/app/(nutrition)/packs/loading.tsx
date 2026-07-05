/** Skeleton /packs — en-tête + grille de cartes aux proportions ProductCardShop. */
export default function PacksLoading() {
  return (
    <div className="min-h-screen bg-canvas animate-pulse">
      <div className="container py-12 md:py-16">
        <div className="h-3 w-24 rounded bg-sage/60 mb-4" />
        <div className="h-10 w-72 max-w-full rounded bg-sage/60 mb-3" />
        <div className="h-4 w-96 max-w-full rounded bg-sage/40 mb-10" />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-white border border-spruce/10">
              <div className="aspect-[4/5] bg-sage/40" />
              <div className="p-5 space-y-3">
                <div className="h-4 w-3/4 rounded bg-sage/50" />
                <div className="h-3 w-1/2 rounded bg-sage/40" />
                <div className="flex items-center justify-between pt-2">
                  <div className="h-6 w-16 rounded bg-sage/50" />
                  <div className="w-11 h-11 rounded-full bg-sage/60" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
