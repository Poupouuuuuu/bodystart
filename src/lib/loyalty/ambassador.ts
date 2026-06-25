/**
 * Ambassadeurs — helpers purs (testables sans I/O) + wrappers RPC Supabase.
 *
 * Mécanique identique au parrainage (cf. 00010_ambassadors.sql) :
 *   - crédit 10 % du sous-total éligible (après remise -10 %, hors port/taxe)
 *   - cagnotte produit-only (dépensée via code Shopify), jamais en cash
 *   - reprise au remboursement total, idempotence par commande
 * Différences : taux 10 %, min 10 € pour utiliser, expiration 12 mois inactivité.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { normalizeToE164 } from './phone'

// ── Constantes métier ──

/** Taux de cagnotte par défaut (10 %). Surchargeable par ambassadeur (colonne rate). */
export const AMBASSADOR_RATE_DEFAULT = 0.1

/** Solde minimum pour utiliser la cagnotte ambassadeur : 10 € (le parrainage est à 20 €). */
export const AMBASSADOR_REDEEM_MIN_BALANCE_CENTS = 1000

/** Expiration de la cagnotte après N mois sans activité (crédit ou débit). */
export const AMBASSADOR_EXPIRY_MONTHS = 12

/**
 * Tags produit Shopify EXCLUS de l'assiette de commission ambassadeur.
 * VIDE au lancement (aucune exclusion) — on pourra y mettre 'pack', 'iso-zero'…
 * sans re-développer : le webhook bascule alors sur le calcul ligne par ligne.
 */
export const EXCLUDED_AMBASSADOR_PRODUCT_TAGS: string[] = []

// ── Calculs purs ──

/**
 * Commission ambassadeur sur une commande.
 * Base = sous-total produits éligible (cents, entier ≥ 0), après remise et
 * hors lignes exclues. Arrondi à l'inférieur, comme le parrainage.
 */
export function calcAmbassadorCommissionCents(eligibleSubtotalCents: number, rate: number): number {
  if (!Number.isInteger(eligibleSubtotalCents) || eligibleSubtotalCents < 0) return 0
  if (!(rate > 0) || rate > 1) return 0
  return Math.floor(eligibleSubtotalCents * rate)
}

export interface OrderLine {
  /** gid ou id numérique du produit (pour matcher l'exclusion). */
  productId: string | null
  /** Prix de la ligne APRÈS remises allouées, en cents (entier ≥ 0). */
  linePostDiscountCents: number
}

/**
 * Sous-total éligible = somme des lignes NON exclues.
 *
 * `excludedProductIds` = produits dont le tag figure dans
 * EXCLUDED_AMBASSADOR_PRODUCT_TAGS (résolus côté webhook via l'Admin API).
 * Vide → toutes les lignes comptent (= sous-total complet), le « fast path ».
 */
export function computeAmbassadorEligibleCents(
  lines: OrderLine[],
  excludedProductIds: Set<string>
): number {
  return lines.reduce((sum, l) => {
    if (l.productId && excludedProductIds.has(l.productId)) return sum
    const c = l.linePostDiscountCents
    return sum + (Number.isInteger(c) && c > 0 ? c : 0)
  }, 0)
}

/**
 * L'acheteur EST-il l'ambassadeur lui-même ? (anti auto-commission)
 * Comparaison email insensible à la casse + espaces. `false` si l'un manque.
 * NB : un email différent contourne — limite inhérente, documentée (00011) ;
 * le blocage autoritaire reste côté SQL.
 */
export function isAmbassadorSelfPurchase(
  buyerEmail: string | null | undefined,
  ambassadorEmail: string | null | undefined
): boolean {
  if (!buyerEmail || !ambassadorEmail) return false
  return buyerEmail.trim().toLowerCase() === ambassadorEmail.trim().toLowerCase()
}

/**
 * Anti auto-commission étendu : l'acheteur EST-il l'ambassadeur sur EMAIL **OU**
 * TÉLÉPHONE ? Bloque le 2e-compte-même-numéro (autre email, même tél).
 * - Emails : comparés insensibles casse/espaces.
 * - Téléphones : normalisés E.164 (normalizeToE164, gère +33 ↔ 0, retire
 *   espaces/points/tirets). Un téléphone manquant/invalide d'un côté → pas de
 *   match sur le tél (ambassadeur sans tél = email-only, aucune régression).
 */
