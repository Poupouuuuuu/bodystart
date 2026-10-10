import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { BLOG_ARTICLES } from '@/content/blog'

/**
 * « Nos guides » sur l'accueil (audit SEO du 10/10/2026) : maillage direct
 * vers les guides qui ont de la demande dans la Search Console (choix de
 * Claude Gestion), rendu côté serveur. Un slug absent du registre est ignoré.
 */
const GUIDES = [
  'quelle-whey-choisir-debutant',
  'whey-ou-isolate-quelle-difference',
  'creatine-avant-ou-apres-seance',
  'creatine-pour-les-femmes',
  'complements-apres-40-ans',
  'magnesium-bienfaits-quelle-forme-choisir',
]

export default function NosGuidesV3() {
  const articles = GUIDES.map((slug) => BLOG_ARTICLES.find((a) => a.slug === slug)).filter(
    (a): a is NonNullable<typeof a> => Boolean(a)
  )
  if (articles.length === 0) return null

  return (
    <section className="bg-canvas">
      <div className="container py-16 md:py-24">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute">Nos guides</p>
            <h2 className="font-display text-[28px] font-extrabold leading-[1.1] tracking-tight text-spruce md:text-[40px]">
              Les réponses qu&apos;on donne au comptoir
            </h2>
          </div>
          <Link
            href="/blog"
            className="group inline-flex min-h-[44px] items-center gap-2 text-[14px] font-semibold text-spruce hover:text-fresh-deep"
          >
            Tous les guides
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <Link
              key={a.slug}
              href={`/blog/${a.slug}`}
              className="press group flex flex-col rounded-[20px] bg-white p-6 shadow-card transition-shadow hover:shadow-lift"
            >
              <h3 className="mb-3 font-display text-[19px] font-bold leading-snug text-spruce transition-colors group-hover:text-fresh-deep">
                {a.title}
              </h3>
              <p className="mb-5 line-clamp-3 flex-1 text-[14px] leading-[1.6] text-ink-mute">{a.excerpt}</p>
              <span className="inline-flex min-h-[44px] items-center gap-2 text-[13px] font-semibold text-fresh">
                Lire le guide
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
