/**
 * Wrapper TypeScript de la fonction Postgres finalize_order_loyalty().
 * Appele depuis les routes API :
 *   - /api/loyalty/shopify-webhook (channel='online')
 *   - /api/loyalty/finalize        (channel='in_store')
 *
 * Tous les montants sont en CENTIMES (integer). Le wrapper ne fait que
 * passer les valeurs telles quelles a Postgres + parser la reponse JSONB.
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export type LoyaltyChannel = 'online' | 'in_store'

export interface FinalizeOrderLoyaltyInput {
  customerId: string
  orderRef: string | null
  paidItemsCents: number
  spentLoyaltyCents?: number
  referredByCodeUsed?: string | null
  channel: LoyaltyChannel
  staffUserId?: string | null
}

export interface FinalizeOrderLoyaltyResult {
  customerId: string
  orderRef: string | null
  channel: LoyaltyChannel
  spentCents: number
  commissionToReferrerCents: number
  referrerId: string | null
  isFirstPurchase: boolean
  newBalanceCents: number
  firstPurchaseAt: string | null
  referralCommissionUntil: string | null
  idempotentSkip: boolean
}

/**
 * Appelle la fonction Postgres atomique. Toutes les regles metier sont
 * cote DB (cf. supabase/migrations/00005_finalize_order_loyalty.sql).
 *
 * @throws si la fonction Postgres throw (insufficient_balance, customer not found, ...)
 */
export async function finalizeOrderLoyalty(
  supabase: SupabaseClient,
  input: FinalizeOrderLoyaltyInput
): Promise<FinalizeOrderLoyaltyResult> {
  const { data, error } = await supabase.rpc('finalize_order_loyalty', {
    p_customer_id: input.customerId,
    p_order_ref: input.orderRef,
    p_paid_items_cents: input.paidItemsCents,
    p_spent_loyalty_cents: input.spentLoyaltyCents ?? 0,
    p_referred_by_code_used: input.referredByCodeUsed ?? null,
    p_channel: input.channel,
    p_staff_user_id: input.staffUserId ?? null,
  })

  if (error) {
    throw new Error(`[finalizeOrderLoyalty] RPC error: ${error.message}`)
  }
  if (!data || typeof data !== 'object') {
    throw new Error('[finalizeOrderLoyalty] Empty or invalid RPC response')
  }

  // Le JSONB retourne snake_case ; on remappe en camelCase strict-typed.
  const row = data as Record<string, unknown>
  return {
    customerId: String(row.customer_id ?? ''),
    orderRef: (row.order_ref as string | null) ?? null,
    channel: row.channel as LoyaltyChannel,
    spentCents: Number(row.spent_cents ?? 0),
    commissionToReferrerCents: Number(row.commission_to_referrer_cents ?? 0),
    referrerId: (row.referrer_id as string | null) ?? null,
    isFirstPurchase: Boolean(row.is_first_purchase ?? false),
    newBalanceCents: Number(row.new_balance_cents ?? 0),
    firstPurchaseAt: (row.first_purchase_at as string | null) ?? null,
    referralCommissionUntil: (row.referral_commission_until as string | null) ?? null,
    idempotentSkip: Boolean(row.idempotent_skip ?? false),
  }
}
