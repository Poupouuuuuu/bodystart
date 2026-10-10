import { notFound, permanentRedirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getProductByHandle, getProducts } from '@/lib/shopify'
import { pickComplements } from '@/lib/merchandising'
import { wheyLabel } from '@/lib/product-subtitle'
import { BODY_START_STORES } from '@/lib/shopify/types'
import { isBundle, pickInitialBundleVariant } from '@/lib/shopify/bundle'
import { pickDefaultVariant } from '@/lib/product-variant'
import BackButton from '@/components/product/v2/BackButton'
import BuyBoxV2 from '@/components/product/v2/BuyBoxV2'
import NutritionTableV2 from '@/components/product/v2/NutritionTableV2'
import CompositionV2 from '@/components/product/v2/CompositionV2'
import ProductDescriptionV2 from '@/components/product/v2/ProductDescriptionV2'
import QuestionProduitV2 from '@/components/product/v2/QuestionProduitV2'
import ReviewsV2 from '@/components/product/v2/ReviewsV2'
import CrossSellV2 from '@/components/product/v2/CrossSellV2'
import PrecautionsEmploiV2 from '@/components/product/v2/PrecautionsEmploiV2'
import { buildPageMetadata, plainTextFromHtml, truncateAtWord } from '@/lib/seo'
import { COLISSIMO, MONDIAL_RELAY, HANDLING_DAYS } from '@/lib/shipping'
import { ratingFromMetafields, buildAggregateRating } from '@/lib/reviews'
import { getGoogleRating } from '@/lib/shopify/google-rating'
import { getProductRedirect } from '@/lib/shopify/product-redirects'

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
    const description =
      product.seo?.description?.trim() ||
      truncateAtWord(plainTextFromHtml(product.descriptionHtml) || product.description || '')
    const image = product.featuredImage?.url

    return buildPageMetadata({
      path: `/products/${product.handle}`,
      title,
      description,
      ogImage: image,
      // og:type product : rendu par la page (Next ne connaît pas ce type).
      ogType: 'product',
    })
  } catch {
    return { title: 'Produit' }
  }
}

// Tags Shopify qui donnent une pastille benefice automatique sur la buy box.
// Le type de whey (claire, isolat, concentrée) vient de wheyLabel, d'après
// les étiquettes précises : l'étiquette « whey » seule ne dit pas lequel.
const BENEFIT_TAGS_MAP: Record<string, string> = {
  'sans-sucre': 'Sans sucre',
  vegan: '100% végétal',
  'anti-dopage': 'Certifié anti-dopage',
  'sans-gluten': 'Sans gluten',
  'made-in-france': 'Fabriqué en France',
  bio: 'Bio',
}

