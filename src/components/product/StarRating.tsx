import { cn } from '@/lib/utils'

interface StarRatingProps {
  rating: number // 0–5
  count?: number
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
  className?: string
}

export default function StarRating({ rating, count, size = 'md', showCount = true, className }: StarRatingProps) {
  const sizes = { sm: 'w-3 h-3', md: 'w-4 h-4', lg: 'w-5 h-5' }
  const textSizes = { sm: 'text-[10px]', md: 'text-xs', lg: 'text-sm' }

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= Math.floor(rating)
          const partial = !filled && star === Math.ceil(rating) && rating % 1 >= 0.5
          return (
            <svg
              key={star}
              className={cn(sizes[size], filled || partial ? 'text-yellow-400' : 'text-gray-200')}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              {partial ? (
                <>
                  <defs>
                    <linearGradient id={`half-${star}`}>
                      <stop offset="50%" stopColor="currentColor" />
                      <stop offset="50%" stopColor="#e5e7eb" />
                    </linearGradient>
                  </defs>
                  <path
                    fill={`url(#half-${star})`}
                    d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                  />
                </>
              ) : (
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              )}
            </svg>
          )
        })}
      </div>
      {showCount && count !== undefined && count > 0 && (
        <span className={cn(textSizes[size], 'font-black text-gray-500 uppercase tracking-widest')}>
          ({count} avis)
        </span>
      )}
    </div>
  )
}
