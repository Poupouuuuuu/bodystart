import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CalendarDays, Store, UserRound } from 'lucide-react'
import { buildPageMetadata } from '@/lib/seo'
import { BLOG_ARTICLES } from '@/content/blog'
import { BLOG_AUTHOR, formatArticleDate } from '@/lib/blog'
import ArticleRenderer from '@/components/blog/ArticleRenderer'

export const revalidate = 3600

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodystart.vercel.app').replace(/\/$/, '')

export function generateStaticParams() {
  return BLOG_ARTICLES.map((a) => ({ slug: a.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const article = BLOG_ARTICLES.find((a) => a.slug === slug)
  if (!article) return {}
  return buildPageMetadata({
    path: `/blog/${article.slug}`,
    title: article.metaTitle,
    description: article.metaDescription,
  })
}

export default async function BlogArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = BLOG_ARTICLES.find((a) => a.slug === slug)
  if (!article) notFound()

  const url = `${SITE_URL}/blog/${article.slug}`
  const relatedArticles = article.related
    .map((slug) => BLOG_ARTICLES.find((a) => a.slug === slug))
    .filter((a): a is NonNullable<typeof a> => Boolean(a))

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.metaDescription,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
    inLanguage: 'fr-FR',
    author: { '@type': 'Person', name: BLOG_AUTHOR.name, url: `${SITE_URL}${BLOG_AUTHOR.url}` },
    publisher: {
      '@type': 'Organization',
      name: 'BodyStart Nutrition',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/assets/logos/logo-v2-carre.png` },
    },
    image: `${SITE_URL}/assets/logos/logo-v2-og.png`,
    mainEntityOfPage: url,
  }

  // FAQPage : MOT POUR MOT la FAQ visible ci-dessous (règle Google).
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: article.faq.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }

  const howToJsonLd = article.howToSteps?.length
    ? {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: article.title,
        description: article.excerpt,
        step: article.howToSteps.map((s, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: s.name,
          text: s.text,
        })),
      }
    : null

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
      { '@type': 'ListItem', position: 3, name: article.title, item: url },
    ],
  }

  return (
    <div className="bg-canvas min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      {howToJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <article className="container py-12 md:py-16 max-w-3xl">
        {/* Fil d'ariane */}
        <nav aria-label="Fil d'ariane" className="mb-8 text-[12px] font-semibold text-ink-mute">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-spruce transition-colors">Accueil</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/blog" className="hover:text-spruce transition-colors">Blog</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-spruce line-clamp-1" aria-current="page">{article.title}</li>
          </ol>
        </nav>

        <h1 className="font-display text-[30px] md:text-[40px] font-extrabold text-spruce leading-[1.08] tracking-tight mb-5">
          {article.title}
        </h1>

        {/* Auteur + fraîcheur datée (E-E-A-T + GEO) */}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-ink-mute mb-7">
          <Link href={BLOG_AUTHOR.url} className="inline-flex items-center gap-1.5 font-semibold text-spruce hover:text-fresh transition-colors">
            <UserRound className="w-4 h-4" /> {BLOG_AUTHOR.name}
          </Link>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4" /> Mis à jour le {formatArticleDate(article.dateModified)}
          </span>
        </div>

        {/* Answer-first : la réponse avant tout */}
        <p className="bg-sage/70 border-l-4 border-fresh rounded-r-xl px-5 py-4 text-[17px] leading-[1.65] font-medium text-spruce mb-10">
          {article.excerpt}
        </p>

        <ArticleRenderer sections={article.sections} />

        {/* FAQ visible (= schema FAQPage) */}
        <section className="mb-12">
          <h2 className="font-display text-[24px] font-extrabold text-spruce tracking-tight mb-5">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {article.faq.map(({ q, a }) => (
              <div key={q} className="bg-white rounded-xl border border-spruce/10 p-5">
                <h3 className="font-display font-bold text-[15px] text-spruce mb-2">{q}</h3>
                <p className="text-[14px] leading-[1.7] text-ink/90">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Vitrine produits (maillage conversion) */}
        {article.products.length > 0 && (
          <section className="bg-white rounded-2xl border border-spruce/10 p-6 md:p-7 mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3">
              Les produits dont on parle dans ce guide
            </p>
            <ul className="space-y-2.5">
              {article.products.map((p) => (
                <li key={p.handle}>
                  <Link
                    href={`/products/${p.handle}`}
                    className="inline-flex items-center gap-2 text-[15px] font-semibold text-spruce hover:text-fresh transition-colors"
                  >
                    <ArrowRight className="w-4 h-4 flex-shrink-0" /> {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Catégories + articles liés */}
        <div className="flex flex-wrap items-center gap-2.5 mb-8">
          {article.categories.map((c) => (
            <Link
              key={c.slug}
              href={`/categories/${c.slug}`}
              className="bg-white border border-spruce/15 text-spruce text-[13px] font-semibold px-4 py-2 rounded-full hover:bg-sage transition-colors"
            >
              Rayon {c.label}
            </Link>
          ))}
        </div>

        {relatedArticles.length > 0 && (
          <section className="border-t border-spruce/10 pt-8 mb-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-4">
              À lire ensuite
            </p>
            <ul className="space-y-3">
              {relatedArticles.map((r) => (
                <li key={r.slug}>
                  <Link href={`/blog/${r.slug}`} className="font-semibold text-[15px] text-spruce hover:text-fresh transition-colors">
                    {r.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="flex items-center gap-2 text-[14px] text-ink-mute">
          <Store className="w-4 h-4 text-spruce" />
          Une question sur ton cas précis ? Passe nous voir à Coignières —{' '}
          <Link href="/stores" className="font-semibold text-spruce hover:underline underline-offset-4">
            la boutique
          </Link>{' '}
          ou{' '}
          <Link href="/conseil" className="font-semibold text-spruce hover:underline underline-offset-4">
            demande un conseil gratuit
          </Link>
          .
        </p>
      </article>
    </div>
  )
}