function extractBenefits(tags: string[], title: string): string[] {
  const whey = wheyLabel(tags, title)
  const out: string[] = whey ? [whey] : []
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

  // API OK mais produit introuvable : fiche retirée listée dans le métachamp
  // des redirections → redirection permanente (308 en App Router, traitée
  // comme un 301 par Google) ; sinon vrai 404.
  if (!product) {
    const destination = await getProductRedirect(handle)
    if (destination) permanentRedirect(destination)
    notFound()
  }

  // Stock boutique physique : fetché CÔTÉ CLIENT par BuyBoxV2 (/api/inventory
  // ?productId=…) — temps réel même avec la page en ISR. On ne passe plus que
  // l'identité du magasin actif.
  const activeStore = BODY_START_STORES.find((s) => s.isActive)

  // Suggestions : ce qui VA AVEC ce produit (créatine, shaker, crème de riz,
  // collation sous une whey…), jamais un concurrent de la même famille ni une
  // marque exclue des blocs automatiques (lib/merchandising). Avant le
  // 08/10/2026 : produits de la même collection, donc une whey sous une whey.
  let relatedProducts: import('@/lib/shopify/types').ShopifyProduct[] = []
  try {
    relatedProducts = pickComplements(product, (await getProducts({ first: 100, sortKey: 'BEST_SELLING' })).nodes)
  } catch {
    // Pas de suggestions si Shopify ne répond pas (section masquée)
  }

  // SEO + JSON-LD (rich snippets)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodystart.vercel.app'
  // Detection bundle (Shopify Bundles app) : si oui, BuyBoxV2 derive les
  // details des composants de la variante selectionnee en interne (galerie
  // dynamique + selecteurs par composant). La page passe juste le flag.
  const productIsBundle = isBundle(product)
  // Variante d'ouverture, même règle que BuyBoxV2 (première disponible ; pack :
  // première variante complète) : prix, remise et disponibilité du JSON-LD
  // collent à ce que la fiche affiche. Avant : variants[0], donc « OutOfStock »
  // pour YEAAH EAA alors que deux saveurs sur trois étaient en stock.
  const mainVariant = productIsBundle
    ? pickInitialBundleVariant(product.variants.nodes)
    : pickDefaultVariant(product.variants.nodes)

  const collectionName = product.collections?.nodes?.[0]?.title ?? null
  const collectionHandle = product.collections?.nodes?.[0]?.handle ?? null
  const benefits = extractBenefits(product.tags ?? [], product.title)
  const format = extractFormat(product.metafields)
  // Bloc « Précautions d'emploi » (complément alimentaire) : pas pour les aliments
  // courants (barres, snacks, boissons) ni les accessoires (relecture UE, 25/09/2026).
  const showPrecautions = !['Barres protéinées', 'Snacks', 'Boissons', 'Accessoires'].includes(product.productType ?? '')

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
  // manquant (dans offers) ». Alignée sur la « Politique de remboursement »
  // Shopify et l'article 7 des CGV (06/10/2026) : rétractation 14 j, retour
  // gratuit en boutique ou par la poste aux frais du client
  // (ReturnFeesCustomerResponsibility) ; produit défectueux ou non conforme :
  // frais de retour à la charge de la boutique (itemDefectReturnFees).
  const merchantReturnPolicy = {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'FR',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 14,
    returnMethod: ['https://schema.org/ReturnByMail', 'https://schema.org/ReturnInStore'],
    returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
    itemDefectReturnFees: 'https://schema.org/FreeReturn',
  }

  // Avis-ready : n'émet aggregateRating QUE si une vraie source d'avis existe
  // (aucune aujourd'hui → rien n'est émis ; cf. src/lib/reviews.ts).
  const rating = ratingFromMetafields(product.metafields)
  const googleRating = await getGoogleRating()

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

  return (
    <>
      {/* Hissée dans <head> par React 19 ; buildPageMetadata n'émet pas de og:type ici. */}
      <meta property="og:type" content="product" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* GA4 view_item + Meta ViewContent : envoyés par BuyBoxV2, qui connaît
          la variante réellement affichée (dont ?variant= des pubs Meta). */}

      {/* ─── Retour (remplace le fil d'ariane) ─── */}
      <div className="bg-canvas border-b border-spruce/10">
        <div className="container py-4">
          <BackButton fallbackHref={productIsBundle ? '/packs' : '/products'} />
        </div>
      </div>

      {/* ─── Buy box : galerie + panneau achat ─── */}
      <section className="bg-canvas">
        <div className="container py-10 md:py-14">
          {/* Sans <Suspense> (08/10/2026) : React sort toute frontière dont le
              HTML dépasse ~12 Ko dans un bloc caché révélé par un script, même
              prête. La zone d'achat (galerie, prix, bouton) était invisible sans
              JS. Coût mesuré dans la PR : l'hydratation n'est plus découpée. */}
          <BuyBoxV2
            images={images}
            variants={product.variants.nodes}
            title={product.title}
            handle={product.handle}
            productType={product.productType}
            collectionName={collectionName}
            collectionHandle={collectionHandle}
            activeStore={activeStore}
            productId={product.id}
            benefits={benefits}
            format={format}
            vendor={product.vendor}
            isBundle={productIsBundle}
            rating={rating}
            googleRating={googleRating}
          />
        </div>
      </section>

      {/* ─── Description Shopify, juste sous la zone d'achat (10/10/2026) ───
          Avant : deux blocs génériques identiques sur toutes les fiches
          (« Le conseil BodyStart », « Ce qu'on vérifie ») passaient devant,
          dont une allégation santé non autorisée affichée partout. Aucune
          allégation dans le code : elles ne viennent que des descriptions
          Shopify, relues avant publication. */}
      <ProductDescriptionV2
        descriptionHtml={product.descriptionHtml}
        description={product.description}
      />

      {/* ─── Valeurs nutritionnelles (metafield custom.valeurs_nutritionnelles) ─── */}
      {/* Masquee pour les bundles : un pack n'a pas de valeurs nutritionnelles
          propres (elles sont sur chaque composant) → la section "seront ajoutees
          prochainement" n'a pas de sens sur un pack. */}
      {!productIsBundle && <NutritionTableV2 metafields={product.metafields} />}

      {/* ─── Composition + Allergenes (metafields custom.composition + custom.allergenes) ─── */}
      <CompositionV2 metafields={product.metafields} />

      <QuestionProduitV2 />

      {/* ─── Avis ─── */}
      {/* Sans <Suspense> : composant serveur (note Google), rien à hydrater ;
          la frontière ne servait qu'à l'envoyer dans un bloc caché sans JS. */}
      <ReviewsV2 />

      {/* ─── Cross-sell + nudge franco ─── */}
      {relatedProducts.length > 0 && (
        <CrossSellV2 products={relatedProducts} currentHandle={product.handle} />
      )}

      {/* ─── Précautions d'emploi des compléments alimentaires (statique, légal) ─── */}
      {showPrecautions && <PrecautionsEmploiV2 />}
    </>
  )
}
