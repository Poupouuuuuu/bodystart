import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { getCollections } from '@/lib/shopify'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Nos collections — Body Start Nutrition',
  description: 'Toutes nos gammes de compléments alimentaires : protéines, créatine, vitamines, acides aminés et plus.',
}

export default async function CollectionsPage() {
  let collections: import('@/lib/shopify/types').ShopifyCollection[] = []
  try {
    collections = await getCollections(50)
  } catch {
    // Shopify non configuré
  }

  return (
    <div>
      {/* Hero */}
      <div className="bg-gray-950 text-white py-16 md:py-20 border-b-4 border-gray-900">
        <div className="container max-w-3xl text-center">
          <span className="text-brand-500 text-[10px] font-black uppercase tracking-widest block border-l-4 border-brand-500 pl-3 text-left inline-block mb-6">
            Catalogue
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 leading-none">
            Nos collections
          </h1>
          <p className="text-gray-300 font-medium text-lg max-w-xl mx-auto">
            Chaque gamme est formulée pour un objectif précis. Trouvez ce qu&apos;il vous faut.
          </p>
        </div>
      </div>

      <div className="container py-14">
        {collections.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {collections.map((col) => (
              <Link
                key={col.id}
                href={`/collections/${col.handle}`}
                className="group relative bg-white rounded-sm border-2 border-gray-200 hover:border-gray-900 shadow-[4px_4px_0_theme(colors.gray.200)] hover:shadow-[8px_8px_0_theme(colors.gray.900)] transition-all overflow-hidden hover:-translate-y-1"
              >
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden bg-brand-50 border-b-2 border-gray-200 group-hover:border-gray-900 transition-colors">
                  {col.image ? (
                    <Image
                      src={col.image.url}
                      alt={col.image.altText ?? col.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
                      <span className="font-display font-black text-5xl text-brand-600">BS</span>
                    </div>
                  )}
                </div>

                {/* Infos */}
                <div className="p-5">
                  <h2 className="font-display font-black text-lg uppercase tracking-tight text-gray-900 group-hover:text-brand-700 transition-colors leading-tight mb-2">
                    {col.title}
                  </h2>
                  {col.description && (
                    <p className="text-sm text-gray-500 font-medium line-clamp-2 mb-4">
                      {col.description}
                    </p>
                  )}
                  <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-900 border-b-2 border-transparent group-hover:border-gray-900 transition-all">
                    Voir la collection <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 max-w-xl mx-auto">
            <p className="font-black uppercase tracking-widest text-gray-900 text-xl mb-3">
              Aucune collection pour l&apos;instant
            </p>
            <Link href="/products" className="btn-primary">
              Voir tous les produits
            </Link>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 bg-gray-950 rounded-sm border-2 border-gray-900 shadow-[8px_8px_0_theme(colors.brand.600)] p-10 text-center">
          <p className="font-display text-2xl md:text-3xl font-black uppercase tracking-tight text-white mb-3 leading-none">
            Vous ne savez pas par où commencer ?
          </p>
          <p className="text-gray-400 font-medium mb-8">
            Parcourez tous nos produits ou filtrez par objectif.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/products" className="btn-primary">Tous les produits</Link>
            <Link href="/objectifs" className="btn-secondary bg-transparent border-white text-white hover:bg-white hover:text-gray-900">Par objectif</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
