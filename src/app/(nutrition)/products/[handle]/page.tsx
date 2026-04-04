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
import { ChevronRight, Star } from 'lucide-react'

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

      {/* ─── SECTION HERO — Solid Background ─── */}
      <div className="relative pb-32 pt-16 md:pt-24 z-10 bg-[#f4f6f1]">
        <div className="container relative z-10">


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

      {/* ─── TRANSITION COURBEE (Wave SVG) ─── */}
      <div className="relative w-full h-[150px] -mt-[149px] z-20 pointer-events-none overflowing-hidden">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="absolute bottom-0 w-full h-full">
          <path 
            fill="#d1dcca" 
            fillOpacity="1" 
            d="M0,192L80,181.3C160,171,320,149,480,165.3C640,181,800,235,960,234.7C1120,235,1280,181,1360,154.7L1440,128L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
          ></path>
        </svg>
      </div>

      {/* ─── SECTION VERT SAUGE : Nutrition Facts & Science ─── */}
      <div className="bg-[#d1dcca] py-16 relative z-10 w-full border-b border-white/20">
         <div className="container">
           <NutritionAndScience metafields={product.metafields} />
         </div>
      </div>

      {/* ─── NOUVEAU TICKER PREUVE SOCIALE ─── */}
      <div className="w-full bg-[#1a2e23] border-b border-[#2c3e2e]/20 py-5 overflow-hidden flex whitespace-nowrap">
        <div className="animate-marquee inline-block relative">
          <div className="flex gap-16 items-center">
            {Array(4).fill([
              "« Meilleure digestion de ma vie » - Thomas B.",
              "« Se dilue parfaitement, zéro grumeau » - Sarah M.",
              "« Un goût incroyable, au quotidien » - Julien D.",
              "« Pureté impressionnante » - Alex T."
            ]).flat().map((text, i) => (
              <span key={i} className="text-[11px] font-bold uppercase tracking-widest text-[#89b397] flex items-center gap-3">
                 <div className="flex"><Star className="w-3.5 h-3.5 text-[#d1dcca] fill-current" /><Star className="w-3.5 h-3.5 text-[#d1dcca] fill-current" /><Star className="w-3.5 h-3.5 text-[#d1dcca] fill-current" /><Star className="w-3.5 h-3.5 text-[#d1dcca] fill-current" /><Star className="w-3.5 h-3.5 text-[#d1dcca] fill-current" /></div> {text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── SECTION LIFESTYLE : Split-Screen ─── */}
      <div className="bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2">
           {/* Image Placeholder (Lifestyle) */}
           <div className="bg-[#f0ece3] min-h-[400px] lg:min-h-[600px] flex justify-center items-center p-12 border-b lg:border-b-0 lg:border-r border-[#2c3e2e]/10">
             <div className="text-center max-w-sm">
                <Star className="w-8 h-8 text-[#2c3e2e]/20 mx-auto mb-4" />
                <p className="text-[11px] font-black uppercase tracking-widest text-[#2c3e2e]/40 mb-3">[ ESPACE IMAGE LIFESTYLE ]</p>
                <p className="text-xs font-bold text-[#4a5f4c]/50 leading-relaxed max-w-xs mx-auto">Insérez ici une photo de votre produit en situation (ex: un shaker prêt à l'emploi) depuis votre CMS Shopify.</p>
             </div>
           </div>

           {/* Texte Explicatif */}
           <div className="flex flex-col justify-center p-12 lg:p-24 bg-white">
             <h2 className="font-display text-4xl md:text-5xl font-black uppercase text-[#2c3e2e] tracking-tighter mb-8">
                Une Pureté Inégalée.
             </h2>
             <div className="text-[#4a5f4c] text-[15px] font-medium leading-relaxed space-y-6" 
                  dangerouslySetInnerHTML={{ __html: product.descriptionHtml || `<p>${product.description}</p>` }} 
             />
           </div>
        </div>
      </div>

      {/* ─── SECTION CROSS-SELL ─── */}
      {relatedProducts.length > 0 && (
        <div className="bg-[#f2efe9] py-24 border-t border-[#2c3e2e]/10">
          <div className="container">
            <h2 className="text-sm font-black uppercase tracking-widest text-[#2c3e2e] mb-12 text-center">
              Pour aller plus loin
            </h2>
            <RelatedProducts products={relatedProducts} currentHandle={product.handle} />
          </div>
        </div>
      )}
    </>
  )
}
