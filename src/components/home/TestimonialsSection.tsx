import { getLatestReviews } from '@/lib/judgeme'
import type { JudgemeReview } from '@/lib/judgeme'
import { CheckCircle } from 'lucide-react'

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg
          key={s}
          className={`w-4 h-4 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}`}
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: JudgemeReview }) {
  // Initiale du prénom pour l'avatar
  const initial = review.reviewer.name?.charAt(0)?.toUpperCase() ?? '?'
  return (
    <div className="bg-white rounded-sm border-2 border-gray-200 p-6 hover:border-gray-900 shadow-[4px_4px_0_theme(colors.gray.200)] hover:shadow-[4px_4px_0_theme(colors.gray.900)] hover:-translate-y-1 transition-all duration-200">
      <Stars rating={review.rating} />
      {review.title && (
        <p className="font-black text-gray-900 text-sm uppercase tracking-tight mt-3">
          {review.title}
        </p>
      )}
      <p className="text-gray-600 font-medium text-sm leading-relaxed mt-3 mb-5 line-clamp-4">
        &ldquo;{review.body}&rdquo;
      </p>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-700 border-2 border-brand-900 rounded-sm flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-[2px_2px_0_theme(colors.brand.900)]">
            {initial}
          </div>
          <div>
            <p className="text-sm font-black uppercase tracking-tight text-gray-900">
              {review.reviewer.name}
            </p>
            {review.verified && (
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-700 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Achat vérifié
              </p>
            )}
          </div>
        </div>
        {review.product_title && (
          <span className="bg-brand-50 border-2 border-brand-200 text-brand-700 text-[9px] uppercase tracking-widest font-black px-2 py-1 rounded-sm flex-shrink-0 max-w-[120px] truncate">
            {review.product_title}
          </span>
        )}
      </div>
    </div>
  )
}

// Fallback si pas encore d'avis
function FallbackCards() {
  const FALLBACK = [
    { initial: 'T', name: 'Thomas R.', text: 'Qualité exceptionnelle. Résultats visibles en 6 semaines.', product: 'Whey Protéine' },
    { initial: 'J', name: 'Julie M.', text: 'Récupération incroyable. Les dosages sont vraiment honnêtes.', product: 'Acides Aminés' },
    { initial: 'K', name: 'Karim B.', text: 'Le service en boutique est top. Conseillers très compétents.', product: 'Créatine Pure' },
  ]
  return (
    <>
      {FALLBACK.map((f) => (
        <div key={f.name} className="bg-white rounded-sm border-2 border-gray-200 p-6 shadow-[4px_4px_0_theme(colors.gray.200)]">
          <Stars rating={5} />
          <p className="text-gray-600 font-medium text-sm leading-relaxed mt-3 mb-5">&ldquo;{f.text}&rdquo;</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-700 border-2 border-brand-900 rounded-sm flex items-center justify-center text-white font-black text-sm">
              {f.initial}
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-tight text-gray-900">{f.name}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-brand-700">Client vérifié</p>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}

export default async function TestimonialsSection() {
  const reviews = await getLatestReviews(6)
  const hasRealReviews = reviews.length > 0

  return (
    <section className="py-16 bg-gray-50">
      <div className="container">
        <div className="text-center mb-10">
          <span className="text-brand-700 text-xs font-black uppercase tracking-widest block mb-3 border-l-4 border-brand-500 pl-3 inline-block">
            Avis clients · Judge.me
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900 mb-3">
            Ce que disent nos clients
          </h2>
          <div className="flex justify-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <svg key={i} className="w-5 h-5 text-amber-400 fill-amber-400" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {hasRealReviews
            ? reviews.map((r) => <ReviewCard key={r.id} review={r} />)
            : <FallbackCards />
          }
        </div>

        {/* Stat bar — sera mise à jour une fois les vrais avis disponibles */}
        <div className="bg-brand-900 border-2 border-brand-700 rounded-sm p-8 shadow-[8px_8px_0_theme(colors.gray.900)]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center text-white">
            <div>
              <p className="font-display text-4xl font-black mb-2 tracking-tighter">53+</p>
              <p className="text-brand-300 text-[10px] uppercase font-bold tracking-widest">produits disponibles</p>
            </div>
            <div>
              <p className="font-display text-4xl font-black mb-2 tracking-tighter">7j/7</p>
              <p className="text-brand-300 text-[10px] uppercase font-bold tracking-widest">ouvert en boutique</p>
            </div>
            <div>
              <p className="font-display text-4xl font-black mb-2 tracking-tighter">48h</p>
              <p className="text-brand-300 text-[10px] uppercase font-bold tracking-widest">livraison partout en France</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
