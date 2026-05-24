/**
 * POST /api/loyalty/customers/upsert
 *
 * Cree ou recupere un loyalty_customer par telephone (E.164).
 * Genere un referral_code unique au premier insert.
 *
 * Sprint L3 extension :
 *   - Si nouveau customer (isNew=true) : best-effort creation du code Shopify
 *     correspondant au referral_code (parrain remise filleul -5 €).
 *   - L'echec n'empeche pas l'inscription, mais est trace dans
 *     loyalty_customers.shopify_referral_discount_last_error + log Vercel pour
 *     que tu puisses reparer manuellement plus tard (cf. view
 *     loyalty_customers_with_failed_referral_code).
 *
 * Validation Zod + libphonenumber-js (E.164).
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { normalizeToE164 } from '@/lib/loyalty/phone'
import { isValidReferralCode } from '@/lib/loyalty/calculate'
import { upsertLoyaltyCustomer } from '@/lib/loyalty/upsert-customer'
import { createReferralDiscountCode } from '@/lib/shopify/loyalty-discounts'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BodySchema = z.object({
  phone: z.string().min(5).max(32),
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().max(120).optional().nullable(),
  email: z.string().trim().email().max(254).optional().nullable(),
  shopifyCustomerId: z.string().trim().max(200).optional().nullable(),
  referredByCode: z.string().trim().max(20).optional().nullable(),
  emailOptIn: z.boolean().optional(),
  source: z.enum(['in_store', 'online', 'import_legacy']).optional(),
})

/**
 * Best-effort : cree le code Shopify et persiste l'ID dans loyalty_customers.
 * Si echec, on persiste l'erreur pour pouvoir reparer plus tard.
 * Ne throw jamais — l'inscription doit reussir meme si Shopify est down.
 */
async function tryCreateReferralCodeShopify(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  customerId: string,
  referralCode: string,
  email: string | null
): Promise<void> {
  const attemptAt = new Date().toISOString()
  try {
    const shopifyId = await createReferralDiscountCode({
      referralCode,
      parrainEmail: email,
    })
    await supabase
      .from('loyalty_customers')
      .update({
        shopify_referral_discount_id: shopifyId,
        shopify_referral_discount_last_error: null,
        shopify_referral_discount_last_attempt_at: attemptAt,
      })
      .eq('id', customerId)
    console.log(`[upsert customer] code parrain Shopify cree : ${referralCode} → ${shopifyId}`)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'unknown error'
    console.error(
      `[upsert customer] ECHEC creation code parrain Shopify pour customer=${customerId} code=${referralCode} : ${errorMessage}. A reparer via la view loyalty_customers_with_failed_referral_code.`
    )
    // Persister l'erreur pour audit + retry futur
    await supabase
      .from('loyalty_customers')
      .update({
        shopify_referral_discount_last_error: errorMessage.slice(0, 1000),
        shopify_referral_discount_last_attempt_at: attemptAt,
      })
      .eq('id', customerId)
      .then(() => {})
      .catch((dbErr: unknown) => {
        console.error('[upsert customer] failed to persist error:', dbErr)
      })
  }
}

export async function POST(req: Request) {
  let parsed: z.infer<typeof BodySchema>
  try {
    const body = await req.json()
    parsed = BodySchema.parse(body)
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: err instanceof Error ? err.message : 'parse error' },
      { status: 400 }
    )
  }

  const e164 = normalizeToE164(parsed.phone)
  if (!e164) {
    return NextResponse.json(
      { error: 'invalid_phone', detail: 'Numero invalide ou pays non detectable.' },
      { status: 400 }
    )
  }

  if (parsed.referredByCode && !isValidReferralCode(parsed.referredByCode)) {
    return NextResponse.json(
      { error: 'invalid_referral_code', detail: 'Format attendu : BS-XXXXX.' },
      { status: 400 }
    )
  }

  try {
    const supabase = getLoyaltyAdminClient()
    const result = await upsertLoyaltyCustomer(supabase, {
      phone: e164,
      firstName: parsed.firstName,
      lastName: parsed.lastName ?? null,
      email: parsed.email ?? null,
      shopifyCustomerId: parsed.shopifyCustomerId ?? null,
      referredByCode: parsed.referredByCode ?? null,
      emailOptIn: parsed.emailOptIn ?? false,
      source: parsed.source ?? 'online',
    })

    // L3 : best-effort code parrain Shopify pour les nouveaux customers
    // ATTENDRE la fin pour que les tests soient deterministes ;
    // en production l'overhead reste < 1s.
    if (result.isNew) {
      await tryCreateReferralCodeShopify(supabase, result.id, result.referralCode, result.email)
    }

    return NextResponse.json({
      ok: true,
      customer: {
        id: result.id,
        phone: result.phone,
        email: result.email,
        firstName: result.firstName,
        referralCode: result.referralCode,
        loyaltyBalanceCents: result.loyaltyBalanceCents,
        isNew: result.isNew,
      },
    })
  } catch (err) {
    console.error('[upsert customer] error:', err)
    return NextResponse.json(
      { error: 'upsert_failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    )
  }
}
