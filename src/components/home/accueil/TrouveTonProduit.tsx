import Link from 'next/link'
import { ArrowRight, MessageCircle } from 'lucide-react'

/**
 * « Trouve ton produit en 1 min » (refonte du 28/11/2026) : entrée du
 * questionnaire /conseil, avec l'objectif déjà choisi en raccourci
 * (`?objectif=`, clés du guide comme ObjectifsV3 : le client démarre à la
 * question 2). Carte blanche sur la crème, pas d'aplat vert.
 */
const OBJECTIFS = [
  { label: 'Prendre du muscle', href: '/conseil?objectif=muscle' },
  { label: 'Affiner ma silhouette', href: '/conseil?objectif=affiner' },
  { label: 'Énergie et endurance', href: '/conseil?objectif=endurance' },
  { label: 'Mieux récupérer', href: '/conseil?objectif=recuperation' },
  { label: 'Santé au quotidien', href: '/conseil?objectif=sante' },
]

export default function TrouveTonProduit() {
  return (
    <section aria-labelledby="titre-trouve" className="bg-canvas">
      <div className="container py-12 md:py-20">
        <div className="relative overflow-hidden rounded-[28px] bg-white px-5 py-8 shadow-card sm:px-8 md:px-12 md:py-12 lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-12">
          <div>
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute">
              <MessageCircle className="h-4 w-4 text-fresh" strokeWidth={1.75} aria-hidden="true" />
              Conseil gratuit
            </p>
            <h2
              id="titre-trouve"
              className="saison-titre mt-3 font-display text-[30px] font-extrabold leading-[1.02] tracking-tight text-spruce md:text-[44px]"
            >
              Trouve ton produit en <span className="saison-mot">1&nbsp;min</span>
            </h2>
            <p className="mt-3 max-w-[560px] text-[16px] leading-[1.6] text-ink-mute md:text-[17px]">
              Réponds à quelques questions, on te propose une sélection en stock à Coignières. Ton objectif&nbsp;:
            </p>
            <ul className="mt-5 flex flex-wrap gap-2">
              {OBJECTIFS.map((o) => (
                <li key={o.href}>
                  <Link
                    href={o.href}
                    className="press inline-flex min-h-[44px] items-center rounded-full border border-spruce/20 bg-canvas px-4 text-[14px] font-semibold text-spruce transition-colors hover:border-spruce hover:bg-sage"
                  >
                    {o.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <Link href="/conseil" className="btn-primary press group mt-7 w-full sm:w-auto lg:mt-0">
            Commencer
            <ArrowRight
              className="h-4 w-4 transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </section>
  )
}
