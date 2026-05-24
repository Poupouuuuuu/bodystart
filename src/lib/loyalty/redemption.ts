/**
 * Logique de reservation cagnotte en ligne (spec V2 §5 methode A).
 *
 * Flow :
 *   1. validateRedemptionRequest : valide les bornes (min 20€, cap 50%).
 *   2. expireOldRedemptions : sweep lazy DB-side.
 *   3. reserveRedemption : cree le code Shopify (endsAt 1h) + insert
 *      loyalty_redemptions(status='reserved').
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { maxRedeemableCents, REDEEM_MIN_BALANCE_CENTS } from './calculate'
import { createRedemptionDiscountCode } from '@/lib/shopify/loyalty-discounts'

export const REDEMPTION_TTL_MS = 60 * 60 * 1000 // 1h

export type ValidateRedemptionResult =
  | { ok: true; appliedCents: number }
  | { ok: false; reason: ValidationFailureReason; maxAllowedCents: number }

export type ValidationFailureReason =
  | 'insufficient_balance' // solde < 20 €
  | 'invalid_cart'         // panier <= 0 ou non entier
  | 'invalid_request'      // amount demande <= 0 ou non entier
  | 'above_cap'            // amount demande > maxRedeemable

export interface RedemptionRequest {
  balanceCents: number
  cartSubtotalCents: number
  requestedAmountCents: number
}

/**
 * Fonction PURE : valide une demande de redemption contre les regles metier.
 * Pas d'effet de bord. Testable independamment.
 */
export function validateRedemptionRequest(req: RedemptionRequest): ValidateRedemptionResult {
  const max = maxRedeemableCents(req.cartSubtotalCents, req.balanceCents)

  if (!Number.isInteger(req.cartSubtotalCents) || req.cartSubtotalCents <= 0) {
    return { ok: false, reason: 'invalid_cart', maxAllowedCents: 0 }
  }
  if (!Number.isInteger(req.requestedAmountCents) || req.requestedAmountCents <= 0) {
    return { ok: false, reason: 'invalid_request', maxAllowedCents: max }
  }
  if (!Number.isInteger(req.balanceCents) || req.balanceCents < REDEEM_MIN_BALANCE_CENTS) {
    return { ok: false, reason: 'insufficient_balance', maxAllowedCents: 0 }
  }
  if (req.requestedAmountCents > max) {
    return { ok: false, reason: 'above_cap', maxAllowedCents: max }
  }
  return { ok: true, appliedCents: req.requestedAmountCents }
}

/**
 * Sweep lazy DB : passe toutes les redemptions 'reserved' expirees en 'expired'
 * pour ce customer. Pas d'appel Shopify ici (le endsAt Shopify gere lui-meme).
 *
 * @returns nombre de lignes mises a jour
 */
export async function expireOldRedemptions(
  supabase: SupabaseClient,
  customerId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('loyalty_redemptions')
    .update({ status: 'expired' })
    .eq('customer_id', customerId)
    .eq('status', 'reserved')
    .lt('expires_at', new Date().toISOString())
    .select('id')

  if (error) {
    throw new Error(`[expireOldRedemptions] ${error.message}`)
  }
  return data?.length ?? 0
}

export interface ReserveRedemptionInput {
  customerId: string
  customerHint: string // pour le title Shopify (phone ou email)
  amountCents: number
  cartSubtotalCents: number
}

export interface ReservedRedemption {
  id: string
  discountCode: string
  shopifyDiscountNodeId: string
  amountCents: number
  expiresAt: string
}

/**
 * Orchestre la reservation cote DB + Shopify.
 *
 * IMPORTANT : on cree le code Shopify D'ABORD, puis l'insert DB.
 *   - Si Shopify echoue : aucune fuite (rien en DB)
 *   - Si DB echoue apres Shopify : code Shopify "orphelin" qui expire dans 1h
 *     (par construction endsAt = now + 1h) → aucune fuite de solde non plus
 *
 * NE FAIT PAS la validation des bornes — caller doit appeler
 * validateRedemptionRequest() en amont.
 *
 * NE FAIT PAS le sweep lazy — caller doit appeler expireOldRedemptions() avant.
 */
export async function reserveRedemption(
  supabase: SupabaseClient,
  input: ReserveRedemptionInput
): Promise<ReservedRedemption> {
  const expiresAt = new Date(Date.now() + REDEMPTION_TTL_MS)

  // 1. Cree le code Shopify (endsAt = expiresAt → barriere anti-fuite)
  const { shopifyDiscountNodeId, discountCode } = await createRedemptionDiscountCode({
    customerHint: input.customerHint,
    amountCents: input.amountCents,
    expiresAt,
    cartSubtotalCents: input.cartSubtotalCents,
  })

  // 2. Insert loyalty_redemptions
  const { data, error } = await supabase
    .from('loyalty_redemptions')
    .insert({
      customer_id: input.customerId,
      amount_cents: input.amountCents,
      discount_code: discountCode,
      shopify_discount_node_id: shopifyDiscountNodeId,
      status: 'reserved',
      expires_at: expiresAt.toISOString(),
    })
    .select('id, discount_code, shopify_discount_node_id, amount_cents, expires_at')
    .single()

  if (error || !data) {
    // Le code Shopify est orphelin mais expirera dans 1h → pas de fuite.
    // On log pour pouvoir le nettoyer manuellement plus tard si besoin.
    console.error(
      '[reserveRedemption] DB insert failed after Shopify create, orphan code:',
      discountCode,
      'gid:',
      shopifyDiscountNodeId,
      'error:',
      error?.message
    )
    throw new Error(`[reserveRedemption] DB insert failed: ${error?.message ?? 'unknown'}`)
  }

  return {
    id: data.id,
    discountCode: data.discount_code,
    shopifyDiscountNodeId: data.shopify_discount_node_id,
    amountCents: data.amount_cents,
    expiresAt: data.expires_at,
  }
}
