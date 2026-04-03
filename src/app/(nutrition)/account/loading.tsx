export default function AccountLoading() {
  return (
    <div className="container py-10">
      <div className="animate-pulse">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-16 h-16 bg-gray-200 rounded-sm border-2 border-gray-200" />
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded-sm w-48" />
            <div className="h-3 bg-gray-100 rounded-sm w-32" />
          </div>
        </div>

        {/* Navigation tabs */}
        <div className="flex gap-2 mb-10 border-b-2 border-gray-100 pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 rounded-sm w-24" />
          ))}
        </div>

        {/* Content cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="border-2 border-gray-200 rounded-sm p-6 space-y-4">
              <div className="h-4 bg-gray-200 rounded-sm w-1/3" />
              <div className="h-3 bg-gray-100 rounded-sm w-full" />
              <div className="h-3 bg-gray-100 rounded-sm w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
