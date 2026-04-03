export default function BlogLoading() {
  return (
    <div>
      {/* Header */}
      <div className="bg-gray-50 border-b-2 border-gray-200 animate-pulse">
        <div className="container py-12">
          <div className="h-4 bg-gray-200 rounded-sm w-20 mb-4" />
          <div className="h-10 bg-gray-200 rounded-sm w-64 mb-3" />
          <div className="h-4 bg-gray-200 rounded-sm w-96" />
        </div>
      </div>

      {/* Articles grid */}
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border-2 border-gray-200 rounded-sm overflow-hidden animate-pulse">
              <div className="aspect-[16/10] bg-gray-100" />
              <div className="p-6 space-y-3">
                <div className="flex gap-2">
                  <div className="h-5 bg-gray-100 rounded-sm w-16" />
                  <div className="h-5 bg-gray-100 rounded-sm w-20" />
                </div>
                <div className="h-5 bg-gray-200 rounded-sm w-3/4" />
                <div className="h-3 bg-gray-100 rounded-sm w-full" />
                <div className="h-3 bg-gray-100 rounded-sm w-2/3" />
                <div className="h-3 bg-gray-100 rounded-sm w-24 mt-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
