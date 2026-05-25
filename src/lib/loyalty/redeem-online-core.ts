/**
 * Orchestration du redeem en ligne (sweep + validate + reserve).
 *
 * Extraite de la route /api/loyalty/redeem-online (L3) pour etre
 * partagee entre la route phone-based L3 (staff/M2M) et la route
 * session-based L4 (/api/loyalty/me/redeem-online).
 *
 * Reste un helper d'orchestration (pas 100% pur : appels DB +
 * Shopify Admin API a travers redemption.ts). La logique metier
 * pure est dans calculate.ts + redemption.ts/validateRedemptionRequest.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  expireOldRedemptions,
  validateRedemptionRequest,
  reserveRedemption,
  type ValidationFailureReason,
} from './redemption'

export interface RedeemInput {
  supabase: SupabaseClient
  customer: { id: string; phone: string; loyaltyBalanceCents: number }
  cartSubtotalCents: number
  requestedAmountCents: number
}

export type RedeemResult =
  | {
      ok: true
      redemption: { discountCode: string; amountCents: number; expiresAt: string }
    }
  | { ok: false; kind: 'validation'; reason: ValidationFailureReason; maxAllowedCents: number }
  | { ok: false; kind: 'reserve'; detail: string }

export async function executeRedeem(input: RedeemInput): Promise<RedeemResult> {
  // Sweep lazy DB-side. Non bloquant (best-effort).
  try {
    await expireOldRedemptions(input.supabase, input.customer.id)
  } catch (err) {
    console.warn('[executeRedeem] expireOldRedemptions failed (non-blocking):', err)
  }

  const validation = validateRedemptionRequest({
    balanceCents: input.customer.loyaltyBalanceCents,
    cartSubtotalCents: input.cartSubtotalCents,
    requestedAmountCents: input.requestedAmountCents,
  })
  if (!validation.ok) {
    return {
      ok: false,
      kind: 'validation',
      reason: validation.reason,
      maxAllowedCents: validation.maxAllowedCents,
    }
  }

  try {
    const reservation = await reserveRedemption(input.supabase, {
      customerId: input.customer.id,
      customerHint: input.customer.phone,
      amountCents: validation.appliedCents,
      cartSubtotalCents: input.cartSubtotalCents,
    })
    return {
      ok: true,
      redemption: {
        discountCode: reservation.discountCode,
        amountCents: reservation.amountCents,
        expiresAt: reservation.expiresAt,
      },
    }
  } catch (err) {
    return {
      ok: false,
      kind: 'reserve',
      detail: err instanceof Error ? err.message : 'unknown',
    }
  }
}
