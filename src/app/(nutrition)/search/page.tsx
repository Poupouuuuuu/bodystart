import type { Metadata } from 'next'
import { searchProducts } from '@/lib/shopify'
import ProductCard from '@/components/product/ProductCard'
import SearchBar from '@/components/ui/SearchBar'
import type { ShopifyProduct } from '@/lib/shopify/types'
import { Search, PackageSearch } from 'lucide-react'

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
    <div className="min-h-screen bg-[#f4f6f1]">
      {/* Hero */}
      <div className="bg-white border-b border-[#89a890]/20">
        <div className="container py-12 md:py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#89a890]/10 flex items-center justify-center">
              <Search className="w-5 h-5 text-[#4a5f4c]" />
            </div>
            <span className="text-[#4a5f4c] text-xs font-black uppercase tracking-widest">
              Recherche
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-black uppercase tracking-tight text-[#1a2e23] leading-none">
            {q ? (
              <>&laquo; {q} &raquo;</>
            ) : (
              'Recherche'
            )}
          </h1>
          {q && (
            <p className="text-[#4a5f4c]/70 font-medium mt-3">
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
            <div className="w-16 h-16 rounded-full bg-[#89a890]/10 flex items-center justify-center mb-6">
              <PackageSearch className="w-8 h-8 text-[#89a890]" />
            </div>
            <p className="font-display font-black uppercase tracking-widest text-[#1a2e23]/40 text-lg">
              Tapez un mot-clé pour trouver un produit
            </p>
            <p className="text-[#4a5f4c]/50 text-sm mt-2 font-medium">
              Ex : &laquo; whey &raquo;, &laquo; créatine &raquo;, &laquo; prise de muscle &raquo;
            </p>
          </div>
        ) : count === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-[#89a890]/10 flex items-center justify-center mb-6">
              <PackageSearch className="w-8 h-8 text-[#89a890]" />
            </div>
            <p className="font-display font-black uppercase tracking-widest text-[#1a2e23] text-lg mb-2">
              Aucun résultat pour &laquo; {q} &raquo;
            </p>
            <p className="text-[#4a5f4c]/70 text-sm mb-8 font-medium">
              Essayez d&apos;autres mots-clés ou parcourez notre catalogue.
            </p>
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
