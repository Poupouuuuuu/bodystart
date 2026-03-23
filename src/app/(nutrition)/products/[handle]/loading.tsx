export default function ProductDetailLoading() {
  return (
    <div className="container py-12 animate-pulse">
      <div className="h-4 bg-gray-100 rounded w-32 mb-8" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="aspect-square bg-gray-100 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-3 bg-gray-100 rounded w-24" />
          <div className="h-8 bg-gray-100 rounded w-3/4" />
          <div className="h-8 bg-gray-100 rounded w-1/3" />
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-5/6" />
          <div className="h-14 bg-gray-100 rounded-xl mt-6" />
        </div>
      </div>
    </div>
  )
}
