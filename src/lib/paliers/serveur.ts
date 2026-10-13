// Paliers cadeaux, côté serveur (route /api/paliers). Le jeton Admin ne
// quitte jamais le serveur : la réponse ne contient que les périodes du
// métachamp (sans les identifiants de remise), les produits de la base de
// chaque palier (identifiants numériques) et un simple « en stock » par
// variante cadeau et le titre des remises cadeaux (celui que le client voit
// déjà au paiement).
//
// Base d'un palier cadeau = la collection du critère « le client achète » de
// la remise Shopify citée par le métachamp (aujourd'hui « Produits TVA 5,5% ») :
// exactement ce que compte Shopify, sans identifiant de collection en dur.

import { unstable_cache } from 'next/cache'
import { shopifyAdminFetch, shopifyFetch } from '@/lib/shopify/client'
import { idNumerique, parsePaliers, type Palier, type Periode } from './index'

const GET_PALIERS = /* GraphQL */ `
  query PaliersCadeaux {
    shop {
      metafield(namespace: "bodystart", key: "paliers_cadeaux") { value }
    }
  }
`

const GET_REMISES = /* GraphQL */ `
  query RemisesPaliers($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on DiscountAutomaticNode {
        id
        automaticDiscount {
          __typename
          ... on DiscountAutomaticBasic { title }
          ... on DiscountAutomaticBxgy {
            title
            customerBuys {
              items {
                __typename
                ... on DiscountCollections { collections(first: 10) { nodes { id } } }
                ... on DiscountProducts { products(first: 250) { nodes { id } } }
              }
            }
          }
        }
      }
    }
  }
`

const GET_PRODUITS_COLLECTION = /* GraphQL */ `
  query ProduitsCollection($id: ID!, $after: String) {
    collection(id: $id) {
      products(first: 250, after: $after) {
        pageInfo { hasNextPage endCursor }
        nodes { id }
      }
    }
  }
`

const GET_STOCK = /* GraphQL */ `
  query StockCadeaux($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant { id availableForSale }
    }
  }
`

type Items =
  | { __typename: 'DiscountCollections'; collections: { nodes: { id: string }[] } }
  | { __typename: 'DiscountProducts'; products: { nodes: { id: string }[] } }
  | { __typename: string }

interface RemisesResponse {
  nodes: ({ id: string; automaticDiscount: { __typename: string; title?: string; customerBuys?: { items: Items } } | null } | null)[]
}

interface Remises {
  /** Produits de la base de chaque remise (identifiants numériques). */
  bases: Record<string, string[]>
  /** Titres des remises (pour reconnaître leurs lignes au panier). */
  titres: string[]
}

async function produitsCollection(id: string): Promise<string[]> {
  const out: string[] = []
  let after: string | null = null
  for (let page = 0; page < 10; page++) {
    const data: {
      collection: { products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: { id: string }[] } } | null
    } = await shopifyAdminFetch(GET_PRODUITS_COLLECTION, { id, after })
    if (!data.collection) throw new Error(`collection introuvable : ${id}`)
    out.push(...data.collection.products.nodes.map((n) => idNumerique(n.id)))
    if (!data.collection.products.pageInfo.hasNextPage) break
    after = data.collection.products.pageInfo.endCursor
  }
  return out
}

/** Base et titre de chaque remise, lus par l'API Admin. */
async function lireRemises(remises: string[]): Promise<Remises> {
  if (remises.length === 0) return { bases: {}, titres: [] }
  const data = await shopifyAdminFetch<RemisesResponse>(GET_REMISES, { ids: remises })
  const parCollection = new Map<string, Promise<string[]>>()
  const out: Record<string, string[]> = {}
  const titres = data.nodes.map((n) => n?.automaticDiscount?.title).filter((t): t is string => !!t)
  for (const node of data.nodes) {
    const items = node?.automaticDiscount?.customerBuys?.items
    if (!node || !items) continue
    if ('collections' in items) {
      const listes = await Promise.all(
        items.collections.nodes.map((c) => {
          if (!parCollection.has(c.id)) parCollection.set(c.id, produitsCollection(c.id))
          return parCollection.get(c.id)!
        })
      )
      out[node.id] = [...new Set(listes.flat())]
    } else if ('products' in items) {
      out[node.id] = items.products.nodes.map((p) => idNumerique(p.id))
    }
  }
  return { bases: out, titres: [...new Set(titres)] }
}

