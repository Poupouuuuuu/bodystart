import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import {
  getProductByHandle,
  getProducts,
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
import { COLISSIMO, MONDIAL_RELAY, HANDLING_DAYS } from '@/lib/shipping'
import { getProductRating, buildAggregateRating } from '@/lib/reviews'
import TrackViewItem from '@/components/analytics/TrackViewItem'

// ISR 3 min (sprint perf 2026-07-04) : la page était en revalidate=0 +
// force-no-store « pour le stock C&C temps réel » → TTFB ~600 ms mesuré en prod
// (rendu SSR complet + 4-5 appels Shopify à CHAQUE vue, y compris Googlebot).
// Le stock boutique est désormais fetché CÔTÉ CLIENT par BuyBoxV2 via
// /api/inventory?productId=… (toujours temps réel), donc la page peut être
// servie depuis le cache CDN. notFound() sous ISR émet un vrai 404 (le quirk
// 200 ne concernait que force-dynamic). Nouveau produit → généré à la 1re
// visite (dynamicParams par défaut).
export const revalidate = 180

// Pré-génère le catalogue au build → cache chaud dès le deploy.
// Best-effort : si Shopify est indisponible au build, on retombe sur la
// génération à la demande plutôt que de faire échouer le build.
export async function generateStaticParams() {
  try {
    const { nodes } = await getProducts({ first: 250 })
    return nodes.map((p) => ({ handle: p.handle }))
  } catch (err) {
    console.error('[ProductPage] generateStaticParams failed (fallback on-demand):', err)
    return []
  }
}

interface Props {
  // async depuis Next 15 : params est une Promise, à await avant usage.
  params: Promise<{ handle: string }>
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
    const { handle } = await params
    const product = await getProductByHandle(handle)
    if (!product) return { title: 'Produit introuvable' }

    // Champs SEO dédiés Shopify (product.seo) prioritaires, sinon fallback.
    // Les seo.title Shopify sont rédigés SANS suffixe : le template global
    // « %s | BodyStart Nutrition » s'applique ensuite via buildPageMetadata.
    const title = product.seo?.title?.trim() || product.title
    const description = product.seo?.description?.trim() || product.description?.slice(0, 160) || ''
    const image = product.featuredImage?.url

    return buildPageMetadata({
      path: `/products/${product.handle}`,
      title,
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
  const { handle } = await params
  let product = null
  try {
    product = await getProductByHandle(handle)
  } catch (err) {
    console.error('[ProductPage] Erreur API pour handle:', handle, err)
    // PENDANT LE BUILD (prérendu des ~250 fiches) : un hiccup Shopify sur UNE
    // fiche ne doit pas faire échouer tout le deploy → notFound() ; la page
    // sera régénérée saine par l'ISR (≤3 min) après mise en prod.
    if (process.env.NEXT_PHASE === 'phase-production-build') notFound()
    // AU RUNTIME : erreur API ≠ produit absent → on THROW pour que l'ISR
    // conserve la dernière version valide (avant : notFound() → une fiche
    // VALIDE servait un 404, caché et indexable, à chaque hiccup Shopify).
    throw err
  }

  // API OK mais produit réellement introuvable → vrai 404.
  if (!product) notFound()

  // Stock boutique physique : fetché CÔTÉ CLIENT par BuyBoxV2 (/api/inventory
  // ?productId=…) — temps réel même avec la page en ISR. On ne passe plus que
  // l'identité du magasin actif.
  const activeStore = BODY_START_STORES.find((s) => s.isActive)

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

  // Détails de livraison (source unique : src/lib/shipping.ts) — résout
  // l'avertissement Search Console « shippingDetails manquant (dans offers) ».
  // 2 modes France. Le seuil « livraison offerte dès 85 € » n'est pas
  // modélisable en schema.org (palier conditionnel) → Google Merchant Center.
  const shippingDetails = [MONDIAL_RELAY, COLISSIMO].map((method) => ({
    '@type': 'OfferShippingDetails',
    shippingRate: { '@type': 'MonetaryAmount', value: method.priceCents / 100, currency: 'EUR' },
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'FR' },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: { '@type': 'QuantitativeValue', minValue: HANDLING_DAYS[0], maxValue: HANDLING_DAYS[1], unitCode: 'DAY' },
      transitTime: { '@type': 'QuantitativeValue', minValue: method.transitDays![0], maxValue: method.transitDays![1], unitCode: 'DAY' },
    },
  }))

  // Politique de retour — résout l'avertissement « hasMerchantReturnPolicy
  // manquant (dans offers) ». CGV §7 : droit de rétractation 14 j, retour par
  // voie postale. Frais de retour à la charge du client : c'est le défaut légal
  // (art. L221-23 Code conso) et aucune clause « retour gratuit » n'existe en CGV
  // → ReturnFeesCustomerResponsibility.
  const merchantReturnPolicy = {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'FR',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 14,
    returnMethod: 'https://schema.org/ReturnByMail',
    returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
  }

  // Avis-ready : n'émet aggregateRating QUE si une vraie source d'avis existe
  // (aucune aujourd'hui → rien n'est émis ; cf. src/lib/reviews.ts).
  const rating = await getProductRating(product.handle)

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
      shippingDetails,
      hasMerchantReturnPolicy: merchantReturnPolicy,
    },
    ...buildAggregateRating(rating),
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

      {/* GA4 view_item (no-op sans consentement mesure d'audience) */}
      <TrackViewItem
        itemId={product.handle}
        itemName={product.title}
        price={mainVariant ? parseFloat(mainVariant.price.amount) : undefined}
        brand={product.vendor}
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
            productId={product.id}
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
