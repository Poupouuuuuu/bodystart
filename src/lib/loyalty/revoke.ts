/**
 * Wrapper TS de la fonction Postgres revoke_referral_reward().
 * Appelé au remboursement TOTAL d'une commande de filleul (webhook
 * orders/refunded) : débite la cagnotte du parrain du montant crédité
 * (plancher 0) et passe la referral_rewards en 'revoked'. Idempotent.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export interface RevokeReferralResult {
  revoked: boolean
  reason?: string
  orderRef: string
  debitedCents?: number
  parrainId?: string | null
  parrainNewBalanceCents?: number
}

export async function revokeReferralReward(
  supabase: SupabaseClient,
  shopifyOrderId: string
): Promise<RevokeReferralResult> {
  const { data, error } = await supabase.rpc('revoke_referral_reward', {
    p_shopify_order_id: shopifyOrderId,
  })
  if (error) throw new Error(`[revokeReferralReward] RPC error: ${error.message}`)
  const row = (data ?? {}) as Record<string, unknown>
  return {
    revoked: Boolean(row.revoked),
    reason: (row.reason as string | undefined) ?? undefined,
    orderRef: String(row.order_ref ?? shopifyOrderId),
    debitedCents: row.debited_cents != null ? Number(row.debited_cents) : undefined,
    parrainId: (row.parrain_id as string | null) ?? null,
    parrainNewBalanceCents:
      row.parrain_new_balance_cents != null ? Number(row.parrain_new_balance_cents) : undefined,
  }
}

export interface ReverseLoyaltySpendResult {
  reversed: boolean
  reason?: string
  orderRef: string
  recreditedCents?: number
  customerId?: string | null
}

/**
 * Wrapper de reverse_loyalty_spend() (00017) : re-crédite la cagnotte FIDÉLITÉ
 * dépensée (code LY-) quand la commande est intégralement remboursée —
 * symétrique de reverseAmbassadorSpend. Idempotent ('applied' → 'reversed').
 */
export async function reverseLoyaltySpend(
  supabase: SupabaseClient,
  shopifyOrderId: string
): Promise<ReverseLoyaltySpendResult> {
  const { data, error } = await supabase.rpc('reverse_loyalty_spend', {
    p_shopify_order_id: shopifyOrderId,
  })
  if (error) throw new Error(`[reverseLoyaltySpend] RPC error: ${error.message}`)
  const row = (data ?? {}) as Record<string, unknown>
  return {
    reversed: Boolean(row.reversed),
    reason: (row.reason as string | undefined) ?? undefined,
    orderRef: String(row.order_ref ?? shopifyOrderId),
    recreditedCents: row.recredited_cents != null ? Number(row.recredited_cents) : undefined,
    customerId: (row.customer_id as string | null) ?? null,
  }
}
