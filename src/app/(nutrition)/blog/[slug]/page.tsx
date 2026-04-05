import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, ArrowRight, Calendar, User, Tag, BookOpen } from 'lucide-react'
import { getBlogArticles, getArticleByHandle } from '@/lib/shopify'
import { notFound } from 'next/navigation'
import { cn } from '@/lib/utils'

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
    <article className="bg-[#f4f6f1] min-h-screen">
      {/* Hero image */}
      <div className="relative w-full overflow-hidden max-h-[520px] aspect-video">
        {article.image ? (
          <Image
            src={article.image.url}
            alt={article.image.altText ?? article.title}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-[#1a2e23] flex items-center justify-center">
            <BookOpen className="w-20 h-20 text-[#89a890]/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a2e23] via-[#1a2e23]/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-4xl mx-auto">
            {article.tags.length > 0 && (
              <span className="inline-block bg-[#7cb98b] text-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest rounded-full mb-5">
                {article.tags[0]}
              </span>
            )}
            <h1 className="font-display text-3xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight text-white leading-none max-w-4xl">
              {article.title}
            </h1>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-12">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#4a5f4c] hover:text-[#1a2e23] mb-10 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Retour au blog
          </Link>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-5 text-sm font-medium text-[#89a890] mb-10 pb-8 border-b border-[#89a890]/20">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" /> {formatDate(article.publishedAt)}
            </span>
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" /> {article.author.name}
            </span>
            {article.tags.length > 0 && (
              <span className="flex items-center gap-2">
                <Tag className="w-4 h-4" /> {article.tags.join(' / ')}
              </span>
            )}
          </div>

          {/* Contenu HTML Shopify */}
          {article.contentHtml ? (
            <div
              className={cn(
                'prose prose-lg max-w-none',
                'prose-p:font-medium prose-p:text-[#1a2e23]/70 prose-p:leading-relaxed',
                'prose-headings:font-display prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-headings:text-[#1a2e23]',
                'prose-a:text-[#4a5f4c] prose-a:underline-offset-4 hover:prose-a:text-[#7cb98b]',
                'prose-strong:text-[#1a2e23]',
                'prose-img:rounded-[20px] prose-img:shadow-sm',
                'prose-blockquote:border-l-[#7cb98b] prose-blockquote:bg-white prose-blockquote:rounded-r-[16px] prose-blockquote:py-1 prose-blockquote:px-6'
              )}
              dangerouslySetInnerHTML={{ __html: article.contentHtml }}
            />
          ) : article.excerpt ? (
            <p className="text-[#1a2e23]/70 font-medium text-xl leading-relaxed">{article.excerpt}</p>
          ) : null}

          {/* CTA */}
          <div className="bg-white rounded-[24px] p-8 md:p-10 flex flex-col md:flex-row items-center gap-6 mt-16 mb-16 shadow-sm">
            <div className="flex-1 text-center md:text-left">
              <p className="font-display text-2xl font-black uppercase tracking-tight text-[#1a2e23] mb-2 leading-none">
                Pret a passer a l&apos;action ?
              </p>
              <p className="text-[#1a2e23]/50 font-medium">Decouvrez nos produits selectionnes par nos experts.</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0 w-full md:w-auto">
              <Link
                href="/blog"
                className="inline-flex items-center justify-center gap-2 bg-[#f4f6f1] text-[#1a2e23] font-bold text-sm px-6 py-3.5 rounded-full hover:bg-[#89a890]/20 transition-colors w-full sm:w-auto"
              >
                <ArrowLeft className="w-4 h-4" /> Blog
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 bg-[#1a2e23] text-white font-bold text-sm px-8 py-3.5 rounded-full hover:bg-[#4a5f4c] transition-colors shadow-md hover:shadow-lg w-full sm:w-auto"
              >
                Nos produits <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Articles lies */}
          {related.length > 0 && (
            <div className="pt-16 mt-16 border-t border-[#89a890]/20">
              <h2 className="font-display text-3xl font-black uppercase tracking-tight text-[#1a2e23] mb-8">Articles lies</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {related.map((a) => (
                  <Link
                    key={a.id}
                    href={`/blog/${a.handle}`}
                    className="group rounded-[20px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 bg-white flex flex-col hover:-translate-y-1"
                  >
                    <div className="relative aspect-video overflow-hidden bg-[#f4f6f1]">
                      {a.image ? (
                        <Image
                          src={a.image.url}
                          alt={a.image.altText ?? a.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-[#1a2e23]/5">
                          <BookOpen className="w-10 h-10 text-[#89a890]/40" />
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      {a.tags.length > 0 && (
                        <span className="text-[11px] font-bold tracking-widest uppercase text-[#4a5f4c] bg-[#f4f6f1] px-3 py-1.5 rounded-full mb-3 inline-block self-start">
                          {a.tags[0]}
                        </span>
                      )}
                      <p className="text-xl font-black uppercase tracking-tight text-[#1a2e23] mt-2 group-hover:text-[#4a5f4c] transition-colors leading-tight">
                        {a.title}
                      </p>
                      <p className="text-xs font-semibold text-[#89a890] mt-6 pt-4 border-t border-[#f4f6f1]">
                        {formatDate(a.publishedAt)}
                      </p>
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
