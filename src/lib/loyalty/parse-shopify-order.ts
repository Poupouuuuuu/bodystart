/**
 * Parsing d'un payload Shopify webhook orders/paid → input loyalty.
 *
 * Doc Shopify : https://shopify.dev/docs/api/admin-rest/2024-04/resources/webhook
 *
 * On extrait UNIQUEMENT ce qui sert au finalize :
 *   - shopify_order_id (id Shopify numerique)
 *   - phone (depuis customer.phone, sinon shipping_address.phone, sinon order.phone)
 *   - email (fallback si phone absent)
 *   - paidItemsCents (subtotal_price en cents — deja post-remise, hors port/taxe)
 *   - discountCodes utilises (pour detecter le code parrain et le code cagnotte)
 *
 * Le wiring metier "code cagnotte → spent_loyalty_cents" est fait dans la
 * route webhook (besoin d'un lookup Supabase sur loyalty_redemptions).
 */
import { normalizeToE164 } from './phone'

export interface ShopifyOrderPayload {
  // Champs utiles (le payload Shopify a beaucoup plus de champs)
  id?: number | string
  email?: string | null
  phone?: string | null
  subtotal_price?: string | number | null
  current_subtotal_price?: string | number | null
  customer?: {
    id?: number | string
    phone?: string | null
    email?: string | null
    first_name?: string | null
    last_name?: string | null
    default_address?: { phone?: string | null } | null
  } | null
  shipping_address?: {
    phone?: string | null
    first_name?: string | null
    last_name?: string | null
  } | null
  billing_address?: {
    phone?: string | null
  } | null
  discount_codes?: Array<{ code?: string | null; amount?: string | number | null; type?: string | null }> | null
}

export interface ParsedShopifyOrder {
  shopifyOrderId: string
  phoneE164: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
  paidItemsCents: number
  discountCodes: string[]
}

/**
 * Convertit "12.50" (Shopify money string) en 1250 (cents). Tolere les nombres.
 * Retourne 0 si input invalide.
 */
export function moneyStringToCents(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  const num = typeof value === 'number' ? value : Number.parseFloat(value)
  if (!Number.isFinite(num) || num < 0) return 0
  return Math.round(num * 100)
}

/**
 * Cherche un telephone valide E.164 dans l'ordre suivant :
 *   customer.phone → customer.default_address.phone → order.phone
 *   → shipping_address.phone → billing_address.phone
 * Retourne null si aucun n'est parsable en E.164.
 */
export function extractPhoneE164(payload: ShopifyOrderPayload): string | null {
  const candidates: Array<string | null | undefined> = [
    payload.customer?.phone,
    payload.customer?.default_address?.phone,
    payload.phone,
    payload.shipping_address?.phone,
    payload.billing_address?.phone,
  ]
  for (const raw of candidates) {
    if (!raw) continue
    const e164 = normalizeToE164(raw)
    if (e164) return e164
  }
  return null
}

/**
 * Parse un payload Shopify orders/paid en entree pour finalize_order_loyalty.
 * Throw si le payload n'a pas d'id de commande (signal qu'on est sur un
 * payload non-conforme).
 */
export function parseShopifyOrder(payload: ShopifyOrderPayload): ParsedShopifyOrder {
  if (payload.id === null || payload.id === undefined) {
    throw new Error('Shopify payload missing order id')
  }
  const shopifyOrderId = String(payload.id)

  const phoneE164 = extractPhoneE164(payload)

  const email = payload.email ?? payload.customer?.email ?? null

  const firstName =
    payload.customer?.first_name ?? payload.shipping_address?.first_name ?? null
  const lastName =
    payload.customer?.last_name ?? payload.shipping_address?.last_name ?? null

  // subtotal_price = total apres remises, hors port + taxes. C'est ce qu'on
  // veut comme base de commission parrain (spec §3 "hors livraison, hors taxe,
  // apres remises et apres deduction de sa propre cagnotte eventuelle").
  // current_subtotal_price (>= API 2022-01) reflete l'etat apres refunds
  // partiels — non pertinent ici car orders/paid se declenche avant tout refund.
  const subtotal = payload.subtotal_price ?? payload.current_subtotal_price ?? null
  const paidItemsCents = moneyStringToCents(subtotal)

  const discountCodes = (payload.discount_codes ?? [])
    .map((d) => d?.code?.trim())
    .filter((c): c is string => typeof c === 'string' && c.length > 0)

  return {
    shopifyOrderId,
    phoneE164,
    email,
    firstName,
    lastName,
    paidItemsCents,
    discountCodes,
  }
}
