import type { Metadata } from 'next'

export const revalidate = 3600
import { getCollectionByHandle } from '@/lib/shopify'
import ProductCard from '@/components/product/ProductCard'
import Link from 'next/link'
import { ArrowLeft, Filter } from 'lucide-react'

// Titres lisibles pour les collections Shopify
const COLLECTION_LABELS: Record<string, string> = {
  proteines: 'Protéines',
  whey: 'Whey Protéine',
  'proteines-vegetales': 'Protéines Végétales',
  caseine: 'Caséine',
  gainers: 'Gainers',
  vitamines: 'Vitamines & Minéraux',
  omega: 'Oméga 3',
  antioxydants: 'Antioxydants',
  performance: 'Performance',
  creatine: 'Créatine',
  'pre-workout': 'Pré-Workout',
  bcaa: 'BCAA & Acides aminés',
  boosters: 'Boosters',
  nouveautes: 'Nouveautés',
}

export async function generateMetadata({
  params,
}: {
  params: { handle: string }
}): Promise<Metadata> {
  const label = COLLECTION_LABELS[params.handle] ?? params.handle
  return {
    title: label,
    description: `Découvrez notre gamme ${label} — Body Start Nutrition.`,
  }
}

export default async function CollectionPage({
  params,
}: {
  params: { handle: string }
}) {
  let collection = null
  try {
    collection = await getCollectionByHandle(params.handle, 24)
  } catch {
    // Shopify non configuré ou collection inexistante — on affiche la page vide
  }

  const title = collection?.title ?? COLLECTION_LABELS[params.handle] ?? params.handle
  const description = collection?.description ?? ''
  const products = collection?.products?.nodes ?? []

  return (
    <div>
      {/* En-tête collection */}
      <div className="bg-gray-50 border-b-2 border-gray-200">
        <div className="container py-12 md:py-16">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-700 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au catalogue
          </Link>
          <h1 className="font-display text-4xl md:text-5xl lg:text-[4rem] font-black uppercase tracking-tight text-gray-900 leading-none">{title}</h1>
          {description && <p className="text-gray-600 font-medium mt-6 max-w-2xl">{description}</p>}
          <p className="text-[10px] font-black uppercase tracking-widest text-brand-500 mt-8 mb-2">
            {products.length > 0
              ? `${products.length} PRODUITS DISPONIBLES`
              : ''}
          </p>
        </div>
      </div>

      {/* Grille produits */}
      <div className="container py-10">
        <div className="flex items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-widest text-gray-500">
          <Filter className="w-4 h-4" />
          <span>Filtres à venir</span>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center border-2 border-dashed border-gray-200 mt-8">
            <p className="font-black uppercase tracking-widest text-gray-900 mb-2">
              AUCUN PRODUIT DISPONIBLE
            </p>
            <p className="text-sm text-gray-500 mb-8 font-medium">
              La gamme « {title} » sera lancée très prochainement.
            </p>
            <Link
              href="/products"
              className="btn-primary inline-flex"
            >
              Voir tout le catalogue
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
