import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Calendar, User, Tag } from 'lucide-react'
import { getBlogArticles, getArticleByHandle } from '@/lib/shopify'
import { notFound } from 'next/navigation'

interface Props {
  params: { slug: string }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    // On cherche dans le premier blog disponible
    const articles = await getBlogArticles(50)
    const article = articles.find((a) => a.handle === params.slug)
    if (article) {
      return {
        title: `${article.title} — Body Start`,
        description: article.excerpt ?? '',
      }
    }
  } catch {}
  return { title: 'Article — Body Start Blog' }
}

export default async function BlogArticlePage({ params }: Props) {
  let article = null as import('@/lib/shopify/types').ShopifyArticle | null
  let allArticles: import('@/lib/shopify/types').ShopifyArticle[] = []

  try {
    allArticles = await getBlogArticles(20)
    article = allArticles.find((a) => a.handle === params.slug) ?? null

    // Si pas trouvé par handle direct, essayer via getArticleByHandle avec "news" (blog par défaut Shopify)
    if (!article) {
      article = await getArticleByHandle('news', params.slug)
    }
  } catch {}

  if (!article) notFound()

  const related = allArticles.filter((a) => a.handle !== params.slug).slice(0, 2)

  return (
    <article>
      {/* Hero image */}
      <div className="relative aspect-video w-full overflow-hidden bg-brand-50 max-h-[480px]">
        {article.image ? (
          <Image
            src={article.image.url}
            alt={article.image.altText ?? article.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gray-950 flex items-center justify-center">
            <span className="font-display font-black text-6xl text-brand-700">BS</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 border-b-4 border-gray-900">
          {article.tags.length > 0 && (
            <span className="inline-block bg-brand-600 border-2 border-transparent text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-sm mb-4">
              {article.tags[0]}
            </span>
          )}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-white leading-none max-w-4xl">
            {article.title}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="container py-10">
        <div className="max-w-3xl mx-auto">
          <Link href="/blog" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-700 hover:text-gray-900 mb-10 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour au blog
          </Link>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-10 pb-8 border-b-2 border-gray-200">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> {formatDate(article.publishedAt)}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4" /> {article.author.name}
            </span>
            {article.tags.length > 0 && (
              <span className="flex items-center gap-1.5">
                <Tag className="w-4 h-4" /> {article.tags.join(' · ')}
              </span>
            )}
          </div>

          {/* Contenu HTML Shopify */}
          {article.contentHtml ? (
            <div
              className="prose prose-gray max-w-none prose-p:font-medium prose-p:text-gray-600 prose-headings:font-display prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-headings:text-gray-900 prose-a:text-brand-700 prose-strong:text-gray-900 prose-img:rounded-sm prose-img:border-2 prose-img:border-gray-200 text-lg"
              dangerouslySetInnerHTML={{ __html: article.contentHtml }}
            />
          ) : article.excerpt ? (
            <p className="text-gray-600 font-medium text-xl leading-relaxed">{article.excerpt}</p>
          ) : null}

          {/* CTA */}
          <div className="bg-white rounded-sm border-2 border-gray-900 shadow-[8px_8px_0_theme(colors.gray.900)] p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 mt-16 mb-16">
            <div className="flex-1 text-center md:text-left">
              <p className="font-display text-2xl font-black uppercase tracking-tight text-gray-900 mb-2 leading-none">Prêt à passer à l&apos;action ?</p>
              <p className="text-gray-500 font-medium">Découvrez nos produits sélectionnés par nos experts.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 flex-shrink-0 w-full md:w-auto">
              <Link href="/blog" className="btn-secondary w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-2 inline-block" /> Blog
              </Link>
              <Link href="/products" className="btn-primary w-full sm:w-auto">
                Nos produits
              </Link>
            </div>
          </div>

          {/* Articles liés */}
          {related.length > 0 && (
            <div className="border-t-4 border-gray-900 pt-16 mt-16">
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-gray-900 mb-8">Articles liés</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {related.map((a) => (
                  <Link
                    key={a.id}
                    href={`/blog/${a.handle}`}
                    className="group rounded-sm overflow-hidden border-2 border-gray-200 hover:-translate-y-1 hover:border-gray-900 shadow-[4px_4px_0_theme(colors.gray.200)] hover:shadow-[8px_8px_0_theme(colors.gray.900)] transition-all bg-white flex flex-col"
                  >
                    <div className="relative aspect-video overflow-hidden border-b-2 border-gray-200 group-hover:border-gray-900 transition-colors bg-brand-50">
                      {a.image ? (
                        <Image
                          src={a.image.url}
                          alt={a.image.altText ?? a.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="font-display font-black text-3xl text-brand-200">BS</span>
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      {a.tags.length > 0 && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-700 bg-brand-50 border-2 border-brand-200 px-2 py-1 rounded-sm mb-3 inline-block">{a.tags[0]}</span>
                      )}
                      <p className="text-xl font-black uppercase tracking-tight text-gray-900 mt-2 group-hover:text-brand-700 transition-colors leading-tight">{a.title}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-6 pt-4 border-t-2 border-gray-100">{formatDate(a.publishedAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
