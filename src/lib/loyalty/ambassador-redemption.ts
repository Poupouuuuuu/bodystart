/**
 * Dépense de la cagnotte AMBASSADEUR — helpers purs + wrappers RPC/Shopify.
 *
 * Calqué sur redemption.ts (fidélité) mais : clé EMAIL (pas téléphone), min 10 €,
 * cap 50 % du panier, code AMB-XXXX usage-unique non combinable. Le solde n'est
 * débité qu'à l'usage réel (webhook orders/paid), jamais à la réservation
 * (anti-fuite : code non utilisé → expire en 1 h). cf. 00013_ambassador_redemptions.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { AMBASSADOR_REDEEM_MIN_BALANCE_CENTS } from './ambassador'
import { createAmbassadorRedemptionDiscountCode } from '@/lib/shopify/loyalty-discounts'

/** TTL d'une réservation : 1 h (aligné sur endsAt du code Shopify). */
export const AMBASSADOR_REDEMPTION_TTL_MS = 60 * 60 * 1000

export type AmbassadorValidationFailureReason =
  | 'insufficient_balance' // solde utilisable < 10 € (inclut cagnotte expirée → 0)
  | 'below_min'            // montant demandé < 10 € (minimum d'utilisation)
  | 'above_balance'        // montant demandé > solde utilisable
  | 'invalid_request'      // montant demandé <= 0 ou non entier

export interface AmbassadorRedemptionRequest {
  /** Solde RÉELLEMENT utilisable (usableAmbassadorBalanceCents → 0 si expiré/<min). */
  usableBalanceCents: number
  requestedAmountCents: number
}

export type ValidateAmbassadorRedemptionResult =
  | { ok: true; appliedCents: number }
  | { ok: false; reason: AmbassadorValidationFailureReason; maxAllowedCents: number }

/**
 * Valide une demande de dépense (pur, sans I/O). L'ambassadeur choisit un montant
 * entre 10 € et son solde utilisable. Le cap 50 % du panier n'est PAS vérifié ici
 * (le panier est inconnu au moment de la réservation depuis l'espace ambassadeur) :
 * il est garanti STRUCTURELLEMENT par le minimum d'achat du code = 2× le montant
 * (cf. createAmbassadorRedemptionDiscountCode) → la remise fixe ne peut jamais
 * dépasser 50 % du panier au checkout.
 */
export function validateAmbassadorRedemption(
  req: AmbassadorRedemptionRequest
): ValidateAmbassadorRedemptionResult {
  const usable = req.usableBalanceCents
  if (!Number.isInteger(req.requestedAmountCents) || req.requestedAmountCents <= 0) {
    return { ok: false, reason: 'invalid_request', maxAllowedCents: Math.max(0, usable) }
  }
  if (!Number.isInteger(usable) || usable < AMBASSADOR_REDEEM_MIN_BALANCE_CENTS) {
    return { ok: false, reason: 'insufficient_balance', maxAllowedCents: 0 }
  }
  if (req.requestedAmountCents < AMBASSADOR_REDEEM_MIN_BALANCE_CENTS) {
    return { ok: false, reason: 'below_min', maxAllowedCents: usable }
  }
  if (req.requestedAmountCents > usable) {
    return { ok: false, reason: 'above_balance', maxAllowedCents: usable }
  }
  return { ok: true, appliedCents: req.requestedAmountCents }
}

// ── I/O ──

/** Sweep lazy : passe les réservations 'reserved' expirées en 'expired'. */
export async function expireOldAmbassadorRedemptions(
  supabase: SupabaseClient,
  ambassadorId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('ambassador_redemptions')
    .update({ status: 'expired' })
    .eq('ambassador_id', ambassadorId)
    .eq('status', 'reserved')
    .lt('expires_at', new Date().toISOString())
    .select('id')
  if (error) throw new Error(`[expireOldAmbassadorRedemptions] ${error.message}`)
  return data?.length ?? 0
}

