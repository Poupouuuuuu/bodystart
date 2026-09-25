import { Fragment } from 'react'
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
 *
 * Maillage SEO (25/09/2026) : les rayons cités dans chaque description sont
 * des liens vers leur page /categories, avec le mot exact comme ancre
 * (« créatine », « Protéines »…). Search Console montrait l'accueil au lieu du
 * rayon sur la requête « créatine ». La ligne entière reste cliquable vers le
 * filtre objectif via un lien « étiré » (son ::after couvre la ligne) ; les
 * liens de rayon passent au-dessus (relative z-10). Pas de liens imbriqués.
 */
type Part = string | { label: string; href: string }

const GOALS: { n: string; label: string; desc: Part[]; href: string }[] = [
  {
    n: '01',
    label: 'Prendre du muscle',
    desc: [
      { label: 'Protéines', href: '/categories/proteines' },
      ', ',
      { label: 'créatine', href: '/categories/creatine' },
      ', ',
      { label: 'barres protéinées', href: '/categories/barres-proteinees' },
      ', gainers : les bases qu’on conseille au comptoir.',
    ],
    href: '/products?obj=muscle',
  },
  {
    n: '02',
    label: 'Avoir de l’énergie',
    desc: [
      { label: 'Pré-workout', href: '/categories/pre-workout' },
      ', ',
      { label: 'boosters', href: '/categories/boosters' },
      ', boissons : performer plus longtemps.',
    ],
    href: '/products?obj=energie',
  },
  {
    n: '03',
    label: 'Mieux récupérer',
    desc: [
      { label: 'Acides aminés', href: '/categories/acides-amines' },
      ', magnésium, sommeil : encaisser les séances.',
    ],
    href: '/products?obj=recuperation',
  },
  {
    n: '04',
    label: 'Prendre soin de soi',
    desc: [
      { label: 'Vitamines', href: '/categories/sante' },
      ', oméga-3, collagène, immunité : le quotidien.',
    ],
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
            <li key={g.n} className="group relative flex items-center gap-5 py-6 md:gap-8 md:py-9">
              <span className="w-8 shrink-0 font-display text-[14px] font-semibold tabular-nums text-ink-mute md:w-12 md:text-[16px]">
                {g.n}
              </span>
              <div className="min-w-0 flex-1">
                {/* 44 px mini : le libellé fait 30 px sur mobile, la zone réelle est la ligne entière. */}
                <Link
                  href={g.href}
                  className="flex min-h-[44px] items-center after:absolute after:inset-0 after:content-['']"
                >
                  <span className="block font-display text-[30px] font-extrabold leading-[1] tracking-tight text-spruce transition-transform duration-700 ease-out-expo group-hover:translate-x-2 sm:text-[42px] md:text-[54px] lg:text-[64px]">
                    {g.label}
                  </span>
                </Link>
                <p className="mt-2.5 max-w-[520px] text-[14px] leading-[1.5] text-ink-mute md:text-[16px]">
                  {g.desc.map((part, i) =>
                    typeof part === 'string' ? (
                      <Fragment key={i}>{part}</Fragment>
                    ) : (
                      <Link
                        key={i}
                        href={part.href}
                        className="relative z-10 py-3.5 font-medium text-spruce underline decoration-spruce/30 underline-offset-4 transition-colors hover:decoration-spruce"
                      >
                        {part.label}
                      </Link>
                    ),
                  )}
                </p>
              </div>
              <span
                aria-hidden="true"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sage text-spruce transition-all duration-700 ease-out-expo group-hover:-rotate-45 group-hover:bg-spruce group-hover:text-canvas md:h-14 md:w-14"
              >
                <ArrowRight className="h-5 w-5" strokeWidth={1.75} />
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
