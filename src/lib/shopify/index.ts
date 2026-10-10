import { cache } from 'react'
import { availableFirst } from '@/lib/product-order'
import { shopifyFetch, shopifyAdminFetch } from './client'
import {
  GET_PRODUCTS,
  GET_PRODUCT_BY_HANDLE,
  GET_FEATURED_PRODUCTS,
  GET_SITEMAP_PRODUCTS,
  SEARCH_PRODUCTS,
} from './queries/products'
import {
  GET_COLLECTIONS,
  GET_COLLECTION_BY_HANDLE,
} from './queries/collections'
import {
  CREATE_CART,
  ADD_TO_CART,
  UPDATE_CART,
  REMOVE_FROM_CART,
  GET_CART,
  UPDATE_CART_ATTRIBUTES,
  UPDATE_CART_DISCOUNT_CODES,
  UPDATE_CART_BUYER_IDENTITY,
} from './queries/cart'
import {
  GET_BLOG_ARTICLES,
  GET_ARTICLE_BY_HANDLE,
} from './queries/blog'
import {
  GET_PRODUCT_INVENTORY_BY_LOCATION,
  GET_INVENTORY_FOR_VARIANTS,
} from './queries/inventory'
import type { ShopifyProduct, ShopifyCollection, ShopifyCart, ShopifyBlog, ShopifyArticle } from './types'
import { computeCardPrice } from '@/lib/product-price'

// ─── PRODUITS ────────────────────────────────────────────────

/**
 * Prix de carte calculé sur TOUTES les variantes (prixVariantes), puis la
 * liste brute est retirée : les composants client ne reçoivent que le résultat.
 */
export function withCardPrice<T extends ShopifyProduct>(p: T): T {
  const { prixVariantes, ...rest } = p
  return { ...rest, cardPrice: computeCardPrice(prixVariantes?.nodes ?? p.variants?.nodes) } as T
}

export async function getProducts(options?: {
  first?: number
  after?: string
  sortKey?: string
  reverse?: boolean
  query?: string
}) {
  const data = await shopifyFetch<{
    products: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null }
      nodes: ShopifyProduct[]
    }
  }>(
    GET_PRODUCTS,
    {
      first: options?.first ?? 250,
      after: options?.after ?? null,
      sortKey: options?.sortKey ?? 'BEST_SELLING',
      reverse: options?.reverse ?? false,
      query: options?.query ?? null,
    }
  )
  return { ...data.products, nodes: data.products.nodes.map(withCardPrice) }
}

export interface SitemapProduct {
  handle: string
  updatedAt: string
  productType: string
  tags: string[]
}

/** Toutes les fiches publiées sur le site (pages de 250, 4 pages au plus). */
export async function getSitemapProducts(): Promise<SitemapProduct[]> {
  const out: SitemapProduct[] = []
  let after: string | null = null
  for (let page = 0; page < 4; page++) {
    const data: {
      products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: SitemapProduct[] }
    } = await shopifyFetch(GET_SITEMAP_PRODUCTS, { first: 250, after })
    out.push(...data.products.nodes)
    if (!data.products.pageInfo.hasNextPage) break
    after = data.products.pageInfo.endCursor
  }
  return out
}

export async function searchProducts(query: string, first = 24) {
  const data = await shopifyFetch<{ products: { nodes: ShopifyProduct[] } }>(
    SEARCH_PRODUCTS,
    { query, first }
  )
  return data.products.nodes.map(withCardPrice)
}

// cache() (React request memoization) : generateMetadata ET la page appellent
// getProductByHandle avec le même handle dans le même rendu — sans cache(), le
// produit était fetché DEUX FOIS par requête (graphql-request passe par POST,
// la memoization fetch de Next ne s'applique pas). Idem collections/featured.
export const getProductByHandle = cache(async (handle: string) => {
  const data = await shopifyFetch<{ product: ShopifyProduct | null }>(
    GET_PRODUCT_BY_HANDLE,
    { handle }
  )
  return data.product ? withCardPrice(data.product) : null
})

export const getFeaturedProducts = cache(async (): Promise<ShopifyProduct[]> => {
  // 20 meilleures ventes avec composants de bundle (cf. GET_FEATURED_PRODUCTS) :
  // marge pour les marques exclues des blocs automatiques (lib/merchandising).
  // Épuisés en fin de liste : un best-seller en rupture ne doit pas occuper
  // les premières cartes de la home (règle transverse boutique).
  try {
    const data = await shopifyFetch<{ products: { nodes: ShopifyProduct[] } }>(
      GET_FEATURED_PRODUCTS
    )
    return availableFirst(data.products.nodes.map(withCardPrice))
  } catch {
    // Sans cles API : section vide (graceful)
    return []
  }
})

// ─── COLLECTIONS ─────────────────────────────────────────────

export async function getCollections(first = 20) {
  const data = await shopifyFetch<{ collections: { nodes: ShopifyCollection[] } }>(
    GET_COLLECTIONS,
    { first }
  )
  return data.collections.nodes
}

export const getCollectionByHandle = cache(async (handle: string, productsFirst = 20) => {
  const data = await shopifyFetch<{ collection: ShopifyCollection | null }>(
    GET_COLLECTION_BY_HANDLE,
    { handle, productsFirst }
  )
  return data.collection
})

// ─── BLOG ────────────────────────────────────────────────────

