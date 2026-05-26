import { MessageCircle } from 'lucide-react'

/**
 * Section avis V2 — vrais avis seulement (decision Adam 2026-05-23).
 * Cf. tech-specs/site-rewrite-copy-v1.md §3.6
 *      tech-specs/redesign-v2-direction-artistique.md §B.Fiche produit.6
 *
 * Tant qu'on n'a pas de vrais avis Google connectes, on affiche un placeholder
 * propre qui dit la verite (et invite a en laisser un). Pas de faux verbatims.
 */
export default function ReviewsV2() {
  return (
    <section className="bg-white">
      <div className="container py-14 md:py-18">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3">
            Avis clients
          </p>
          <h2 className="font-display text-[28px] md:text-[36px] font-extrabold text-spruce leading-[1.1] tracking-tight mb-4">
            On n&apos;invente pas d&apos;avis.
          </h2>
          <p className="text-[15px] text-ink-mute leading-[1.65] mb-7">
            On affiche ici uniquement de vrais avis Google. Tant qu&apos;on n&apos;en a pas assez,
            on préfère ne rien afficher plutôt que de mettre des verbatims génériques. Si tu as
            commandé chez nous, laisse-nous ton avis honnête, c&apos;est ce qui aide les
            suivants à choisir.
          </p>
          <a
            href="https://g.page/r/bodystart-coignieres/review"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 bg-fresh text-white font-semibold text-[14px] px-6 py-3 rounded-full hover:bg-fresh-deep transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Laisser un avis Google
          </a>
        </div>
      </div>
    </section>
  )
}
