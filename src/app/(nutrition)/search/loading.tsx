export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="container py-12">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-spruce/10 overflow-hidden animate-pulse"
            >
              <div className="aspect-[4/5] bg-sage/40" />
              <div className="p-5 space-y-3">
                <div className="h-3 bg-sage/60 rounded w-1/3" />
                <div className="h-4 bg-sage/60 rounded w-3/4" />
                <div className="flex items-center justify-between pt-2">
                  <div className="h-4 bg-sage/60 rounded w-1/3" />
                  <div className="w-11 h-11 bg-sage/60 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
