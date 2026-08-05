import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getProducts, getCollections, getInventoryForVariants } from '@/lib/shopify'
import { BODY_START_STORES, type ShopifyCollection, type ShopifyProduct } from '@/lib/shopify/types'
import { isPackProduct } from '@/lib/shopify/bundle'
import ProductsPageClient from '@/components/product/ProductsPageClient'
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
  let products: ShopifyProduct[] = []
  let collections: ShopifyCollection[] = []
  try {
    const [result, cols] = await Promise.all([
      // first:250 = tout le catalogue (~60 produits) en une seule requete.
      // BEST_SELLING = classement reel des ventes Shopify (caisse POS incluse,
      // 99 % du CA) : le tri par defaut « Meilleures ventes » affiche enfin les
      // vrais best-sellers en tete (decision Adam 2026-07 — avant : createdAt
      // groupe par categorie, un produit recent squattait le haut de grille).
      // Le tri client « Nouveautes » repose desormais sur le champ createdAt.
      getProducts({ first: 250, sortKey: 'BEST_SELLING' }),
      getCollections(50),
    ])
    // Exclut les packs (bundles) de "Tous les produits" : ils ont leur
    // propre page /packs. Filtre par productType "Pack" OU tag "pack".
    // (Scope local a cette page : la home et /packs gardent les packs.)
    products = result.nodes.filter((p) => !isPackProduct(p))
    // Retire aussi la collection "Packs" de la barre de categories pour ne
    // pas laisser un filtre qui mene a une grille vide.
    collections = cols.filter((c) => c.handle !== 'packs')
  } catch {
    // Fallback sans API
  }

  // Fetch batch inventaire boutique Coignieres pour badge stock bas
  // (Plus que X en stock - cf. ProductsPageClient ProductCardShop).
  // Si echec : on continue sans le data, les badges stock bas ne s'affichent pas.
  const stockByProductId: Record<string, number> = {}
  const activeStore = BODY_START_STORES.find((s) => s.isActive)
  if (activeStore?.shopifyLocationId && products.length > 0) {
    try {
      const allVariantIds = products.flatMap((p) => p.variants.nodes.map((v) => v.id))
      const inventory = await getInventoryForVariants(allVariantIds, activeStore.shopifyLocationId)
      for (const p of products) {
        const total = p.variants.nodes.reduce((sum, v) => sum + (inventory[v.id] ?? 0), 0)
        stockByProductId[p.id] = total
      }
    } catch (err) {
      console.error('[ProductsPage] batch inventory fetch failed:', err)
    }
  }

  return (
    <div className="bg-canvas min-h-screen">
      {/* H1 rendu côté serveur (SSR) : la grille ci-dessous est client-rendered
          (useSearchParams), donc le H1 doit vivre ici pour être dans le HTML. */}
      <section className="pt-10 pb-4 md:pt-12 md:pb-6">
        <div className="container">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-mute mb-3">
            Catalogue
          </p>
          <h1 className="font-display text-[34px] md:text-[44px] font-extrabold text-spruce leading-[1.05] tracking-tight">
            Tous les produits
          </h1>
        </div>
      </section>
      {/* Suspense : isole useSearchParams (ProductsPageClient) pour que le H1
          ci-dessus soit rendu côté serveur (sinon toute la route bascule en CSR). */}
      <Suspense fallback={<div className="container pb-10" />}>
        <ProductsPageClient
          products={products}
          collections={collections}
          stockByProductId={stockByProductId}
        />
      </Suspense>
    </div>
  )
}
