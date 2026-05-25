import Link from 'next/link'
import { Dumbbell, Zap, HeartPulse, Sprout, ArrowRight } from 'lucide-react'

/**
 * "Trouve ton objectif" — 4 cartes (sport + sante = 50/50).
 * Cf. tech-specs/site-rewrite-copy-v1.md §3.5
 *      tech-specs/redesign-v2-direction-artistique.md §B.Home.4
 *
 * DA : cartes blanches epurees, icone subtile, hover lift discret.
 * Pas de gros visuel : on laisse respirer.
 */
const OBJECTIVES = [
  {
    label: 'Prise de masse & force',
    desc: 'Whey, créatine, gainer',
    icon: Dumbbell,
    href: '/objectifs/prise-de-muscle',
  },
  {
    label: 'Récupération & énergie',
    desc: 'EAA, BCAA, magnésium',
    icon: Zap,
    href: '/objectifs/recuperation',
  },
  {
    label: 'Santé & bien-être',
    desc: 'Oméga 3, vitamine D, collagène, immunité',
    icon: HeartPulse,
    href: '/objectifs/sante',
  },
  {
    label: 'Vegan & protéines végétales',
    desc: 'Pour élargir, sans compromis',
    icon: Sprout,
    href: '/objectifs/vegan',
  },
] as const

export default function ShopByObjectiveV2() {
  return (
    <section className="bg-white">
      <div className="container py-14 md:py-18">
        <div className="max-w-2xl mb-9">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3">
            Trouve ton objectif
          </p>
          <h2 className="font-display text-[32px] md:text-[42px] font-extrabold text-spruce leading-[1.05] tracking-tight">
            Trouve ce qui correspond à ton objectif
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {OBJECTIVES.map(({ label, desc, icon: Icon, href }) => (
            <Link
              key={href}
              href={href}
              className="group bg-canvas rounded-2xl border border-spruce/10 p-7 transition-all hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(45,90,45,0.08)] hover:border-spruce/20"
            >
              <span className="flex items-center justify-center w-12 h-12 rounded-full bg-sage mb-5 transition-colors group-hover:bg-fresh group-hover:text-white">
                <Icon className="w-5 h-5 text-spruce transition-colors group-hover:text-white" strokeWidth={2} />
              </span>
              <h3 className="font-display font-bold text-[17px] text-ink leading-tight mb-2">
                {label}
              </h3>
              <p className="text-[14px] text-ink-mute leading-snug mb-6">
                {desc}
              </p>
              <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-spruce">
                Voir la sélection
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
