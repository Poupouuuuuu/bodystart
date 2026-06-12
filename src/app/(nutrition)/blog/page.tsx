import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, BookOpen } from 'lucide-react'
import { buildPageMetadata } from '@/lib/seo'
import { BLOG_ARTICLES } from '@/content/blog'
import { formatArticleDate } from '@/lib/blog'
import { CATEGORY_PAGES } from '@/lib/categories'

export const revalidate = 3600

export const metadata: Metadata = buildPageMetadata({
  path: '/blog',
  title: 'Guides nutrition sportive : conseils concrets et chiffrés',
  description:
    'Créatine, whey, EAA, prise de masse : nos guides répondent aux vraies questions, avec des dosages précis et zéro promesse en l’air. Par l’équipe de Coignières.',
})

export default function BlogPage() {
  const articles = [...BLOG_ARTICLES].sort((a, b) => (a.datePublished < b.datePublished ? 1 : -1))

  return (
    <div className="bg-canvas min-h-screen">
      <div className="container py-14 md:py-20 max-w-5xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3">
          Le blog BodyStart
        </p>
        <h1 className="font-display text-[34px] md:text-[48px] font-extrabold text-spruce leading-[1.05] tracking-tight mb-5">
          Guides nutrition sportive
        </h1>
        <p className="text-ink-mute text-[17px] leading-[1.65] max-w-[640px] mb-12">
          Les réponses qu&apos;on donne tous les jours au comptoir de Coignières, posées à l&apos;écrit :
          des dosages précis, des comparatifs honnêtes, zéro promesse en l&apos;air. Et si ton cas est
          particulier,{' '}
          <Link href="/conseil" className="font-semibold text-fresh hover:text-fresh-deep underline underline-offset-4 decoration-fresh/40">
            on te conseille gratuitement
          </Link>
          .
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {articles.map((a) => (
            <Link
              key={a.slug}
              href={`/blog/${a.slug}`}
              className="group bg-white rounded-2xl border border-spruce/10 p-7 hover:shadow-md hover:border-spruce/20 transition-all flex flex-col"
            >
              <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-mute mb-3">
                {formatArticleDate(a.dateModified)}
              </p>
              <h2 className="font-display text-[20px] font-extrabold text-spruce tracking-tight leading-snug mb-3 group-hover:text-fresh transition-colors">
                {a.title}
              </h2>
              <p className="text-[14px] text-ink-mute leading-[1.65] mb-5 flex-1">{a.excerpt}</p>
              <span className="inline-flex items-center gap-2 text-[13px] font-bold text-fresh">
                Lire le guide
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          ))}
        </div>

        {/* Maillage catégories */}
        <div className="bg-white rounded-2xl border border-spruce/10 p-7">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-spruce mb-4">
            <BookOpen className="w-4 h-4" /> Nos rayons
          </p>
          <div className="flex flex-wrap gap-2.5">
            {CATEGORY_PAGES.map((c) => (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}`}
                className="bg-canvas border border-spruce/15 text-spruce text-[13px] font-semibold px-4 py-2 rounded-full hover:bg-sage transition-colors"
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
