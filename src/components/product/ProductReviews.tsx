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
    <div className="bg-white border border-cream-300 rounded-2xl p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-gray-900 text-sm">
              {review.reviewer.name}
            </p>
            {review.verified && (
              <span className="flex items-center gap-1 text-xs font-semibold text-brand-500">
                <CheckCircle className="w-3.5 h-3.5" /> Vérifié
              </span>
            )}
          </div>
          <StarRating rating={review.rating} showCount={false} size="sm" />
        </div>
        <p className="text-xs text-gray-400 flex-shrink-0">
          {formatDate(review.created_at)}
        </p>
      </div>

      {review.title && (
        <p className="font-semibold text-gray-900 text-sm mb-2">
          {review.title}
        </p>
      )}
      {review.body && (
        <p className="text-sm text-gray-600 leading-relaxed">
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
    <section className="mt-16 pt-12 border-t border-cream-300">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-gray-900">
          Avis clients
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="font-display font-bold text-4xl text-brand-500 leading-none">
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
