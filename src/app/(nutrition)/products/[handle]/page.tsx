import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import {
  getProductByHandle,
  getProductInventoryByLocation,
  getCollectionByHandle,
} from '@/lib/shopify'
import { BODY_START_STORES } from '@/lib/shopify/types'
import BuyBoxV2 from '@/components/product/v2/BuyBoxV2'
import LeConseilBodyStartV2 from '@/components/product/v2/LeConseilBodyStartV2'
import AQuoiCaSertV2 from '@/components/product/v2/AQuoiCaSertV2'
import NutritionTableV2 from '@/components/product/v2/NutritionTableV2'
import ProductDescriptionV2 from '@/components/product/v2/ProductDescriptionV2'
import ReviewsV2 from '@/components/product/v2/ReviewsV2'
import CrossSellV2 from '@/components/product/v2/CrossSellV2'
import { buildPageMetadata } from '@/lib/seo'

interface Props {
  params: { handle: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const product = await getProductByHandle(params.handle)
    if (!product) return { title: 'Produit introuvable' }

    const description = product.description?.slice(0, 160) ?? ''
    const image = product.featuredImage?.url

    return buildPageMetadata({
      path: `/products/${product.handle}`,
      title: product.title,
      description,
      ogImage: image,
      // Next.js 14.2 Metadata supporte 'website' | 'article' uniquement (pas 'product').
      // Le rich snippet produit est gere via le schema.org JSON-LD ci-dessous.
      ogType: 'website',
    })
  } catch {
    return { title: 'Produit' }
  }
}

// Tags Shopify qui donnent une pastille benefice automatique sur la buy box
const BENEFIT_TAGS_MAP: Record<string, string> = {
  whey: 'Whey isolat',
  'sans-sucre': 'Sans sucre',
  vegan: '100% végétal',
  'anti-dopage': 'Certifié anti-dopage',
  'sans-gluten': 'Sans gluten',
  'made-in-france': 'Fabriqué en France',
  bio: 'Bio',
}

function extractBenefits(tags: string[]): string[] {
  const out: string[] = []
  for (const tag of tags) {
    const label = BENEFIT_TAGS_MAP[tag.toLowerCase()]
    if (label && !out.includes(label)) out.push(label)
  }
  return out.slice(0, 4) // max 4 pastilles
}

export default async function ProductPage({ params }: Props) {
  let product = null
  try {
    product = await getProductByHandle(params.handle)
  } catch (err) {
    console.error('[ProductPage] Erreur API pour handle:', params.handle, err)
  }

  if (!product) notFound()

  // Stock boutique physique
  const activeStore = BODY_START_STORES.find((s) => s.isActive)
  const storeInventory: Record<string, number> = {}
  if (activeStore?.shopifyLocationId) {
    try {
      const levels = await getProductInventoryByLocation(product.id, activeStore.shopifyLocationId)
      const totalAvailable = levels.reduce((sum, v) => sum + v.available, 0)
      storeInventory[activeStore.id] = totalAvailable
    } catch (err) {
      console.error('[ClickCollect] inventory fetch failed for', product.handle, err)
    }
  }

  // Produits cross-sell (meme collection)
  let relatedProducts: import('@/lib/shopify/types').ShopifyProduct[] = []
  if (product.collections?.nodes?.[0]?.handle) {
    try {
      const collection = await getCollectionByHandle(product.collections.nodes[0].handle, 5)
      relatedProducts = collection?.products?.nodes ?? []
    } catch {
      // On continue sans recommandations
    }
  }

  // SEO + JSON-LD (rich snippets)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodystart.vercel.app'
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
  const benefits = extractBenefits(product.tags ?? [])

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description?.slice(0, 500) ?? '',
    image: product.featuredImage?.url ?? '',
    brand: { '@type': 'Brand', name: product.vendor || 'BodyStart Nutrition' },
    offers: {
      '@type': 'Offer',
      url: `${siteUrl}/products/${product.handle}`,
      priceCurrency: mainVariant?.price.currencyCode ?? 'EUR',
      price: mainVariant?.price.amount ?? '0',
      availability: mainVariant?.availableForSale
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'BodyStart Nutrition' },
    },
  }

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: 'Produits', item: `${siteUrl}/products` },
      {
        '@type': 'ListItem',
        position: 3,
        name: product.title,
        item: `${siteUrl}/products/${product.handle}`,
      },
    ],
  }

  const images =
    product.images?.nodes.length
      ? product.images.nodes
      : product.featuredImage
        ? [product.featuredImage]
        : []

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

      {/* ─── Fil d'ariane ─── */}
      <nav
        aria-label="Fil d'ariane"
        className="bg-canvas border-b border-spruce/10"
      >
        <div className="container py-4">
          <ol className="flex items-center gap-1.5 text-[12px] text-ink-mute">
            <li>
              <Link href="/" className="hover:text-spruce transition-colors">
                Accueil
              </Link>
            </li>
            <ChevronRight className="w-3 h-3" />
            <li>
              <Link href="/products" className="hover:text-spruce transition-colors">
                Produits
              </Link>
            </li>
            {collectionName && (
              <>
                <ChevronRight className="w-3 h-3" />
                <li>
                  <Link
                    href={`/products?cat=${collectionHandle}`}
                    className="hover:text-spruce transition-colors"
                  >
                    {collectionName}
                  </Link>
                </li>
              </>
            )}
            <ChevronRight className="w-3 h-3" />
            <li className="text-spruce font-medium truncate">{product.title}</li>
          </ol>
        </div>
      </nav>

      {/* ─── Buy box : galerie + panneau achat ─── */}
      <section className="bg-canvas">
        <div className="container py-10 md:py-14">
          <BuyBoxV2
            images={images}
            variants={product.variants.nodes}
            title={product.title}
            discountPct={discountPct}
            collectionName={collectionName}
            collectionHandle={collectionHandle}
            activeStore={activeStore}
            storeInventory={storeInventory}
            benefits={benefits}
          />
        </div>
      </section>

      {/* ─── Le conseil BodyStart (place haut, juste apres buy box) ─── */}
      <section className="bg-white">
        <div className="container py-12 md:py-16">
          <div className="max-w-4xl mx-auto">
            <LeConseilBodyStartV2 handle={product.handle} />
          </div>
        </div>
      </section>

      {/* ─── A quoi ca sert (3 cartes) ─── */}
      <AQuoiCaSertV2 />

      {/* ─── Valeurs nutritionnelles ─── */}
      <NutritionTableV2 metafields={product.metafields} />

      {/* ─── Description longue ─── */}
      <ProductDescriptionV2
        descriptionHtml={product.descriptionHtml}
        description={product.description}
      />

      {/* ─── Avis ─── */}
      <ReviewsV2 />

      {/* ─── Cross-sell + nudge franco ─── */}
      {relatedProducts.length > 0 && (
        <CrossSellV2 products={relatedProducts} currentHandle={product.handle} />
      )}
    </>
  )
}