export interface ReservedAmbassadorRedemption {
  id: string
  discountCode: string
  shopifyDiscountNodeId: string
  amountCents: number
  expiresAt: string
}

/**
 * Réserve : crée le code Shopify AMB- D'ABORD, puis l'insert DB (même ordre
 * anti-fuite que la fidélité : si la DB échoue, le code orphelin expire en 1 h).
 * NE valide PAS les bornes (caller : validateAmbassadorRedemption).
 */
export async function reserveAmbassadorRedemption(
  supabase: SupabaseClient,
  input: { ambassadorId: string; ambassadorEmail: string; amountCents: number }
): Promise<ReservedAmbassadorRedemption> {
  const expiresAt = new Date(Date.now() + AMBASSADOR_REDEMPTION_TTL_MS)
  const { shopifyDiscountNodeId, discountCode } = await createAmbassadorRedemptionDiscountCode({
    ambassadorHint: input.ambassadorEmail,
    amountCents: input.amountCents,
    expiresAt,
  })
  const { data, error } = await supabase
    .from('ambassador_redemptions')
    .insert({
      ambassador_id: input.ambassadorId,
      amount_cents: input.amountCents,
      discount_code: discountCode,
      shopify_discount_node_id: shopifyDiscountNodeId,
      status: 'reserved',
      expires_at: expiresAt.toISOString(),
    })
    .select('id, discount_code, shopify_discount_node_id, amount_cents, expires_at')
    .single()
  if (error || !data) {
    console.error('[reserveAmbassadorRedemption] DB insert failed after Shopify create, orphan code:', discountCode, 'gid:', shopifyDiscountNodeId, 'error:', error?.message)
    throw new Error(`[reserveAmbassadorRedemption] DB insert failed: ${error?.message ?? 'unknown'}`)
  }
  return {
    id: data.id,
    discountCode: data.discount_code,
    shopifyDiscountNodeId: data.shopify_discount_node_id,
    amountCents: data.amount_cents,
    expiresAt: data.expires_at,
  }
}

export interface SpendAmbassadorResult {
  spent: boolean
  reason?: string
  debitedCents?: number
  newBalanceCents?: number
}

/** Débit à l'usage réel (orders/paid). Idempotent côté SQL. */
export async function spendAmbassadorCagnotte(
  supabase: SupabaseClient,
  args: { shopifyOrderId: string; discountCode: string; appliedAmountCents: number }
): Promise<SpendAmbassadorResult> {
  const { data, error } = await supabase.rpc('spend_ambassador_cagnotte', {
    p_shopify_order_id: args.shopifyOrderId,
    p_discount_code: args.discountCode,
    p_applied_amount_cents: args.appliedAmountCents,
  })
  if (error) throw new Error(`[spendAmbassadorCagnotte] RPC error: ${error.message}`)
  const row = (data ?? {}) as Record<string, unknown>
  return {
    spent: Boolean(row.spent),
    reason: (row.reason as string | undefined) ?? undefined,
    debitedCents: row.debited_cents != null ? Number(row.debited_cents) : undefined,
    newBalanceCents: row.new_balance_cents != null ? Number(row.new_balance_cents) : undefined,
  }
}

export interface ReverseAmbassadorSpendResult {
  reversed: boolean
  reason?: string
  recreditedCents?: number
}

/** Reprise au remboursement/annulation. Idempotent. */
export async function reverseAmbassadorSpend(
  supabase: SupabaseClient,
  shopifyOrderId: string
): Promise<ReverseAmbassadorSpendResult> {
  const { data, error } = await supabase.rpc('reverse_ambassador_spend', {
    p_shopify_order_id: shopifyOrderId,
  })
  if (error) throw new Error(`[reverseAmbassadorSpend] RPC error: ${error.message}`)
  const row = (data ?? {}) as Record<string, unknown>
  return {
    reversed: Boolean(row.reversed),
    reason: (row.reason as string | undefined) ?? undefined,
    recreditedCents: row.recredited_cents != null ? Number(row.recredited_cents) : undefined,
  }
}