// Collection : relue au plus toutes les 15 min. Stock : au plus toutes les 5 min.
const remisesEnCache = unstable_cache(lireRemises, ['paliers-remises'], { revalidate: 900 })
const stockEnCache = unstable_cache(
  async (ids: string[]): Promise<Record<string, boolean>> => {
    if (ids.length === 0) return {}
    const data = await shopifyFetch<{ nodes: ({ id: string; availableForSale: boolean } | null)[] }>(GET_STOCK, { ids })
    return Object.fromEntries(data.nodes.filter((n): n is { id: string; availableForSale: boolean } => !!n?.id).map((n) => [n.id, n.availableForSale === true]))
  },
  ['paliers-stock'],
  { revalidate: 300 }
)

/** Palier tel qu'envoyé au navigateur : sans l'identifiant de remise, avec l'index de sa base. */
export type PalierPublic = Omit<Palier, 'remise_shopify'> & { ensemble?: number }
export type PeriodePublique = Omit<Periode, 'paliers'> & { paliers: PalierPublic[] }

export interface PaliersPublics {
  periodes: PeriodePublique[]
  /** Listes de produits (identifiants numériques) servant de base, référencées par `ensemble`. */
  ensembles: string[][]
  /** Variante cadeau → en stock. */
  stock: Record<string, boolean>
  /** Titres des remises cadeaux. */
  titres: string[]
  /** `?paliers_date=` accepté (hors production seulement). */
  dateForcable: boolean
}

export async function chargerPaliers(): Promise<PaliersPublics | null> {
  const data = await shopifyFetch<{ shop: { metafield: { value: string } | null } }>(GET_PALIERS)
  const config = parsePaliers(data.shop.metafield?.value)
  if (!config) return null

  const cadeaux = config.periodes.flatMap((p) => p.paliers).filter((p) => p.type === 'cadeau')
  const remises = [...new Set(cadeaux.map((p) => p.remise_shopify).filter((x): x is string => !!x))].sort()
  const variantes = [...new Set(cadeaux.flatMap((p) => p.variantes ?? []).map((v) => v.id))].sort()
  const [{ bases, titres }, stock] = await Promise.all([remisesEnCache(remises), stockEnCache(variantes)])

  // Une base par liste distincte de produits (aujourd'hui une seule pour tous les paliers).
  const ensembles: string[][] = []
  const indexDe = new Map<string, number>()
  const ensemblePour = (remise?: string): number | undefined => {
    const liste = remise ? bases[remise] : undefined
    if (!liste?.length) return undefined
    const cle = [...liste].sort().join(',')
    if (!indexDe.has(cle)) {
      indexDe.set(cle, ensembles.length)
      ensembles.push(liste)
    }
    return indexDe.get(cle)
  }

  const periodes: PeriodePublique[] = config.periodes.map((p) => ({
    ...p,
    paliers: p.paliers.flatMap((palier): PalierPublic[] => {
      const { remise_shopify, ...reste } = palier
      if (palier.type === 'livraison') return [reste]
      // Palier cadeau sans base lisible : masqué plutôt que calculé faux.
      const ensemble = ensemblePour(remise_shopify)
      return ensemble === undefined ? [] : [{ ...reste, ensemble }]
    }),
  }))

  return { periodes, ensembles, stock, titres, dateForcable: process.env.VERCEL_ENV !== 'production' }
}
