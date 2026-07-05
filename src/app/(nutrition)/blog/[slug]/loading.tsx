/** Skeleton article de blog — fil d'ariane + titre + méta + corps. */
export default function ArticleLoading() {
  return (
    <div className="min-h-screen bg-canvas animate-pulse">
      <div className="container py-12 md:py-16 max-w-3xl">
        <div className="h-3 w-48 rounded bg-sage/50 mb-8" />
        <div className="h-10 w-full rounded bg-sage/60 mb-3" />
        <div className="h-10 w-2/3 rounded bg-sage/60 mb-5" />
        <div className="h-4 w-40 rounded bg-sage/40 mb-10" />

        <div className="aspect-[16/9] rounded-2xl bg-sage/40 mb-10" />

        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`h-4 rounded bg-sage/40 ${i % 4 === 3 ? 'w-2/3' : 'w-full'}`} />
          ))}
        </div>
      </div>
    </div>
  )
}
