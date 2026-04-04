export default function AccountLoading() {
  return (
    <div className="bg-[#f4f6f1] min-h-screen">
      <div className="container py-12 md:py-16">
        <div className="animate-pulse">
          {/* Header */}
          <div className="flex items-center gap-4 mb-10">
            <div className="w-14 h-14 bg-[#1a2e23]/10 rounded-2xl" />
            <div className="space-y-2">
              <div className="h-6 bg-[#1a2e23]/10 rounded-full w-48" />
              <div className="h-3 bg-[#1a2e23]/5 rounded-full w-32" />
            </div>
          </div>

          {/* Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-6 space-y-4">
                <div className="h-5 bg-[#1a2e23]/10 rounded-full w-2/3" />
                <div className="h-4 bg-[#1a2e23]/5 rounded-full w-full" />
                <div className="h-4 bg-[#1a2e23]/5 rounded-full w-3/4" />
              </div>
              <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-6 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-[#1a2e23]/5 rounded-2xl w-full" />
                ))}
              </div>
            </div>
            {/* Main */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-[24px] border border-[#1a2e23]/5 p-8 space-y-6">
                <div className="h-6 bg-[#1a2e23]/10 rounded-full w-1/3" />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-3 border-t border-[#1a2e23]/5 pt-6">
                    <div className="h-4 bg-[#1a2e23]/10 rounded-full w-1/3" />
                    <div className="h-3 bg-[#1a2e23]/5 rounded-full w-full" />
                    <div className="h-3 bg-[#1a2e23]/5 rounded-full w-2/3" />
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
