import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { frenchSpacing } from '@/lib/typo'

export interface GuideFiche {
  slug: string
  title: string
  excerpt: string
}

/**
 * 1 ou 2 guides du rayon sous la composition (SEO 2, maillage fiche → guide).
 * Choix par étiquette dans lib/rayon-fiche ; rien pour les accessoires, les
 * packs et les coffrets.
 */
export default function GuidesFicheV2({ guides }: { guides: GuideFiche[] }) {
  if (guides.length === 0) return null
  return (
    <section className="bg-canvas">
      <div className="container pt-4 md:pt-6">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-4 font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute">
            Nos guides sur le sujet
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {guides.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/blog/${g.slug}`}
                  className="group flex h-full flex-col rounded-[20px] bg-white p-5 shadow-card transition-shadow hover:shadow-lift"
                >
                  <span className="font-display text-[17px] font-bold leading-snug text-spruce">{frenchSpacing(g.title)}</span>
                  <span className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-ink-mute">{frenchSpacing(g.excerpt)}</span>
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-spruce group-hover:text-fresh-deep">
                    Lire le guide
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