export function isAmbassadorSelfMatch(
  buyerEmail: string | null | undefined,
  buyerPhone: string | null | undefined,
  ambassadorEmail: string | null | undefined,
  ambassadorPhone: string | null | undefined
): boolean {
  if (isAmbassadorSelfPurchase(buyerEmail, ambassadorEmail)) return true
  const bp = normalizeToE164(buyerPhone ?? '')
  const ap = normalizeToE164(ambassadorPhone ?? '')
  return !!bp && !!ap && bp === ap
}

/** Cap anti-fat-finger pour un ajustement manuel admin : ±1 000 € par opération. */
export const AMBASSADOR_MANUAL_ADJUST_MAX_CENTS = 100000

export interface CagnotteAdjustment {
  valid: boolean
  reason: 'applied' | 'no_change' | 'zero_delta' | 'exceeds_cap'
  requestedDeltaCents: number
  appliedDeltaCents: number
  newBalanceCents: number
  /** true si la déduction a été plafonnée par le plancher 0. */
  capped: boolean
}

/**
 * Calcul PUR d'un ajustement manuel de cagnotte (miroir de la RPC SQL
 * adjust_ambassador_cagnotte, pour l'aperçu UI + les tests). Plancher 0 :
 * le nouveau solde ne descend jamais sous 0 ; la déduction réelle est donc
 * plafonnée au solde. delta = 0 ou hors cap → invalide (pas d'écriture).
 */
export function computeCagnotteAdjustment(
  balanceCents: number,
  deltaCents: number,
  maxCents: number = AMBASSADOR_MANUAL_ADJUST_MAX_CENTS
): CagnotteAdjustment {
  const base = Number.isInteger(balanceCents) && balanceCents > 0 ? balanceCents : 0
  if (!Number.isInteger(deltaCents) || deltaCents === 0) {
    return { valid: false, reason: 'zero_delta', requestedDeltaCents: deltaCents, appliedDeltaCents: 0, newBalanceCents: base, capped: false }
  }
  if (Math.abs(deltaCents) > maxCents) {
    return { valid: false, reason: 'exceeds_cap', requestedDeltaCents: deltaCents, appliedDeltaCents: 0, newBalanceCents: base, capped: false }
  }
  const newBalance = Math.max(0, base + deltaCents)
  const applied = newBalance - base
  const capped = applied !== deltaCents
  if (applied === 0) {
    return { valid: true, reason: 'no_change', requestedDeltaCents: deltaCents, appliedDeltaCents: 0, newBalanceCents: base, capped }
  }
  return { valid: true, reason: 'applied', requestedDeltaCents: deltaCents, appliedDeltaCents: applied, newBalanceCents: newBalance, capped }
}

/** La cagnotte est-elle expirée (≥ 12 mois sans activité) ? */
export function isAmbassadorCagnotteExpired(
  lastActivityAt: string | Date,
  now: Date = new Date()
): boolean {
  const last = typeof lastActivityAt === 'string' ? new Date(lastActivityAt) : lastActivityAt
  if (Number.isNaN(last.getTime())) return false
  const threshold = new Date(now.getTime())
  threshold.setMonth(threshold.getMonth() - AMBASSADOR_EXPIRY_MONTHS)
  return last.getTime() < threshold.getTime()
}

/** Solde réellement utilisable : 0 si expiré ou sous le minimum, sinon le solde. */
export function usableAmbassadorBalanceCents(
  balanceCents: number,
  lastActivityAt: string | Date,
  now: Date = new Date()
): number {
  if (!Number.isInteger(balanceCents) || balanceCents <= 0) return 0
  if (isAmbassadorCagnotteExpired(lastActivityAt, now)) return 0
  if (balanceCents < AMBASSADOR_REDEEM_MIN_BALANCE_CENTS) return 0
  return balanceCents
}

// ── Wrappers RPC (I/O) ──

