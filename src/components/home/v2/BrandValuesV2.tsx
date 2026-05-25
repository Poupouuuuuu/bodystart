import { Users, Leaf, Beaker, Scale } from 'lucide-react'

/**
 * Bandeau reassurance — 4 puces statiques alignees (vs marquee scrolling).
 * Cf. tech-specs/site-rewrite-copy-v1.md §3.2
 *      tech-specs/redesign-v2-direction-artistique.md §B.Home.2
 *
 * DA : surfaces claires dominantes, pas de bandeau pleine largeur vert fonce.
 */
const VALUES = [
  { icon: Users, label: 'Conseil d\'humain' },
  { icon: Leaf, label: 'Ingrédients tracés' },
  { icon: Beaker, label: 'On teste tout en boutique' },
  { icon: Scale, label: 'Bien dosé, pas survendu' },
]

export default function BrandValuesV2() {
  return (
    <section className="bg-white border-y border-spruce/10">
      <div className="container py-6 md:py-7">
        <ul className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
          {VALUES.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-3 justify-center lg:justify-start">
              <span className="flex-shrink-0 w-10 h-10 rounded-full bg-sage flex items-center justify-center">
                <Icon className="w-4 h-4 text-spruce" strokeWidth={2.2} />
              </span>
              <span className="text-[14px] font-semibold text-ink leading-tight">
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
