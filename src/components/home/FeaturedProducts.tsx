import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import type { ShopifyProduct } from '@/lib/shopify/types'

interface FeaturedProductsProps {
  products: ShopifyProduct[]
}

const PLACEHOLDER_ITEMS = [
  { title: 'Whey Protéine Premium', type: 'Protéines', price: '34,90€', badge: 'Best-seller', emoji: '🥛' },
  { title: 'Créatine Monohydrate Pure', type: 'Performance', price: '24,90€', badge: 'Top vente', emoji: '⚡' },
  { title: 'BCAA 2:1:1 Instantané', type: 'Acides aminés', price: '28,90€', badge: null, emoji: '💪' },
  { title: 'Oméga 3 Haute Concentration', type: 'Vitamines', price: '19,90€', badge: 'Nouveau', emoji: '🌿' },
]

export default function FeaturedProducts({ products }: FeaturedProductsProps) {
  const hasProducts = products && products.length > 0

  return (
    <section className="section bg-white">
      <div className="container">
        {/* En-tête */}
        <div className="flex items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-brand-700 text-sm font-black uppercase tracking-widest border-l-4 border-brand-500 pl-3">
              Nos incontournables
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-[2.5rem] font-black uppercase tracking-tight text-gray-900 mt-2">
              Produits phares
            </h2>
            <p className="text-gray-500 mt-2 max-w-md">
              Sélection de nos meilleures ventes pour booster vos performances au quotidien.
            </p>
          </div>
          <Link
            href="/products"
            className="hidden sm:inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-900 text-gray-900 font-black uppercase tracking-widest rounded-sm hover:bg-gray-900 hover:text-white transition-all duration-200 text-xs shadow-[4px_4px_0_theme(colors.gray.200)] hover:shadow-[2px_2px_0_theme(colors.gray.200)] flex-shrink-0"
          >
            Tout voir <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grille produits */}
        {hasProducts ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          /* Placeholder cards quand Shopify n'est pas encore connecté */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLACEHOLDER_ITEMS.map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-sm border-2 border-gray-100 overflow-hidden hover:border-brand-700 hover:shadow-[4px_4px_0_theme(colors.gray.900)] transition-all duration-200 group cursor-pointer flex flex-col"
              >
                <div className="aspect-square bg-gradient-to-br from-brand-50 via-brand-100 to-brand-50 flex flex-col items-center justify-center gap-3 relative border-b-2 border-gray-100">
                  <span className="text-5xl">{item.emoji}</span>
                  <span className="font-display font-black text-brand-200 text-2xl">BS</span>
                  {item.badge && (
                    <span className="absolute top-3 left-3 text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-sm bg-brand-700 text-white shadow-[2px_2px_0_theme(colors.brand.900)]">
                      {item.badge}
                    </span>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1">
                  <span className="text-[10px] font-black text-brand-700 uppercase tracking-widest">{item.type}</span>
                  <h3 className="font-display font-black text-gray-900 text-sm uppercase tracking-tight mt-1 mb-2 line-clamp-2 min-h-[2.5rem]">{item.title}</h3>
                  <div className="flex items-center justify-between mt-auto mb-4">
                    <span className="font-black text-gray-900 text-lg">{item.price}</span>
                  </div>
                  <div className="w-full py-3 bg-gray-100 border-2 border-transparent text-gray-400 text-xs uppercase tracking-widest font-black rounded-sm text-center">
                    Ajouter au panier
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA mobile */}
        <div className="mt-8 text-center sm:hidden">
          <Link href="/products" className="btn-secondary w-full">
            Voir tous les produits <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    </section>
  )
}
