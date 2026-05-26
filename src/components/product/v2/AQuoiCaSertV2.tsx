import { FlaskConical, Activity, Leaf } from 'lucide-react'

/**
 * "A quoi ca sert" — 3 cartes claires.
 * Cf. tech-specs/redesign-v2-direction-artistique.md §B.Fiche produit.3
 *      tech-specs/site-rewrite-copy-v1.md §4.2 (labels reecrits)
 */
const POINTS = [
  {
    icon: FlaskConical,
    title: 'Analysé en labo',
    desc: 'Chaque batch passe par un labo indépendant pour vérifier la composition réelle vs ce qui est annoncé.',
  },
  {
    icon: Activity,
    title: 'Effet recherché',
    desc: 'Récupération, soutien immunitaire ou apport protéique : un objectif clair par produit, pas un mélange flou.',
  },
  {
    icon: Leaf,
    title: 'Ingrédients propres',
    desc: 'On lit les étiquettes à ta place. Pas d\'additifs douteux, pas de remplissage, dosages réels.',
  },
] as const

export default function AQuoiCaSertV2() {
  return (
    <section className="bg-canvas">
      <div className="container py-14 md:py-18">
        <div className="max-w-2xl mb-9">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3">
            À quoi ça sert
          </p>
          <h2 className="font-display text-[28px] md:text-[36px] font-extrabold text-spruce leading-[1.1] tracking-tight">
            Ce qu&apos;on vérifie avant de te le vendre
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {POINTS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-white rounded-2xl border border-spruce/10 p-7"
            >
              <span className="flex items-center justify-center w-11 h-11 rounded-full bg-sage mb-5">
                <Icon className="w-5 h-5 text-spruce" strokeWidth={2} />
              </span>
              <h3 className="font-display text-[17px] font-bold text-ink leading-tight mb-2">
                {title}
              </h3>
              <p className="text-[14px] text-ink-mute leading-[1.6]">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
