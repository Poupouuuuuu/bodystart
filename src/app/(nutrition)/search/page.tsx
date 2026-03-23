import type { Metadata } from 'next'
import { searchProducts } from '@/lib/shopify'
import ProductCard from '@/components/product/ProductCard'
import SearchBar from '@/components/ui/SearchBar'
import type { ShopifyProduct } from '@/lib/shopify/types'

export const metadata: Metadata = {
  title: 'Recherche — Body Start Nutrition',
  description: 'Recherchez parmi tous les produits Body Start Nutrition.',
}

interface SearchPageProps {
  searchParams: { q?: string }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const q = searchParams.q?.trim() ?? ''

  let results: ShopifyProduct[] = []
  if (q) {
    try {
      results = await searchProducts(q, 48)
    } catch {
      // Shopify non configuré
    }
  }

  const count = results.length

  return (
    <div>
      {/* Hero */}
      <div className="bg-gray-50 border-b-2 border-gray-200">
        <div className="container py-12 md:py-16">
          <span className="text-brand-700 text-xs font-black uppercase tracking-widest block mb-4 border-l-4 border-brand-500 pl-3">Recherche</span>
          <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tight text-gray-900 leading-none">
            {q ? (
              <>&ldquo;{q}&rdquo;</>
            ) : (
              'Recherche'
            )}
          </h1>
          {q && (
            <p className="text-gray-500 font-medium mt-3">
              {count > 0
                ? `${count} résultat${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}`
                : 'Aucun résultat'}
            </p>
          )}
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="container py-8">
        <SearchBar initialQuery={q} className="max-w-2xl" />
      </div>

      {/* Résultats */}
      <div className="container pb-16">
        {!q ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="font-black uppercase tracking-widest text-gray-400 text-lg">Tapez un mot-clé pour trouver un produit</p>
            <p className="text-gray-300 text-sm mt-2 font-medium">Ex : &ldquo;whey&rdquo;, &ldquo;créatine&rdquo;, &ldquo;prise de muscle&rdquo;</p>
          </div>
        ) : count === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="font-black uppercase tracking-widest text-gray-900 text-lg mb-2">Aucun résultat pour &ldquo;{q}&rdquo;</p>
            <p className="text-gray-500 text-sm mb-8 font-medium">Essayez d&apos;autres mots-clés ou parcourez notre catalogue.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
