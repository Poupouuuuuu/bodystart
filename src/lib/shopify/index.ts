import { cache } from 'react'
import { shopifyFetch, shopifyAdminFetch } from './client'
import {
  GET_PRODUCTS,
  GET_PRODUCT_BY_HANDLE,
  GET_FEATURED_PRODUCTS,
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
  ADD_CART_DELIVERY_ADDRESSES,
  REMOVE_CART_DELIVERY_ADDRESSES,
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

// ─── PRODUITS ────────────────────────────────────────────────

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
  return data.products
}

export async function searchProducts(query: string, first = 24) {
  const data = await shopifyFetch<{ products: { nodes: ShopifyProduct[] } }>(
    SEARCH_PRODUCTS,
    { query, first }
  )
  return data.products.nodes
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
  return data.product
})

export const getFeaturedProducts = cache(async (): Promise<ShopifyProduct[]> => {
  // 8 meilleures ventes avec composants de bundle (cf. GET_FEATURED_PRODUCTS).
  try {
    const data = await shopifyFetch<{ products: { nodes: ShopifyProduct[] } }>(
      GET_FEATURED_PRODUCTS
    )
    return data.products.nodes
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

// ─── Mondial Relay : adresses de livraison du cart ───────────
// Input CartSelectableAddressInput (Storefront 2024-04).
export interface CartSelectableAddressInput {
  address: {
    deliveryAddress: {
      company?: string
      address1?: string
      address2?: string
      city?: string
      zip?: string
      countryCode?: string
      firstName?: string
      lastName?: string
      provinceCode?: string
      phone?: string
    }
  }
  selected?: boolean
  oneTimeUse?: boolean
  validationStrategy?: 'COUNTRY_CODE_ONLY' | 'STRICT'
}

export async function addCartDeliveryAddresses(
  cartId: string,
  addresses: CartSelectableAddressInput[]
) {
  const data = await shopifyFetch<{
    cartDeliveryAddressesAdd: {
      cart: ShopifyCart
      userErrors: { field: string[]; message: string }[]
    }
  }>(ADD_CART_DELIVERY_ADDRESSES, { cartId, addresses })
  const userErrors = data.cartDeliveryAddressesAdd.userErrors
  if (userErrors?.length > 0) {
    throw new Error(`[addCartDeliveryAddresses] ${userErrors.map((e) => e.message).join(' | ')}`)
  }
  return data.cartDeliveryAddressesAdd.cart
}

export async function removeCartDeliveryAddresses(cartId: string, addressIds: string[]) {
  const data = await shopifyFetch<{
    cartDeliveryAddressesRemove: {
      cart: ShopifyCart
      userErrors: { field: string[]; message: string }[]
    }
  }>(REMOVE_CART_DELIVERY_ADDRESSES, { cartId, addressIds })
  const userErrors = data.cartDeliveryAddressesRemove.userErrors
  if (userErrors?.length > 0) {
    throw new Error(`[removeCartDeliveryAddresses] ${userErrors.map((e) => e.message).join(' | ')}`)
  }
  return data.cartDeliveryAddressesRemove.cart
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
