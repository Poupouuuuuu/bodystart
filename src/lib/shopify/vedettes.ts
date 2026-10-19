// Produits mis en avant sur l'accueil, côté serveur (règle dans lib/vedettes) :
// metafield boutique `bodystart.accueil_vedettes` (Storefront, relu toutes les
// 15 minutes au plus), complété si besoin par les meilleures ventes en chiffre
// d'affaires sur 60 jours (ShopifyQL, Admin API, relues toutes les 6 heures).

import { unstable_cache } from 'next/cache'
import { composerVedettes, lireVedettes } from '@/lib/vedettes'
import type { ShopifyProduct } from './types'
import { shopifyAdminFetch, shopifyFetch } from './client'
import { getFeaturedProducts, withCardPrice } from './index'
import { GET_PRODUITS_PAR_IDS, requeteProduitsParHandles } from './queries/products'

const GET_VEDETTES = `query Vedettes { shop { metafield(namespace: "bodystart", key: "accueil_vedettes") { value } } }`

/** Une erreur n'est pas mise en cache (elle remonte) : la liste revient au prochain essai. */
const handlesEnCache = unstable_cache(
  async (): Promise<string[]> => {
    const data = await shopifyFetch<{ shop: { metafield: { value: string } | null } }>(GET_VEDETTES)
    return lireVedettes(data.shop.metafield?.value ?? null)
  },
  ['accueil-vedettes-v1'],
  { revalidate: 900 }
)

// net_sales : chiffre d'affaires après remises et retours, caisse comprise.
const VENTES_60J = `query Ventes60j {
  shopifyqlQuery(query: "FROM sales SHOW net_sales GROUP BY product_id SINCE -60d UNTIL today ORDER BY net_sales DESC LIMIT 30") {
    parseErrors
    tableData { columns { name } rows }
  }
}`

interface ReponseVentes {
  shopifyqlQuery: {
    parseErrors: string[]
    tableData: { columns: { name: string }[]; rows: unknown } | null
  } | null
}

/** Identifiants produit (gid) par chiffre d'affaires décroissant sur 60 jours. */
const ventesEnCache = unstable_cache(
  async (): Promise<string[]> => {
    const data = await shopifyAdminFetch<ReponseVentes>(VENTES_60J)
    const r = data.shopifyqlQuery
    if (!r || r.parseErrors.length || !r.tableData) throw new Error(`ShopifyQL : ${r?.parseErrors.join(' | ')}`)
    const col = r.tableData.columns.findIndex((c) => c.name === 'product_id')
    const rows = Array.isArray(r.tableData.rows) ? r.tableData.rows : []
    return rows
      .map((row) => (Array.isArray(row) ? row[col] : (row as Record<string, unknown>)?.product_id))
      .filter((id): id is string | number => (typeof id === 'string' && /^\d+$/.test(id)) || typeof id === 'number')
      .map((id) => `gid://shopify/Product/${id}`)
  },
  ['ventes-60j-v1'],
  { revalidate: 21600 }
)

async function produitsParHandles(handles: string[]): Promise<(ShopifyProduct | null)[]> {
  if (handles.length === 0) return []
  const variables = Object.fromEntries(handles.map((h, i) => [`h${i}`, h]))
  const data = await shopifyFetch<Record<string, ShopifyProduct | null>>(requeteProduitsParHandles(handles.length), variables)
  return handles.map((_, i) => {
    const p = data[`p${i}`]
    return p ? withCardPrice(p) : null
  })
}

/** Complément : chiffre d'affaires 60 jours ; meilleures ventes Shopify si ShopifyQL ne répond pas. */
async function complement(): Promise<ShopifyProduct[]> {
  try {
    const ids = await ventesEnCache()
    if (ids.length === 0) throw new Error('aucune vente')
    const data = await shopifyFetch<{ nodes: (ShopifyProduct | null)[] }>(GET_PRODUITS_PAR_IDS, { ids })
    return data.nodes.filter((p): p is ShopifyProduct => !!p?.handle).map(withCardPrice)
  } catch (e) {
    console.warn('[vedettes] complément par chiffre d’affaires indisponible, meilleures ventes Shopify à la place :', e)
    return getFeaturedProducts()
  }
}

/**
 * Produits de l'accueil : vedettes du metafield (ordre, publiés, en stock),
 * puis complément jusqu'à `places`. Liste vide si Shopify ne répond pas.
 */
export async function getVedettesAccueil(places: number): Promise<ShopifyProduct[]> {
  try {
    const handles = await handlesEnCache().catch(() => [] as string[])
    const vedettes = await produitsParHandles(handles)
    const enStock = vedettes.filter((p) => p && p.availableForSale !== false).length
    return composerVedettes(vedettes, enStock >= places ? [] : await complement(), places)
  } catch {
    return []
  }
}
