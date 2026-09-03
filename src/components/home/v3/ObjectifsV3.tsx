import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

/**
 * Objectifs V3 — liste typographique géante.
 *
 * Plutôt que 4 cartes avec icônes (patron générique), les objectifs sont
 * écrits en Fraunces jusqu'à 64 px, séparés par des filets : une page de
 * sommaire éditorial. Au survol, le libellé glisse et la flèche pivote vers
 * le haut-droite (la « tension » qui fait vivant).
 *
 * Les clés `obj=` sont celles du filtre catalogue (ProductsPageClient.GOALS).
 */
const GOALS = [
  {
    n: '01',
    label: 'Prendre du muscle',
    desc: 'Protéines, créatine, gainers : les bases qui marchent vraiment.',
    href: '/products?obj=muscle',
  },
  {
    n: '02',
    label: 'Avoir de l’énergie',
    desc: 'Pré-workout, boosters, boissons : performer plus longtemps.',
    href: '/products?obj=energie',
  },
  {
    n: '03',
    label: 'Mieux récupérer',
    desc: 'Acides aminés, magnésium, sommeil : encaisser les séances.',
    href: '/products?obj=recuperation',
  },
  {
    n: '04',
    label: 'Prendre soin de soi',
    desc: 'Vitamines, oméga-3, collagène, immunité : le quotidien.',
    href: '/products?obj=sante',
  },
]

export default function ObjectifsV3() {
  return (
    <section className="bg-white">
      <div className="container py-14 md:py-28">
        <div className="mb-10 md:mb-14">
          <span className="inline-flex items-center rounded-full border border-spruce/15 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-ink-mute">
            Par objectif
          </span>
          <h2 className="mt-5 font-display text-[40px] font-extrabold leading-[0.98] tracking-tight text-spruce md:text-[56px]">
            Tu cherches quoi ?
          </h2>
        </div>

        <ul className="divide-y divide-spruce/10 border-y border-spruce/10">
          {GOALS.map((g) => (
            <li key={g.n}>
              <Link
                href={g.href}
                className="group flex items-center gap-5 py-7 md:gap-8 md:py-9"
              >
                <span className="w-8 shrink-0 font-display text-[14px] font-semibold tabular-nums text-ink-mute md:w-12 md:text-[16px]">
                  {g.n}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[30px] font-extrabold leading-[1] tracking-tight text-spruce transition-transform duration-700 ease-out-expo group-hover:translate-x-2 sm:text-[42px] md:text-[54px] lg:text-[64px]">
                    {g.label}
                  </span>
                  <span className="mt-2.5 block max-w-[520px] text-[14px] leading-[1.5] text-ink-mute md:text-[16px]">
                    {g.desc}
                  </span>
                </span>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sage text-spruce transition-all duration-700 ease-out-expo group-hover:-rotate-45 group-hover:bg-spruce group-hover:text-canvas md:h-14 md:w-14">
                  <ArrowRight className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
