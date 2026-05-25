/**
 * Logique pure du preview cagnotte en ligne.
 *
 * Extraite de la route /api/loyalty/preview (L3) pour etre partagee
 * entre la route phone-based L3 (staff/M2M) et la route session-based
 * L4 (/api/loyalty/me/preview).
 *
 * Aucun I/O. Aucune dependance Supabase / Shopify. Testable isolement.
 */
import {
  maxRedeemableCents,
  REDEEM_MIN_BALANCE_CENTS,
  REDEEM_CART_CAP_RATIO,
} from './calculate'

export interface PreviewInput {
  customer: { id: string; loyaltyBalanceCents: number }
  cartSubtotalCents: number
}

export type PreviewReason =
  | 'balance_below_minimum'
  | 'invalid_cart'
  | 'no_redeemable_amount'

export interface PreviewOutput {
  balanceCents: number
  maxRedeemableCents: number
  eligible: boolean
  reason?: PreviewReason
  config: { minBalanceCents: number; cartCapRatio: number }
}

export function buildPreview(input: PreviewInput): PreviewOutput {
  const balanceCents = input.customer.loyaltyBalanceCents
  const max = maxRedeemableCents(input.cartSubtotalCents, balanceCents)
  const eligible = max > 0

  let reason: PreviewReason | undefined
  if (!eligible) {
    if (balanceCents < REDEEM_MIN_BALANCE_CENTS) reason = 'balance_below_minimum'
    else if (input.cartSubtotalCents <= 0) reason = 'invalid_cart'
    else reason = 'no_redeemable_amount'
  }

  return {
    balanceCents,
    maxRedeemableCents: max,
    eligible,
    ...(reason ? { reason } : {}),
    config: {
      minBalanceCents: REDEEM_MIN_BALANCE_CENTS,
      cartCapRatio: REDEEM_CART_CAP_RATIO,
    },
  }
}
