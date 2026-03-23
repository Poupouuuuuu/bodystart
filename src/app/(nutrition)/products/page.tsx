import type { Metadata } from 'next'
import Link from 'next/link'
import { getProducts, getCollections } from '@/lib/shopify'
import ProductCard from '@/components/product/ProductCard'
import type { ShopifyCollection } from '@/lib/shopify/types'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Tous les produits',
  description: 'Découvrez toute la gamme Body Start Nutrition : protéines, vitamines, créatine, BCAA et plus.',
}

const PLACEHOLDER_PRODUCTS = [
  { title: 'Whey Protéine Premium', type: 'Protéines', price: '34,90€', badge: 'Best-seller' },
  { title: 'Créatine Monohydrate Pure', type: 'Performance', price: '24,90€', badge: 'Top vente' },
  { title: 'BCAA 2:1:1 Instantané', type: 'Acides aminés', price: '28,90€', badge: null },
  { title: 'Oméga 3 Haute Concentration', type: 'Vitamines', price: '19,90€', badge: 'Nouveau' },
  { title: 'Magnésium Marin', type: 'Minéraux', price: '16,90€', badge: null },
  { title: 'Pré-Workout Intense', type: 'Performance', price: '32,90€', badge: 'Nouveau' },
  { title: 'Caséine Micellar Night', type: 'Protéines', price: '39,90€', badge: null },
  { title: 'Vitamine D3 + K2', type: 'Vitamines', price: '14,90€', badge: null },
]

export default async function ProductsPage() {
  let products: import('@/lib/shopify/types').ShopifyProduct[] = []
  let collections: ShopifyCollection[] = []
  try {
    const [result, cols] = await Promise.all([
      getProducts({ first: 250 }),
      getCollections(50),
    ])
    products = result.nodes
    collections = cols
  } catch {
    // Fallback sans API
  }

  const hasProducts = products.length > 0

  return (
    <div>
      {/* ─── Hero ─── */}
      <div className="bg-gray-50 border-b-2 border-gray-200">
        <div className="container py-12 md:py-16">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            <div>
              <span className="text-brand-700 text-xs font-black uppercase tracking-widest block mb-4 border-l-4 border-brand-500 pl-3">Catalogue</span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-[3rem] font-black uppercase tracking-tight text-gray-900 mb-2">Tous nos produits</h1>
              <p className="text-gray-600 font-medium">
                {hasProducts
                  ? `${products.length} PRODUIT${products.length > 1 ? 'S' : ''} DISPONIBLE${products.length > 1 ? 'S' : ''}`
                  : 'FORMULES SCIENTIFIQUES · INGRÉDIENTS TRACÉS · DOSAGES PRÉCIS'}
              </p>
            </div>
            {/* Badges confiance */}
            <div className="hidden md:flex items-center gap-3">
              {['🔬 Clinique', '🌿 Tracé', '🚚 48h'].map((b) => (
                <span key={b} className="text-[10px] font-black uppercase tracking-widest text-gray-900 bg-white border-2 border-gray-900 px-3 py-1.5 rounded-sm shadow-[2px_2px_0_theme(colors.brand.500)]">
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Onglets catégories dynamiques */}
          {collections.length > 0 && (
            <div className="relative mt-10">
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 pr-12">
              <Link
                href="/products"
                className="flex-shrink-0 px-4 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all border-2 bg-gray-900 border-gray-900 text-white shadow-[2px_2px_0_theme(colors.brand.500)]"
              >
                Tout voir
              </Link>
              {collections.map((col) => (
                <Link
                  key={col.handle}
                  href={`/collections/${col.handle}`}
                  className="flex-shrink-0 px-4 py-2.5 rounded-sm text-[10px] font-black uppercase tracking-widest transition-all border-2 bg-white border-gray-200 text-gray-600 shadow-[2px_2px_0_theme(colors.gray.200)] hover:border-gray-900 hover:text-gray-900 hover:shadow-[2px_2px_0_theme(colors.gray.900)]"
                >
                  {col.title}
                </Link>
              ))}
            </div>
            {/* Gradient fade-out pour indiquer le scroll */}
            <div className="absolute right-0 top-0 bottom-2 w-16 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* ─── Contenu ─── */}
      <div className="container py-10">
        {hasProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <>
            {/* Placeholder visuel quand Shopify n'est pas connecté */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-sm text-gray-500">Aperçu de la gamme — connectez Shopify pour afficher vos vrais produits</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {PLACEHOLDER_PRODUCTS.map((p) => (
                <div key={p.title} className="bg-white rounded-sm border-2 border-gray-100 overflow-hidden hover:border-brand-700 hover:shadow-[4px_4px_0_theme(colors.gray.900)] transition-all duration-200 group flex flex-col">
                  <div className="aspect-square bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center relative border-b-2 border-gray-100">
                    <span className="font-display font-black text-4xl text-brand-200">BS</span>
                    {p.badge && (
                      <span className="absolute top-3 left-3 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-sm bg-brand-700 text-white shadow-[2px_2px_0_theme(colors.brand.900)]">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <span className="text-[10px] font-black text-brand-700 uppercase tracking-widest">{p.type}</span>
                    <h3 className="font-display font-black text-gray-900 text-sm uppercase tracking-tight mt-1 mb-3 line-clamp-2 min-h-[2.5rem]">{p.title}</h3>
                    <div className="flex items-center justify-between mt-auto mb-4">
                      <span className="font-black text-gray-900 text-lg">{p.price}</span>
                    </div>
                    <div className="w-full py-3 bg-gray-100 border-2 border-transparent text-gray-400 text-xs uppercase tracking-widest font-black rounded-sm text-center">
                      Ajouter au panier
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
