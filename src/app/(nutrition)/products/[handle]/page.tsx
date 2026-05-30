import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getProductByHandle,
  getProductInventoryByLocation,
  getCollectionByHandle,
  getFeaturedProducts,
} from '@/lib/shopify'
import { BODY_START_STORES } from '@/lib/shopify/types'
import { isBundle } from '@/lib/shopify/bundle'
import BackButton from '@/components/product/v2/BackButton'
import BuyBoxV2 from '@/components/product/v2/BuyBoxV2'
import LeConseilBodyStartV2 from '@/components/product/v2/LeConseilBodyStartV2'
import AQuoiCaSertV2 from '@/components/product/v2/AQuoiCaSertV2'
import NutritionTableV2 from '@/components/product/v2/NutritionTableV2'
import CompositionV2 from '@/components/product/v2/CompositionV2'
import ProductDescriptionV2 from '@/components/product/v2/ProductDescriptionV2'
import ReviewsV2 from '@/components/product/v2/ReviewsV2'
import CrossSellV2 from '@/components/product/v2/CrossSellV2'
import PrecautionsEmploiV2 from '@/components/product/v2/PrecautionsEmploiV2'
import { buildPageMetadata } from '@/lib/seo'

// Force fresh render a chaque visite : stock boutique doit etre a jour.
// Sans ca, le rendu peut etre mis en cache (Next.js 14 SSR cache automatique
// sur les routes statiques apparentes). Le check 'Click & Collect 50 unites'
// d'Adam doit afficher correctement '"En stock"' immediatement apres activation.
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface Props {
  params: { handle: string }
}

/**
 * Extrait le format/grammage depuis les metafields Shopify.
 * Cherche les cles courantes en namespace 'custom' ou par defaut :
 *   format, grammage, taille, weight
 * Retourne null si aucun metafield correspondant.
 */
function extractFormat(metafields?: import('@/lib/shopify/types').ShopifyMetafield[] | null): string | null {
  if (!metafields || metafields.length === 0) return null
  const FORMAT_KEYS = new Set(['format', 'grammage', 'taille', 'weight'])
  const found = metafields.find((m) => m && FORMAT_KEYS.has(m.key?.toLowerCase()))
  return found?.value?.trim() || null
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

  // Produits cross-sell (meme collection) avec fallback featured products
  // si le produit n'a pas de collection rattachee.
  let relatedProducts: import('@/lib/shopify/types').ShopifyProduct[] = []
  if (product.collections?.nodes?.[0]?.handle) {
    try {
      const collection = await getCollectionByHandle(product.collections.nodes[0].handle, 5)
      relatedProducts = collection?.products?.nodes ?? []
    } catch {
      // On continue sans recommandations de collection
    }
  }
  if (relatedProducts.length === 0) {
    // Fallback : featured products (4 cartes garanties si Shopify renvoie quelque chose)
    try {
      relatedProducts = await getFeaturedProducts()
    } catch {
      // Pas de cross-sell affiche si tout echoue (graceful)
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
  const format = extractFormat(product.metafields)

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

  // Detection bundle (Shopify Bundles app) : si oui, BuyBoxV2 derive les
  // details des composants de la variante selectionnee en interne (galerie
  // dynamique + selecteurs par composant). La page passe juste le flag.
  const productIsBundle = isBundle(product)

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

      {/* ─── Retour (remplace le fil d'ariane) ─── */}
      <div className="bg-canvas border-b border-spruce/10">
        <div className="container py-4">
          <BackButton fallbackHref={productIsBundle ? '/packs' : '/products'} />
        </div>
      </div>

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
            format={format}
            vendor={product.vendor}
            isBundle={productIsBundle}
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

      {/* ─── Valeurs nutritionnelles (metafield custom.valeurs_nutritionnelles) ─── */}
      {/* Masquee pour les bundles : un pack n'a pas de valeurs nutritionnelles
          propres (elles sont sur chaque composant) → la section "seront ajoutees
          prochainement" n'a pas de sens sur un pack. */}
      {!productIsBundle && <NutritionTableV2 metafields={product.metafields} />}

      {/* ─── Composition + Allergenes (metafields custom.composition + custom.allergenes) ─── */}
      <CompositionV2 metafields={product.metafields} />

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

      {/* ─── Precautions d'emploi (statique, legal, identique sur toutes fiches) ─── */}
      <PrecautionsEmploiV2 />
    </>
  )
}