export async function getBlogArticles(first = 10): Promise<ShopifyArticle[]> {
  const data = await shopifyFetch<{ blogs: { nodes: ShopifyBlog[] } }>(
    GET_BLOG_ARTICLES,
    { first }
  )
  // Cherche dans tous les blogs du store
  const blog = data.blogs.nodes[0]
  return blog?.articles.nodes ?? []
}

export async function getArticleByHandle(blogHandle: string, articleHandle: string): Promise<ShopifyArticle | null> {
  const data = await shopifyFetch<{ blog: { articleByHandle: ShopifyArticle | null } | null }>(
    GET_ARTICLE_BY_HANDLE,
    { blogHandle, articleHandle }
  )
  return data.blog?.articleByHandle ?? null
}

// ─── CART ────────────────────────────────────────────────────

export async function createCart(lines?: { merchandiseId: string; quantity: number }[]) {
  const data = await shopifyFetch<{ cartCreate: { cart: ShopifyCart } }>(
    CREATE_CART,
    { lines: lines ?? [] }
  )
  return data.cartCreate.cart
}

export async function addToCart(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[]
) {
  const data = await shopifyFetch<{ cartLinesAdd: { cart: ShopifyCart } }>(
    ADD_TO_CART,
    { cartId, lines }
  )
  return data.cartLinesAdd.cart
}

export async function updateCartLine(
  cartId: string,
  lines: { id: string; quantity: number }[]
): Promise<{ cart: ShopifyCart | null; userErrors: { field: string[] | null; message: string }[] }> {
  const data = await shopifyFetch<{
    cartLinesUpdate: {
      cart: ShopifyCart | null
      userErrors?: { field: string[] | null; message: string }[]
    }
  }>(UPDATE_CART, { cartId, lines })
  return {
    cart: data.cartLinesUpdate.cart,
    userErrors: data.cartLinesUpdate.userErrors ?? [],
  }
}

export async function removeFromCart(cartId: string, lineIds: string[]) {
  const data = await shopifyFetch<{ cartLinesRemove: { cart: ShopifyCart } }>(
    REMOVE_FROM_CART,
    { cartId, lineIds }
  )
  return data.cartLinesRemove.cart
}

export async function updateCartBuyerIdentity(
  cartId: string,
  buyerIdentity: { customerAccessToken?: string; email?: string }
) {
  const data = await shopifyFetch<{
    cartBuyerIdentityUpdate: { cart: ShopifyCart | null; userErrors: { field: string[] | null; message: string }[] }
  }>(UPDATE_CART_BUYER_IDENTITY, { cartId, buyerIdentity })
  const errs = data.cartBuyerIdentityUpdate.userErrors
  if (errs?.length) throw new Error(errs.map((e) => e.message).join(' | '))
  return data.cartBuyerIdentityUpdate.cart
}

export async function getCart(cartId: string) {
  const data = await shopifyFetch<{ cart: ShopifyCart | null }>(
    GET_CART,
    { cartId }
  )
  return data.cart
}

export async function updateCartAttributes(
  cartId: string,
  attributes: { key: string; value: string }[]
) {
  const data = await shopifyFetch<{ cartAttributesUpdate: { cart: ShopifyCart } }>(
    UPDATE_CART_ATTRIBUTES,
    { cartId, attributes }
  )
  return data.cartAttributesUpdate.cart
}

export async function updateCartDiscountCodes(
  cartId: string,
  discountCodes: string[]
) {
  const data = await shopifyFetch<{
    cartDiscountCodesUpdate: {
      cart: ShopifyCart
      userErrors: { field: string[]; message: string }[]
    }
  }>(UPDATE_CART_DISCOUNT_CODES, { cartId, discountCodes })
  const userErrors = data.cartDiscountCodesUpdate.userErrors
  if (userErrors.length > 0) {
    throw new Error(
      `[updateCartDiscountCodes] ${userErrors.map((e) => e.message).join(' | ')}`
    )
  }
  return data.cartDiscountCodesUpdate.cart
}

// ─── INVENTORY (Admin API — server-only) ─────────────────────

interface AdminInventoryLevel {
  location: { id: string }
  quantities: { name: string; quantity: number }[]
}

interface AdminVariantNode {
  id: string
  title: string
  inventoryItem: {
    id: string
    inventoryLevels: { nodes: AdminInventoryLevel[] }
  }
}

export async function getProductInventoryByLocation(
  productId: string,
  locationId: string
): Promise<{ variantId: string; title: string; available: number }[]> {
  const data = await shopifyAdminFetch<{
    product: { variants: { nodes: AdminVariantNode[] } } | null
  }>(GET_PRODUCT_INVENTORY_BY_LOCATION, { productId })

  if (!data.product) return []

  return data.product.variants.nodes.map((variant) => {
    const level = variant.inventoryItem.inventoryLevels.nodes.find(
      (l) => l.location.id === locationId
    )
    const available = level?.quantities.find((q) => q.name === 'available')?.quantity ?? 0
    return { variantId: variant.id, title: variant.title, available }
  })
}

export async function getInventoryForVariants(
  variantIds: string[],
  locationId: string
): Promise<Record<string, number>> {
  const data = await shopifyAdminFetch<{
    nodes: (AdminVariantNode | null)[]
  }>(GET_INVENTORY_FOR_VARIANTS, { variantIds })

  const result: Record<string, number> = {}
  for (const node of data.nodes) {
    if (!node) continue
    const level = node.inventoryItem.inventoryLevels.nodes.find(
      (l) => l.location.id === locationId
    )
    result[node.id] = level?.quantities.find((q) => q.name === 'available')?.quantity ?? 0
  }
  return result
}
