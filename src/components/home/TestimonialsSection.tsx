import { getLatestReviews } from '@/lib/judgeme'
import type { JudgemeReview } from '@/lib/judgeme'
import { Star, Quote, BadgeCheck } from 'lucide-react'

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`${cls} ${s <= rating ? 'text-[#ffc107] fill-[#ffc107]' : 'text-gray-200 fill-gray-200'}`}
        />
      ))}
    </div>
  )
}

function ReviewCard({ name, text, product, rating }: {
  name: string
  text: string
  product: string
  rating: number
}) {
  const initial = name.charAt(0).toUpperCase()
  return (
    <div className="relative bg-white rounded-2xl border border-cream-300 p-6 md:p-8 flex flex-col shadow-sm hover:shadow-md transition-shadow duration-300">
      {/* Guillemets décoratifs */}
      <Quote className="w-8 h-8 text-brand-500/20 mb-4 rotate-180" strokeWidth={1.5} />

      {/* Étoiles */}
      <div className="mb-4">
        <Stars rating={rating} />
      </div>

      {/* Texte */}
      <p className="text-gray-700 text-sm leading-relaxed mb-6 flex-1">
        &ldquo;{text}&rdquo;
      </p>

      {/* Produit acheté */}
      <p className="text-xs text-brand-500 font-semibold mb-5">
        A acheté : {product}
      </p>

      {/* Auteur */}
      <div className="flex items-center gap-3 pt-5 border-t border-cream-200">
        <div className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900">{name}</p>
          <div className="flex items-center gap-1 text-brand-500">
            <BadgeCheck className="w-3.5 h-3.5" />
            <span className="text-[11px] font-semibold">Client vérifié</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const FALLBACK_REVIEWS = [
  {
    name: 'Thomas R.',
    text: 'Je suis client en boutique depuis l\'ouverture. La qualité des produits est vraiment au-dessus de ce que je trouvais avant. Le conseil en magasin fait toute la différence, on sent que l\'équipe connaît ses produits.',
    product: 'Iso Zero 100% Whey',
    rating: 5,
  },
  {
    name: 'Julie M.',
    text: 'J\'ai commencé la musculation il y a 6 mois et l\'équipe m\'a orientée vers les bons compléments pour débuter. Résultat : une bien meilleure récupération et plus d\'énergie au quotidien. Merci Body Start !',
    product: 'Clear Pro Creatine',
    rating: 5,
  },
  {
    name: 'Karim B.',
    text: 'Enfin une boutique qui sélectionne des marques sérieuses avec des dosages honnêtes. J\'ai testé pas mal de shops en ligne, ici la transparence sur les compositions est irréprochable. Je recommande les yeux fermés.',
    product: 'HIT EAA',
    rating: 5,
  },
]

export default async function TestimonialsSection() {
  const reviews = await getLatestReviews(6)
  const hasRealReviews = reviews.length > 0

  return (
    <section className="bg-cream-100 py-16 lg:py-24">
      <div className="container">
        {/* Header avec score global */}
        <div className="text-center mb-14">
          <h2 className="font-display text-2xl md:text-3xl lg:text-[40px] font-black uppercase text-gray-900 tracking-tight mb-4">
            CE QUE DISENT NOS CLIENTS
          </h2>

          <div className="flex items-center justify-center gap-3 mb-2">
            <Stars rating={5} size="lg" />
            <span className="font-display font-black text-2xl text-gray-900">4.9/5</span>
          </div>
          <p className="text-gray-500 text-sm">
            Basé sur les avis de nos clients en boutique
          </p>
        </div>

        {/* Grille de témoignages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {hasRealReviews
            ? reviews.slice(0, 3).map((r) => (
                <ReviewCard
                  key={r.id}
                  name={r.reviewer.name}
                  text={r.body}
                  product="Complément Body Start"
                  rating={r.rating}
                />
              ))
            : FALLBACK_REVIEWS.map((f, i) => (
                <ReviewCard key={i} {...f} />
              ))
          }
        </div>
      </div>
    </section>
  )
}
