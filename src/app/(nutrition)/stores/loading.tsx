export default function StoresLoading() {
  return (
    <div>
      {/* Header */}
      <div className="bg-gray-50 border-b-2 border-gray-200 animate-pulse">
        <div className="container py-12">
          <div className="h-4 bg-gray-200 rounded-sm w-24 mb-4" />
          <div className="h-10 bg-gray-200 rounded-sm w-72 mb-3" />
          <div className="h-4 bg-gray-200 rounded-sm w-80" />
        </div>
      </div>

      {/* Store cards */}
      <div className="container py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="border-2 border-gray-200 rounded-sm p-8 animate-pulse shadow-[4px_4px_0_theme(colors.gray.200)]">
              <div className="h-6 bg-gray-200 rounded-sm w-2/3 mb-6" />
              <div className="space-y-3">
                <div className="h-4 bg-gray-100 rounded-sm w-full" />
                <div className="h-4 bg-gray-100 rounded-sm w-3/4" />
                <div className="h-4 bg-gray-100 rounded-sm w-1/2" />
              </div>
              <div className="mt-8 pt-6 border-t-2 border-gray-100">
                <div className="h-4 bg-gray-200 rounded-sm w-32 mb-4" />
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="flex justify-between">
                      <div className="h-3 bg-gray-100 rounded-sm w-24" />
                      <div className="h-3 bg-gray-100 rounded-sm w-20" />
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
