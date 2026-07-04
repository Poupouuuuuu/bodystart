import type { Metadata } from 'next'
import Link from 'next/link'
import { searchProducts } from '@/lib/shopify'
import { ProductCardShop } from '@/components/product/ProductCardShop'
import SearchBar from '@/components/ui/SearchBar'
import type { ShopifyProduct } from '@/lib/shopify/types'
import { Search, PackageSearch } from 'lucide-react'
import { buildPageMetadata } from '@/lib/seo'

// Page noindex : pas d'interet SEO (resultats varient par query, page mince).
export const metadata: Metadata = buildPageMetadata({
  path: '/search',
  title: 'Recherche, BodyStart Nutrition',
  description: 'Recherchez parmi tous les produits BodyStart Nutrition.',
  noIndex: true,
})

const BTN_PRIMARY =
  'inline-flex items-center justify-center gap-2 bg-fresh text-white font-semibold text-[15px] px-7 py-3.5 rounded-full transition-colors hover:bg-fresh-deep'

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
    <div className="min-h-screen bg-canvas">
      {/* Hero */}
      <div className="bg-white border-b border-spruce/10">
        <div className="container py-12 md:py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-sage flex items-center justify-center">
              <Search className="w-5 h-5 text-spruce" />
            </div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute">
              Recherche
            </span>
          </div>
          <h1 className="font-display text-[32px] md:text-[40px] font-extrabold text-spruce leading-[1.1] tracking-tight">
            {q ? (
              <>&laquo; {q} &raquo;</>
            ) : (
              'Recherche'
            )}
          </h1>
          {q && (
            <p className="text-ink-mute mt-3">
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
            <div className="w-16 h-16 rounded-full bg-sage flex items-center justify-center mb-6">
              <PackageSearch className="w-8 h-8 text-spruce" />
            </div>
            <p className="font-display text-[18px] md:text-[20px] font-bold text-spruce tracking-tight">
              Tapez un mot-clé pour trouver un produit
            </p>
            <p className="text-ink-mute text-sm mt-2">
              Ex : &laquo; whey &raquo;, &laquo; créatine &raquo;, &laquo; prise de muscle &raquo;
            </p>
            <Link href="/products" className={`${BTN_PRIMARY} mt-8`}>
              Voir tous les produits
            </Link>
          </div>
        ) : count === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-sage flex items-center justify-center mb-6">
              <PackageSearch className="w-8 h-8 text-spruce" />
            </div>
            <p className="font-display text-[18px] md:text-[20px] font-bold text-spruce tracking-tight mb-2">
              Aucun résultat pour &laquo; {q} &raquo;
            </p>
            <p className="text-ink-mute text-sm mb-8">
              Essayez d&apos;autres mots-clés ou parcourez notre catalogue.
            </p>
            <Link href="/products" className={BTN_PRIMARY}>
              Voir tous les produits
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {results.map((product) => (
              <ProductCardShop key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
