import { MessageCircle, ExternalLink } from 'lucide-react'
import { GOOGLE_REVIEW_URL, GOOGLE_LISTING_URL, GOOGLE_RATING } from '@/lib/store-info'
import StarRating from '@/components/product/StarRating'

/**
 * Section avis V2 — vrais avis seulement (decision Adam 2026-05-23).
 * Cf. tech-specs/site-rewrite-copy-v1.md §3.6
 *      tech-specs/redesign-v2-direction-artistique.md §B.Fiche produit.6
 *
 * 2026-08-05 : la fiche Google a atteint 4,6/5 (58 avis) → on affiche la note
 * RÉELLE de la boutique (source unique GOOGLE_RATING dans store-info.ts,
 * relevée à la main, jamais inventée) avec lien vers la fiche pour TOUT lire.
 * Pas de verbatims copiés : les avis se lisent chez Google, à la source.
 */
export default function ReviewsV2() {
  const note = GOOGLE_RATING.value.toLocaleString('fr-FR')
  return (
    <section className="bg-white">
      <div className="container py-14 md:py-18">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3">
            Avis clients
          </p>
          <h2 className="font-display text-[28px] md:text-[36px] font-extrabold text-spruce leading-[1.1] tracking-tight mb-5">
            Nos clients nous notent {note}/5 sur Google.
          </h2>
          <div className="flex items-center justify-center gap-3 mb-5">
            <StarRating rating={GOOGLE_RATING.value} size="lg" showCount={false} />
            <span className="text-[15px] font-semibold text-spruce">
              {note}/5 · {GOOGLE_RATING.count} avis
            </span>
          </div>
          <p className="text-[15px] text-ink-mute leading-[1.65] mb-7">
            On n&apos;affiche que de vrais avis Google — pas de verbatims inventés. Tu peux
            tous les lire sur notre fiche, et si tu as commandé chez nous, ajouter le tien :
            c&apos;est ce qui aide les suivants à choisir.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={GOOGLE_LISTING_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-fresh text-white font-semibold text-[14px] px-6 py-3 rounded-full hover:bg-fresh-deep transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Lire les {GOOGLE_RATING.count} avis
            </a>
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 border border-spruce/25 text-spruce font-semibold text-[14px] px-6 py-3 rounded-full hover:bg-sage transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Laisser un avis
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