export interface CreditAmbassadorResult {
  credited: boolean
  reason?: string
  ambassadorId?: string
  commissionCents?: number
  isNewCustomer?: boolean
  newBalanceCents?: number
}

export async function creditAmbassadorCommission(
  supabase: SupabaseClient,
  args: {
    shopifyOrderId: string
    discountCode: string
    eligibleSubtotalCents: number
    isNewCustomer: boolean
    buyerEmail: string | null
    shopifyOrderName?: string | null
    buyerPhone?: string | null
  }
): Promise<CreditAmbassadorResult> {
  const { data, error } = await supabase.rpc('credit_ambassador_commission', {
    p_shopify_order_id: args.shopifyOrderId,
    p_discount_code: args.discountCode,
    p_eligible_subtotal_cents: args.eligibleSubtotalCents,
    p_is_new_customer: args.isNewCustomer,
    p_buyer_email: args.buyerEmail,
    p_shopify_order_name: args.shopifyOrderName ?? null,
    p_buyer_phone: args.buyerPhone ?? null,
  })
  if (error) throw new Error(`[creditAmbassadorCommission] RPC error: ${error.message}`)
  const row = (data ?? {}) as Record<string, unknown>
  return {
    credited: Boolean(row.credited),
    reason: (row.reason as string | undefined) ?? undefined,
    ambassadorId: (row.ambassador_id as string | undefined) ?? undefined,
    commissionCents: row.commission_cents != null ? Number(row.commission_cents) : undefined,
    isNewCustomer: row.is_new_customer != null ? Boolean(row.is_new_customer) : undefined,
    newBalanceCents: row.new_balance_cents != null ? Number(row.new_balance_cents) : undefined,
  }
}

export interface RevokeAmbassadorResult {
  revoked: boolean
  reason?: string
  debitedCents?: number
  ambassadorId?: string
}

export async function revokeAmbassadorCommission(
  supabase: SupabaseClient,
  shopifyOrderId: string
): Promise<RevokeAmbassadorResult> {
  const { data, error } = await supabase.rpc('revoke_ambassador_commission', {
    p_shopify_order_id: shopifyOrderId,
  })
  if (error) throw new Error(`[revokeAmbassadorCommission] RPC error: ${error.message}`)
  const row = (data ?? {}) as Record<string, unknown>
  return {
    revoked: Boolean(row.revoked),
    reason: (row.reason as string | undefined) ?? undefined,
    debitedCents: row.debited_cents != null ? Number(row.debited_cents) : undefined,
    ambassadorId: (row.ambassador_id as string | undefined) ?? undefined,
  }
}

export interface AdjustAmbassadorResult {
  ok: boolean
  reason?: string
  ambassadorId?: string
  requestedDeltaCents?: number
  appliedDeltaCents?: number
  newBalanceCents?: number
  capped?: boolean
  maxCents?: number
}

/** Wrapper RPC ajustement manuel admin (gating fait côté route via requireAdmin). */
export async function adjustAmbassadorCagnotte(
  supabase: SupabaseClient,
  args: { ambassadorId: string; deltaCents: number; reason: string }
): Promise<AdjustAmbassadorResult> {
  const { data, error } = await supabase.rpc('adjust_ambassador_cagnotte', {
    p_ambassador_id: args.ambassadorId,
    p_delta_cents: args.deltaCents,
    p_reason: args.reason,
  })
  if (error) throw new Error(`[adjustAmbassadorCagnotte] RPC error: ${error.message}`)
  const row = (data ?? {}) as Record<string, unknown>
  return {
    ok: Boolean(row.ok),
    reason: (row.reason as string | undefined) ?? undefined,
    ambassadorId: (row.ambassador_id as string | undefined) ?? undefined,
    requestedDeltaCents: row.requested_delta_cents != null ? Number(row.requested_delta_cents) : undefined,
    appliedDeltaCents: row.applied_delta_cents != null ? Number(row.applied_delta_cents) : undefined,
    newBalanceCents: row.new_balance_cents != null ? Number(row.new_balance_cents) : undefined,
    capped: row.capped != null ? Boolean(row.capped) : undefined,
    maxCents: row.max_cents != null ? Number(row.max_cents) : undefined,
  }
}
