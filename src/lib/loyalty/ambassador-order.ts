/**
 * Ambassadeur — parsing commande Shopify + lookups Admin API (côté webhook).
 *
 * Séparé de parse-shopify-order.ts (parrainage, intouché). Fournit :
 *   - parseAmbassadorOrderLines : lignes produit + montant post-remise (pour
 *     l'assiette éligible quand des tags sont exclus).
 *   - isFirstPaidOrderForEmail : flag acquisition (1ʳᵉ commande payée de l'email).
 *   - resolveExcludedProductIds : produits dont le tag est dans la liste exclue
 *     (appelé uniquement si EXCLUDED_AMBASSADOR_PRODUCT_TAGS est non vide).
 */
import { shopifyAdminFetch } from '@/lib/shopify/client'
import { moneyStringToCents } from './parse-shopify-order'
import type { OrderLine } from './ambassador'

interface RawLineItem {
  product_id?: number | string | null
  quantity?: number | null
  price?: string | number | null
  discount_allocations?: Array<{ amount?: string | number | null }> | null
}

/**
 * Lignes produit avec montant net de remise (cents).
 * line net = price * quantity − Σ discount_allocations.
 */
export function parseAmbassadorOrderLines(payload: { line_items?: RawLineItem[] | null }): OrderLine[] {
  return (payload.line_items ?? []).map((li) => {
    const unit = moneyStringToCents(li.price ?? 0)
    const qty = typeof li.quantity === 'number' && li.quantity > 0 ? li.quantity : 1
    const gross = unit * qty
    const discount = (li.discount_allocations ?? []).reduce(
      (s, d) => s + moneyStringToCents(d?.amount ?? 0),
      0
    )
    return {
      productId: li.product_id != null ? String(li.product_id) : null,
      linePostDiscountCents: Math.max(0, gross - discount),
    }
  })
}

/**
 * true si AUCUNE commande payée antérieure n'existe pour cet email
 * (hors la commande courante) → vraie acquisition.
 *
 * Conservateur : email absent ou Admin API en échec → false (on ne revendique
 * pas une acquisition qu'on ne peut pas prouver).
 */
export async function isFirstPaidOrderForEmail(
  email: string | null,
  currentOrderId: string
): Promise<boolean> {
  if (!email) return false
  const QUERY = `
    query AmbassadorPriorOrders($q: String!) {
      orders(first: 10, query: $q) {
        nodes { id }
      }
    }
  `
  try {
    const data = await shopifyAdminFetch<{ orders: { nodes: { id: string }[] } }>(QUERY, {
      // Escape les guillemets de l'email dans la query string Shopify.
      q: `email:"${email.replace(/"/g, '')}" financial_status:paid`,
    })
    const others = data.orders.nodes.filter((o) => {
      const numeric = o.id.split('/').pop() ?? o.id
      return numeric !== currentOrderId
    })
    return others.length === 0
  } catch (err) {
    console.error('[ambassador] isFirstPaidOrderForEmail lookup failed:', err)
    return false
  }
}

/**
 * Résout les product ids dont au moins un tag figure dans `excludedTags`.
 * Appelé UNIQUEMENT si excludedTags est non vide (sinon : fast path, pas d'appel).
 */
export async function resolveExcludedProductIds(
  productIds: string[],
  excludedTags: string[]
): Promise<Set<string>> {
  const excluded = new Set<string>()
  if (excludedTags.length === 0 || productIds.length === 0) return excluded

  const wanted = new Set(excludedTags.map((t) => t.toLowerCase()))
  const QUERY = `
    query AmbassadorProductTags($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Product { id tags }
      }
    }
  `
  try {
    const gids = productIds.map((id) => (id.startsWith('gid://') ? id : `gid://shopify/Product/${id}`))
    const data = await shopifyAdminFetch<{
      nodes: Array<{ id: string; tags: string[] } | null>
    }>(QUERY, { ids: gids })
    for (const node of data.nodes) {
      if (!node) continue
      if ((node.tags ?? []).some((t) => wanted.has(t.toLowerCase()))) {
        excluded.add(node.id.split('/').pop() ?? node.id)
      }
    }
  } catch (err) {
    console.error('[ambassador] resolveExcludedProductIds failed (no exclusion applied):', err)
  }
  return excluded
}
