import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getCatalogue } from '@/lib/shopify/catalogue'
import ProductsPageClient, { ProductsCatalog } from '@/components/product/ProductsPageClient'
import { buildPageMetadata } from '@/lib/seo'

// 60s : compromis entre fraicheur stock et limite rate Shopify Admin.
// Pour 57+ produits avec fetch batch d'inventaire, on cache 1 min.
export const revalidate = 60

export const metadata: Metadata = buildPageMetadata({
  path: '/products',
  title: 'Tous les produits',
  description: 'Découvrez toute la gamme BodyStart Nutrition : protéines, vitamines, créatine, BCAA et plus.',
})

export default async function ProductsPage() {
  // Données partagées avec /products/page/N (lib/shopify/catalogue).
  const { products, collections, stockByProductId } = await getCatalogue()

  return (
    <div className="bg-canvas min-h-screen">
      {/* H1 rendu côté serveur, hors du Suspense : il ne dépend pas de l'URL. */}
      {/* saison-bandeau : fond du thème pendant une période décorée
          (components/saison/halloween/styles.ts), rien hors période. */}
      {/* Mobile : bandeau resserré (28/11/2026) pour qu'une rangée de cartes
          entière, prix compris, tienne au premier écran ; sur-titre masqué
          sous md. H1 inchangé (texte et balise). max-md:! : le thème de
          saison impose sa marge basse (1,75 rem) et un fond plus haut
          (2,25 rem en Black Week, 2,75 rem à Noël) ; 2 rem suffisent à la
          guirlande de Noël (24 px posée à 6 px du bas) ; pt-5 : le H1 ne
          touche pas la guirlande accrochée sous l'en-tête. */}
      <section className="saison-bandeau pt-5 pb-3 max-md:!mb-0 max-md:!pb-8 md:pt-12 md:pb-6">
        <div className="container">
          <p className="hidden md:block text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3">
            Catalogue
          </p>
          <h1 className="font-display text-[28px] md:text-[44px] font-extrabold text-spruce leading-[1.05] tracking-tight">
            Tous les produits
          </h1>
        </div>
      </section>
      {/* Suspense : isole useSearchParams (ProductsPageClient), sinon toute la
          route bascule en rendu navigateur. Le contenu d'attente est la vraie
          grille par défaut, rendue côté serveur (LCP mobile, liens produit
          dans le HTML) ; ProductsPageClient la remplace une fois le JS chargé. */}
      <Suspense
        fallback={
          <ProductsCatalog
            products={products}
            collections={collections}
            stockByProductId={stockByProductId}
            searchParams={null}
          />
        }
      >
        <ProductsPageClient
          products={products}
          collections={collections}
          stockByProductId={stockByProductId}
        />
      </Suspense>
    </div>
  )
}
