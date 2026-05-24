/**
 * Upsert d'un client loyalty par telephone (cle d'identite).
 * Genere un referral_code unique au 1er insert (boucle de retry sur conflit
 * UNIQUE — extremement rare vu l'espace 31^5 ≈ 28M).
 *
 * Comportement :
 *   - Si phone existe deja : update les champs fournis (first_name, last_name,
 *     email, shopify_customer_id, email_opt_in) SANS jamais toucher au solde
 *     ni au referral_code ni au referred_by_code (immuable apres inscription).
 *   - Si phone n'existe pas : insert avec referral_code genere, source explicite.
 *
 * Le solde (loyalty_balance_cents) est uniquement mute par finalize_order_loyalty.
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { generateReferralCode, isValidReferralCode } from './calculate'

const MAX_REFERRAL_CODE_RETRIES = 8

export type LoyaltyCustomerSource = 'in_store' | 'online' | 'import_legacy'

export interface UpsertLoyaltyCustomerInput {
  phone: string // doit etre E.164 (validation en amont via phone.ts)
  firstName: string
  lastName?: string | null
  email?: string | null
  shopifyCustomerId?: string | null
  referredByCode?: string | null // BS-XXXXX si l'utilisateur s'inscrit via un code parrain
  emailOptIn?: boolean
  source?: LoyaltyCustomerSource
}

export interface UpsertedLoyaltyCustomer {
  id: string
  phone: string
  email: string | null
  firstName: string
  lastName: string | null
  referralCode: string
  referredByCode: string | null
  loyaltyBalanceCents: number
  hasFirstPurchase: boolean
  source: LoyaltyCustomerSource
  isNew: boolean
}

/**
 * Pure helper exporte pour faciliter les tests : on peut ainsi tester
 * la generation de payload independamment de l'appel Supabase.
 */
export function buildInsertPayload(input: UpsertLoyaltyCustomerInput, referralCode: string) {
  const referredByCode =
    input.referredByCode && isValidReferralCode(input.referredByCode)
      ? input.referredByCode
      : null

  return {
    phone: input.phone,
    first_name: input.firstName,
    last_name: input.lastName ?? null,
    email: input.email ?? null,
    shopify_customer_id: input.shopifyCustomerId ?? null,
    referral_code: referralCode,
    referred_by_code: referredByCode,
    email_opt_in: input.emailOptIn ?? false,
    source: input.source ?? 'online',
  }
}

export async function upsertLoyaltyCustomer(
  supabase: SupabaseClient,
  input: UpsertLoyaltyCustomerInput
): Promise<UpsertedLoyaltyCustomer> {
  // 1. Lookup existant par phone (UNIQUE) — la cle d'identite
  const { data: existing, error: lookupErr } = await supabase
    .from('loyalty_customers')
    .select(
      'id, phone, email, first_name, last_name, referral_code, referred_by_code, loyalty_balance_cents, has_first_purchase, source'
    )
    .eq('phone', input.phone)
    .maybeSingle()

  if (lookupErr) {
    throw new Error(`[upsertLoyaltyCustomer] lookup error: ${lookupErr.message}`)
  }

  if (existing) {
    // Update minimal : on ne touche jamais au solde ni au referral_code.
    const updatePatch: Record<string, unknown> = {}
    if (input.firstName && input.firstName !== existing.first_name) {
      updatePatch.first_name = input.firstName
    }
    if (input.lastName !== undefined && input.lastName !== existing.last_name) {
      updatePatch.last_name = input.lastName
    }
    if (input.email !== undefined && input.email !== existing.email) {
      updatePatch.email = input.email
    }
    if (input.shopifyCustomerId !== undefined) {
      updatePatch.shopify_customer_id = input.shopifyCustomerId
    }
    if (input.emailOptIn !== undefined) {
      updatePatch.email_opt_in = input.emailOptIn
    }

    if (Object.keys(updatePatch).length > 0) {
      const { error: updateErr } = await supabase
        .from('loyalty_customers')
        .update(updatePatch)
        .eq('id', existing.id)
      if (updateErr) {
        throw new Error(`[upsertLoyaltyCustomer] update error: ${updateErr.message}`)
      }
    }

    return {
      id: existing.id,
      phone: existing.phone,
      email: 'email' in updatePatch ? (updatePatch.email as string | null) : existing.email,
      firstName: (updatePatch.first_name as string | undefined) ?? existing.first_name,
      lastName: 'last_name' in updatePatch ? (updatePatch.last_name as string | null) : existing.last_name,
      referralCode: existing.referral_code,
      referredByCode: existing.referred_by_code,
      loyaltyBalanceCents: existing.loyalty_balance_cents,
      hasFirstPurchase: existing.has_first_purchase,
      source: existing.source as LoyaltyCustomerSource,
      isNew: false,
    }
  }

  // 2. Insert nouveau : retry sur conflit referral_code (probabilite quasi-nulle)
  let lastError: Error | null = null
  for (let attempt = 0; attempt < MAX_REFERRAL_CODE_RETRIES; attempt++) {
    const referralCode = generateReferralCode()
    const payload = buildInsertPayload(input, referralCode)

    const { data: inserted, error: insertErr } = await supabase
      .from('loyalty_customers')
      .insert(payload)
      .select(
        'id, phone, email, first_name, last_name, referral_code, referred_by_code, loyalty_balance_cents, has_first_purchase, source'
      )
      .single()

    if (!insertErr && inserted) {
      return {
        id: inserted.id,
        phone: inserted.phone,
        email: inserted.email,
        firstName: inserted.first_name,
        lastName: inserted.last_name,
        referralCode: inserted.referral_code,
        referredByCode: inserted.referred_by_code,
        loyaltyBalanceCents: inserted.loyalty_balance_cents,
        hasFirstPurchase: inserted.has_first_purchase,
        source: inserted.source as LoyaltyCustomerSource,
        isNew: true,
      }
    }

    lastError = new Error(insertErr?.message ?? 'unknown insert error')

    // Code Postgres 23505 = unique_violation. Si c'est sur le referral_code,
    // on retry. Si c'est sur le phone (race condition entre lookup et insert),
    // on sort de la boucle et fait un 2eme lookup.
    if (insertErr?.code === '23505') {
      if (insertErr.message?.includes('referral_code') || insertErr.message?.includes('idx_loyalty_customers_referral_code')) {
        continue // collision referral_code, retry avec nouveau code
      }
      // Autre conflit (phone, email) → retry du lookup pour eviter double-insert
      const { data: raceCheck } = await supabase
        .from('loyalty_customers')
        .select(
          'id, phone, email, first_name, last_name, referral_code, referred_by_code, loyalty_balance_cents, has_first_purchase, source'
        )
        .eq('phone', input.phone)
        .maybeSingle()
      if (raceCheck) {
        return {
          id: raceCheck.id,
          phone: raceCheck.phone,
          email: raceCheck.email,
          firstName: raceCheck.first_name,
          lastName: raceCheck.last_name,
          referralCode: raceCheck.referral_code,
          referredByCode: raceCheck.referred_by_code,
          loyaltyBalanceCents: raceCheck.loyalty_balance_cents,
          hasFirstPurchase: raceCheck.has_first_purchase,
          source: raceCheck.source as LoyaltyCustomerSource,
          isNew: false,
        }
      }
    }

    // Erreur autre que collision : on throw
    throw new Error(`[upsertLoyaltyCustomer] insert error: ${lastError.message}`)
  }

  throw new Error(
    `[upsertLoyaltyCustomer] referral_code collision after ${MAX_REFERRAL_CODE_RETRIES} retries (last: ${lastError?.message})`
  )
}
