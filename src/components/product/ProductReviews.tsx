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
    <div className="bg-white border-2 border-gray-200 rounded-sm p-6 shadow-[4px_4px_0_theme(colors.gray.100)]">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="font-black text-gray-900 text-sm uppercase tracking-tight">
              {review.reviewer.name}
            </p>
            {review.verified && (
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-700">
                <CheckCircle className="w-3 h-3" /> Vérifié
              </span>
            )}
          </div>
          <StarRating rating={review.rating} showCount={false} size="sm" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex-shrink-0">
          {formatDate(review.created_at)}
        </p>
      </div>

      {review.title && (
        <p className="font-black text-gray-900 text-sm uppercase tracking-tight mb-2">
          {review.title}
        </p>
      )}
      {review.body && (
        <p className="text-sm text-gray-600 font-medium leading-relaxed">
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
    <section className="mt-16 pt-10 border-t-4 border-gray-900">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h2 className="font-display font-black text-2xl uppercase tracking-tight text-gray-900">
          Avis clients
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="font-display font-black text-4xl text-gray-900 leading-none">
              {rating.toFixed(1)}
            </p>
            <StarRating rating={rating} count={count} size="md" className="mt-1" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {count > 6 && (
        <div className="text-center mt-8">
          <a
            href={`https://judge.me/reviews/${SHOP_DOMAIN}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary inline-flex"
          >
            Voir tous les {count} avis
          </a>
        </div>
      )}
    </section>
  )
}

const SHOP_DOMAIN = 'bodystart-dev-store.myshopify.com'
