import type { Metadata } from 'next'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { getBlogArticles } from '@/lib/shopify'
import type { ShopifyArticle } from '@/lib/shopify/types'

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
    <div>
      {/* ─── Hero ─── */}
      <div className="bg-gray-950 text-white py-20 md:py-24 border-b-4 border-gray-900">
        <div className="container max-w-3xl text-center">
          <span className="text-brand-500 text-[10px] font-black uppercase tracking-widest block border-l-4 border-brand-500 pl-3 text-left inline-block mb-6">Ressources</span>
          <h1 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 leading-none">Blog Nutrition &amp; Sport</h1>
          <p className="text-gray-300 font-medium text-lg max-w-xl mx-auto">
            Conseils d&apos;experts, guides pratiques et actualités pour optimiser vos performances.
          </p>
        </div>
      </div>

      <div className="container py-14">
        {fromShopify ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/blog/${article.handle}`}
                className="group block bg-white rounded-sm border-2 border-gray-200 hover:-translate-y-1 hover:border-gray-900 shadow-[4px_4px_0_theme(colors.gray.200)] hover:shadow-[8px_8px_0_theme(colors.gray.900)] transition-all overflow-hidden"
              >
                <div className="relative aspect-video overflow-hidden border-b-2 border-gray-200 group-hover:border-gray-900 transition-colors bg-brand-50">
                  {article.image ? (
                    <Image
                      src={article.image.url}
                      alt={article.image.altText ?? article.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="font-display font-black text-4xl text-brand-200">BS</span>
                    </div>
                  )}
                </div>
                <div className="p-6 md:p-8">
                  {article.tags.length > 0 && (
                    <span className="text-[10px] font-black tracking-widest uppercase text-brand-700 bg-brand-50 border-2 border-brand-200 px-2 py-1 rounded-sm inline-block mb-4">
                      {article.tags[0]}
                    </span>
                  )}
                  <h2 className="font-display font-black text-2xl uppercase tracking-tight text-gray-900 mb-3 group-hover:text-brand-700 transition-colors leading-tight">
                    {article.title}
                  </h2>
                  {article.excerpt && (
                    <p className="text-sm font-medium text-gray-600 line-clamp-2 mb-6">{article.excerpt}</p>
                  )}
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-400 pt-4 border-t-2 border-gray-100">
                    <span>{formatDate(article.publishedAt)}</span>
                    <span className="flex items-center gap-2 text-gray-900 border-b-2 border-transparent group-hover:border-gray-900 transition-all">
                      Lire <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 max-w-xl mx-auto">
            <p className="font-black uppercase tracking-widest text-gray-900 text-xl mb-3">Aucun article pour l&apos;instant</p>
            <p className="text-gray-500 font-medium mb-8">
              Pour publier des articles, crée un blog dans ton admin Shopify :<br />
              <strong>Boutique en ligne → Articles de blog → Créer un blog</strong>
            </p>
            <Link href="/products" className="btn-primary">Voir nos produits</Link>
          </div>
        )}
      </div>
    </div>
  )
}
