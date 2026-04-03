import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import Link from 'next/link'
import { getProductByHandle, getProductInventoryByLocation, getCollectionByHandle } from '@/lib/shopify'
import { BODY_START_STORES } from '@/lib/shopify/types'
import ProductSection from '@/components/product/ProductSection'
import ProductReviews from '@/components/product/ProductReviews'
import NutritionAndScience from '@/components/product/NutritionAndScience'
import HowToUse from '@/components/product/HowToUse'
import RelatedProducts from '@/components/product/RelatedProducts'
import { ChevronRight } from 'lucide-react'

interface Props {
  params: { handle: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const product = await getProductByHandle(params.handle)
    if (!product) return { title: 'Produit introuvable' }
    return {
      title: product.title,
      description: product.description?.slice(0, 160) ?? '',
    }
  } catch {
    return { title: 'Produit' }
  }
}

export default async function ProductPage({ params }: Props) {
  let product = null
  try {
    console.log('[ProductPage] Fetching handle:', params.handle)
    product = await getProductByHandle(params.handle)
    console.log('[ProductPage] Result for', params.handle, ':', product ? `FOUND (id=${product.id})` : 'NULL — produit introuvable ou brouillon')
  } catch (err) {
    console.error('[ProductPage] Erreur API pour handle:', params.handle, err)
  }

  if (!product) notFound()

  // Fetch stock en boutique physique
  const activeStore = BODY_START_STORES.find((s) => s.isActive)
  let storeInventory: Record<string, number> = {}
  if (activeStore?.shopifyLocationId) {
    try {
      const levels = await getProductInventoryByLocation(product.id, activeStore.shopifyLocationId)
      const totalAvailable = levels.reduce((sum, v) => sum + v.available, 0)
      storeInventory[activeStore.id] = totalAvailable
    } catch {
      // Admin API non configurée — on continue sans stock
    }
  }

  // Fetch produits de la même collection pour les recommandations
  let relatedProducts: import('@/lib/shopify/types').ShopifyProduct[] = []
  if (product.collections?.nodes?.[0]?.handle) {
    try {
      const collection = await getCollectionByHandle(product.collections.nodes[0].handle, 5)
      relatedProducts = collection?.products?.nodes ?? []
    } catch {
      // On continue sans les recommandations
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodystart.com'
  const mainVariant = product.variants.nodes[0]
  const hasDiscount =
    mainVariant?.compareAtPrice &&
    parseFloat(mainVariant.compareAtPrice.amount) > parseFloat(mainVariant.price.amount)
  const discountPct = hasDiscount
    ? Math.round(
        ((parseFloat(mainVariant!.compareAtPrice!.amount) - parseFloat(mainVariant!.price.amount)) /
          parseFloat(mainVariant!.compareAtPrice!.amount)) *
          100
      )
    : null

  const collectionName = product.collections?.nodes?.[0]?.title ?? null
  const collectionHandle = product.collections?.nodes?.[0]?.handle ?? null

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description?.slice(0, 500) ?? '',
    image: product.featuredImage?.url ?? '',
    brand: {
      '@type': 'Brand',
      name: product.vendor || 'Body Start Nutrition',
    },
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/products/${product.handle}`,
      priceCurrency: mainVariant?.price.currencyCode ?? 'EUR',
      price: mainVariant?.price.amount ?? '0',
      availability: mainVariant?.availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'Body Start Nutrition',
      },
    },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Accueil',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Produits',
        item: `${siteUrl}/products`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.title,
        item: `${siteUrl}/products/${product.handle}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* ─── SECTION HERO — Fond crème avec texture ─── */}
      <div className="bg-[#fcfdfa] relative pb-16 pt-8 overflow-hidden">
        {/* Subtle texture overlay */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="container relative py-8 md:py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-12">
            <Link href="/" className="hover:text-gray-900 transition-colors">Accueil</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/products" className="hover:text-gray-900 transition-colors">Produits</Link>
            {collectionName && collectionHandle && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <Link href={`/collections/${collectionHandle}`} className="hover:text-gray-900 transition-colors">
                  {collectionName}
                </Link>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-gray-900">{product.title}</span>
          </nav>

          <ProductSection
              images={
                product.images?.nodes.length
                  ? product.images.nodes
                  : product.featuredImage
                    ? [product.featuredImage]
                    : []
              }
              variants={product.variants.nodes}
              title={product.title}
              discountPct={discountPct}
              productTitle={product.title}
              collectionName={collectionName}
              collectionHandle={collectionHandle}
              activeStore={activeStore}
              storeInventory={storeInventory}
            />
        </div>
      </div>

      {/* ─── SECTION VERT CLAIR : Nutrition, Science, How to Use ─── */}
      <div className="bg-[#e6efe1] py-20 relative">
         <div className="container">
           {/* SECTION 1 — Nutrition Facts + Scientifiquement Prouvé */}
           <NutritionAndScience metafields={product.metafields} />

           {/* SECTION 2 — Comment utiliser & Transparence */}
           <div className="mt-20">
              <HowToUse />
           </div>
         </div>
      </div>

      {/* ─── SECTION BLANCHE FINALE ─── */}
      <div className="container py-20">
        
        {/* Avis Judge.me */}
        <Suspense fallback={null}>
          <ProductReviews handle={params.handle} />
        </Suspense>

        {/* SECTION 3 — Complétez votre objectif */}
        {relatedProducts.length > 0 && (
          <div className="mt-24">
            <h2 className="font-display text-4xl font-black uppercase tracking-tighter text-gray-900 mb-12 text-center">Complétez Votre Objectif</h2>
            <RelatedProducts products={relatedProducts} currentHandle={product.handle} />
          </div>
        )}

      </div>
    </>
  )
}
