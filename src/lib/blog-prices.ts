// ============================================================
// Prix vivants dans les articles du blog
// ============================================================
// Les textes du blog (src/content/blog) n'écrivent plus de prix en dur mais un
// jeton {{prix:<handle>|<prix de repli>}}. Au rendu de l'article (ISR 1 h), le
// jeton devient le prix Shopify du moment : le prix minimum des variantes, comme
// la carte catalogue. Produit introuvable ou Shopify indisponible : le prix de
// repli s'affiche, la phrase reste lisible.
// Pourquoi : le 30/09/2026, 11 des 66 prix cités dans les articles étaient
// périmés (jusqu'à 12 € d'écart avec la fiche produit).

import { getProductByHandle } from '@/lib/shopify'
import type { ShopifyMoney } from '@/lib/shopify/types'
import { formatPrice } from '@/lib/utils'

export const PRICE_TOKEN = /\{\{prix:([a-z0-9-]+)\|([^}]*)\}\}/g

/** handle → prix formaté (« 78,90 € »). */
export type PriceMap = Record<string, string>

type PricedProduct = {
  variants?: { nodes: { price: ShopifyMoney }[] }
  priceRange?: { minVariantPrice: ShopifyMoney }
} | null

function walk(value: unknown, visit: (s: string) => void): void {
  if (typeof value === 'string') visit(value)
  else if (Array.isArray(value)) value.forEach((v) => walk(v, visit))
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => walk(v, visit))
}

function mapStrings(value: unknown, fn: (s: string) => string): unknown {
  if (typeof value === 'string') return fn(value)
  if (Array.isArray(value)) return value.map((v) => mapStrings(v, fn))
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapStrings(v, fn)]))
  }
  return value
}

/** Handles cités par des jetons, sans doublon, dans n'importe quelle structure (objet, tableau, texte). */
export function collectPriceHandles(value: unknown): string[] {
  const out = new Set<string>()
  walk(value, (s) => {
    for (const m of s.matchAll(PRICE_TOKEN)) out.add(m[1])
  })
  return [...out]
}

/** Remplace chaque jeton par le prix connu, sinon par son prix de repli. Structure et types conservés. */
export function resolvePriceTokens<T>(value: T, prices: PriceMap): T {
  return mapStrings(value, (s) =>
    s.replace(PRICE_TOKEN, (_m, handle: string, fallback: string) => prices[handle] ?? fallback.trim())
  ) as T
}

/** Prix minimum des variantes, formaté ; null si le produit est absent ou sans prix. */
export function productMinPrice(product: PricedProduct): string | null {
  if (!product) return null
  const variants = product.variants?.nodes ?? []
  const amounts = variants.map((v) => parseFloat(v.price.amount)).filter(Number.isFinite)
  if (amounts.length > 0) {
    return formatPrice({ amount: String(Math.min(...amounts)), currencyCode: variants[0].price.currencyCode })
  }
  if (product.priceRange?.minVariantPrice) return formatPrice(product.priceRange.minVariantPrice)
  return null
}

/** Prix du moment pour chaque handle trouvé ; les handles inconnus ou en erreur sont simplement absents. */
export async function fetchPriceMap(handles: string[]): Promise<PriceMap> {
  const entries = await Promise.all(
    handles.map(async (handle): Promise<[string, string | null]> => {
      try {
        return [handle, productMinPrice(await getProductByHandle(handle))]
      } catch {
        return [handle, null] // Shopify indisponible : prix de repli
      }
    })
  )
  return Object.fromEntries(entries.filter((e): e is [string, string] => e[1] !== null))
}

/** Article (ou tout objet) avec ses jetons résolus. Ne jette jamais : au pire, les prix de repli. */
export async function withLivePrices<T>(value: T): Promise<T> {
  const handles = collectPriceHandles(value)
  if (handles.length === 0) return value
  return resolvePriceTokens(value, await fetchPriceMap(handles))
}
