export default function ProductsLoading() {
  return (
    <div>
      <div className="bg-brand-50 border-b border-brand-100 animate-pulse">
        <div className="container py-10">
          <div className="h-4 bg-brand-200/50 rounded w-24 mb-3" />
          <div className="h-8 bg-brand-200/50 rounded w-48 mb-2" />
          <div className="h-4 bg-brand-200/50 rounded w-64" />
        </div>
      </div>
      <div className="container py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="aspect-square bg-gray-100" />
              <div className="p-4 space-y-3">
                <div className="h-3 bg-gray-100 rounded w-1/3" />
                <div className="h-4 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-10 bg-gray-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
