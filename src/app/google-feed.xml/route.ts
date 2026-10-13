/**
 * GET /google-feed.xml — flux produit Google Merchant.
 *
 * - Source : Admin API (status ACTIVE, publié online store, hors tag
 *   `exclu-google`), paginée par curseur → tout le catalogue.
 * - Disponibilité : API Storefront (emplacements des ventes en ligne). Le
 *   stock Admin additionne les dépôts : un produit présent seulement au
 *   dépôt était annoncé « in_stock » à Google.
 * - 1 <item> par variante achetable ; logique de mapping dans
 *   src/lib/google-feed.ts (pure, testée).
 * - Cache : ISR 1h (revalidate) + Cache-Control pour les CDN/Google.
 */
import { shopifyAdminFetch } from '@/lib/shopify/client'
import { buildGoogleFeedXml, EXCLUDE_TAG, type FeedProduct, type FeedVariant } from '@/lib/google-feed'
import { disponibiliteEnLigne } from '@/lib/shopify/disponibilite'

export const revalidate = 3600
export const runtime = 'nodejs'

const FEED_QUERY = `
  query GoogleFeedProducts($cursor: String) {
    products(first: 50, after: $cursor, query: "status:active -tag:'${EXCLUDE_TAG}'") {
      pageInfo { hasNextPage endCursor }
      nodes {
        id
        title
        handle
        descriptionHtml
        vendor
        productType
        tags
        onlineStoreUrl
        featuredImage { url }
        images(first: 11) { nodes { url } }
        variants(first: 100) {
          nodes {
            id
            title
            sku
            barcode
            price
            compareAtPrice
            image { url }
          }
        }
      }
    }
  }
`

type AdminProduct = Omit<FeedProduct, 'variants'> & { variants: { nodes: Omit<FeedVariant, 'availableForSale'>[] } }

interface FeedQueryResponse {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null }
    nodes: AdminProduct[]
  }
}

async function fetchAllProducts(): Promise<FeedProduct[]> {
  const all: AdminProduct[] = []
  let cursor: string | null = null
  // Garde-fou : 40 pages × 50 = 2000 produits max (catalogue actuel ~112)
  for (let page = 0; page < 40; page++) {
    const data: FeedQueryResponse = await shopifyAdminFetch<FeedQueryResponse>(FEED_QUERY, { cursor })
    all.push(...data.products.nodes)
    if (!data.products.pageInfo.hasNextPage) break
    cursor = data.products.pageInfo.endCursor
  }
  const dispo = await disponibiliteEnLigne(all.flatMap((p) => p.variants.nodes.map((v) => v.id)))
  return all.map((p) => ({
    ...p,
    variants: { nodes: p.variants.nodes.map((v) => ({ ...v, availableForSale: dispo[v.id] === true })) },
  }))
}

export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodystart-nutrition.fr'
  const products = await fetchAllProducts()
  const { xml, counters } = buildGoogleFeedXml(products, siteUrl)

  console.log(
    `[google-feed] ${counters.items} items | produits exclus: ${counters.skippedProducts} | sans image: ${counters.skippedNoImage} | sans prix: ${counters.skippedNoPrice}`
  )

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
