import type { Metadata } from 'next'
import { ArrowRight, BookOpen } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { getBlogArticles } from '@/lib/shopify'
import type { ShopifyArticle } from '@/lib/shopify/types'
import { cn } from '@/lib/utils'

export const metadata: Metadata = {
  title: 'Blog — Conseils nutrition & sport',
  description: "Conseils nutrition, guides d'entraînement et actualités Body Start.",
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function BlogPage() {
  let articles: ShopifyArticle[] = []
  let fromShopify = false
  try {
    articles = await getBlogArticles(12)
    fromShopify = articles.length > 0
  } catch {
    // Shopify non configuré ou pas de blog
  }

  return (
    <div className="bg-[#f4f6f1] min-h-screen">
      {/* Hero */}
      <section className="relative bg-[#1a2e23] text-white py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-[#7cb98b] blur-[120px]" />
          <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-[#89a890] blur-[140px]" />
        </div>
        <div className="container max-w-3xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8">
            <BookOpen className="w-4 h-4 text-[#7cb98b]" />
            <span className="text-xs font-semibold uppercase tracking-widest text-[#89a890]">Ressources</span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tight mb-6 leading-none">
            Blog Nutrition &amp; Sport
          </h1>
          <p className="text-white/60 font-medium text-lg max-w-xl mx-auto">
            Conseils d&apos;experts, guides pratiques et actualités pour optimiser vos performances.
          </p>
        </div>
      </section>

      <div className="container py-16">
        {fromShopify ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {articles.map((article, index) => (
              <Link
                key={article.id}
                href={`/blog/${article.handle}`}
                className={cn(
                  'group block bg-white rounded-[20px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1',
                  index === 0 && 'md:col-span-2 lg:col-span-2'
                )}
              >
                <div className={cn(
                  'relative overflow-hidden bg-[#f4f6f1]',
                  index === 0 ? 'aspect-[2/1]' : 'aspect-video'
                )}>
                  {article.image ? (
                    <Image
                      src={article.image.url}
                      alt={article.image.altText ?? article.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#1a2e23]/5">
                      <BookOpen className="w-12 h-12 text-[#89a890]/40" />
                    </div>
                  )}
                </div>
                <div className="p-6 md:p-8">
                  {article.tags.length > 0 && (
                    <span className="text-[11px] font-bold tracking-widest uppercase text-[#4a5f4c] bg-[#f4f6f1] px-3 py-1.5 rounded-full inline-block mb-4">
                      {article.tags[0]}
                    </span>
                  )}
                  <h2 className={cn(
                    'font-display font-black uppercase tracking-tight text-[#1a2e23] mb-3 group-hover:text-[#4a5f4c] transition-colors leading-tight',
                    index === 0 ? 'text-2xl md:text-3xl' : 'text-xl'
                  )}>
                    {article.title}
                  </h2>
                  {article.excerpt && (
                    <p className="text-sm font-medium text-[#1a2e23]/50 line-clamp-2 mb-6">{article.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between text-xs font-semibold text-[#89a890] pt-4 border-t border-[#f4f6f1]">
                    <span>{formatDate(article.publishedAt)}</span>
                    <span className="flex items-center gap-2 text-[#4a5f4c] group-hover:gap-3 transition-all">
                      Lire <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 max-w-xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-[#89a890]/10 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="w-8 h-8 text-[#89a890]" />
            </div>
            <p className="font-display font-black uppercase tracking-tight text-[#1a2e23] text-xl mb-3">Aucun article pour l&apos;instant</p>
            <p className="text-[#1a2e23]/50 font-medium mb-8">
              Pour publier des articles, crée un blog dans ton admin Shopify :<br />
              <strong className="text-[#1a2e23]">Boutique en ligne &rarr; Articles de blog &rarr; Créer un blog</strong>
            </p>
            <Link
              href="/products"
              className="inline-flex items-center gap-2 bg-[#1a2e23] text-white font-bold text-sm px-8 py-4 rounded-full hover:bg-[#4a5f4c] transition-colors shadow-md hover:shadow-lg"
            >
              Voir nos produits
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
