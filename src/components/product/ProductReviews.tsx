import { getProductReviews } from '@/lib/judgeme'
import type { JudgemeReview } from '@/lib/judgeme'
import StarRating from './StarRating'
import { CheckCircle } from 'lucide-react'

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function ReviewCard({ review }: { review: JudgemeReview }) {
  return (
    <div className="bg-white border border-[#1a2e23]/5 rounded-[20px] p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="font-display font-bold text-[#1a2e23] text-sm">
              {review.reviewer.name}
            </p>
            {review.verified && (
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-[#4a5f4c]">
                <CheckCircle className="w-3.5 h-3.5" /> Vérifié
              </span>
            )}
          </div>
          <StarRating rating={review.rating} showCount={false} size="sm" />
        </div>
        <p className="text-[11px] text-[#89a890] font-medium flex-shrink-0">
          {formatDate(review.created_at)}
        </p>
      </div>

      {review.title && (
        <p className="font-display font-bold text-[#1a2e23] text-sm mb-2">
          {review.title}
        </p>
      )}
      {review.body && (
        <p className="text-[13px] text-[#4a5f4c] font-medium leading-relaxed">
          {review.body}
        </p>
      )}
    </div>
  )
}

export default async function ProductReviews({ handle }: { handle: string }) {
  const { reviews, rating, count } = await getProductReviews(handle, 6)

  if (count === 0) return null

  return (
    <div className="bg-[#f4f6f1] py-20 border-t border-[#1a2e23]/5">
      <div className="container">
        <div className="flex items-center justify-between mb-10 flex-wrap gap-4">
          <h2 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tighter text-[#1a2e23]">
            Avis clients
          </h2>
          <div className="flex items-center gap-3">
            <p className="font-display font-black text-4xl text-[#1a2e23] leading-none">
              {rating.toFixed(1)}
            </p>
            <div>
              <StarRating rating={rating} showCount={false} size="md" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-[#89a890] mt-0.5">
                {count} avis
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      </div>
    </div>
  )
}
