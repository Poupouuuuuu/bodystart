import Link from 'next/link'
import { Gift, ArrowRight } from 'lucide-react'

/**
 * Bande parrainage — exploite la fidelite live (L4).
 * Cf. tech-specs/redesign-v2-direction-artistique.md §B.Home.6
 *
 * DA : section claire, accent vert (icone + bouton) mais surface canvas dominante.
 * Pas de bandeau pleine largeur vert.
 */
export default function BandeauParrainageV2() {
  return (
    <section className="bg-white">
      <div className="container py-12 md:py-14">
        <div className="bg-canvas rounded-3xl border border-spruce/10 p-7 md:p-10 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
            <div className="flex items-start gap-5">
              <span className="flex-shrink-0 w-14 h-14 rounded-full bg-sage flex items-center justify-center">
                <Gift className="w-6 h-6 text-spruce" strokeWidth={2} />
              </span>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-2">
                  Programme parrainage
                </p>
                <h2 className="font-display text-[24px] md:text-[32px] font-extrabold text-spruce leading-tight tracking-tight mb-2">
                  Ton pote a 5 €, tu gagnes 5 % pendant 1 an.
                </h2>
                <p className="text-ink-mute text-[15px] leading-relaxed max-w-[600px]">
                  Tu partages ton code, ton pote a 5 € sur sa première commande dès 40 €,
                  et on te crédite 5 % de ses achats pendant 12 mois. Aucune carte, aucune appli.
                </p>
              </div>
            </div>

            <Link
              href="/parrainage"
              className="inline-flex items-center justify-center gap-2 bg-fresh text-white font-semibold text-[15px] px-7 py-3.5 rounded-full transition-colors hover:bg-fresh-deep flex-shrink-0"
            >
              Voir comment ça marche
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
