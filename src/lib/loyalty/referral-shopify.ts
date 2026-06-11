/**
 * Création best-effort du code de réduction parrainage côté Shopify
 * (-10 € / min 60 € / 1 fois par client / non cumulable — cf.
 * createReferralDiscountCode). Partagé entre :
 *   - POST /api/loyalty/customers/upsert  (caisse / staff)
 *   - POST /api/loyalty/me/enroll         (inscription en ligne)
 *
 * Idempotent : si le customer a déjà un shopify_referral_discount_id, on ne
 * recrée rien (un client inscrit en boutique puis en ligne garde son code).
 * Ne throw JAMAIS : l'inscription doit réussir même si Shopify est down ;
 * l'échec est persisté (colonnes *_last_error / *_last_attempt_at) et
 * réparable via la vue loyalty_customers_with_failed_referral_code.
 */
import { createReferralDiscountCode } from '@/lib/shopify/loyalty-discounts'

// Client Supabase admin minimal (évite de figer le type généré)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAdmin = any

export async function ensureReferralCodeShopify(
  supabase: SupabaseAdmin,
  customerId: string,
  referralCode: string,
  email: string | null
): Promise<void> {
  const attemptAt = new Date().toISOString()
  try {
    const { data: existing } = await supabase
      .from('loyalty_customers')
      .select('shopify_referral_discount_id')
      .eq('id', customerId)
      .maybeSingle()
    if (existing?.shopify_referral_discount_id) return

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
    console.log(`[referral-shopify] code parrain Shopify cree : ${referralCode} → ${shopifyId}`)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'unknown error'
    console.error(
      `[referral-shopify] ECHEC creation code parrain Shopify pour customer=${customerId} code=${referralCode} : ${errorMessage}. A reparer via la view loyalty_customers_with_failed_referral_code.`
    )
    try {
      await supabase
        .from('loyalty_customers')
        .update({
          shopify_referral_discount_last_error: errorMessage.slice(0, 1000),
          shopify_referral_discount_last_attempt_at: attemptAt,
        })
        .eq('id', customerId)
    } catch (dbErr) {
      console.error('[referral-shopify] failed to persist error:', dbErr)
    }
  }
}
