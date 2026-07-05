/**
 * NOTE TOPIC (2026-06-11) : « orders/refunded » n'est PAS un topic Shopify.
 * Ce endpoint est abonné au topic ORDERS_UPDATED (webhook créé via Admin API
 * sous l'app du site) : le payload est la commande complète ; on n'agit que
 * si financial_status === 'refunded' (remboursement TOTAL), et
 * revoke_referral_reward est idempotent → le bruit d'orders/updated est sans effet.
 *
 * POST /api/loyalty/shopify-webhook-refund
 *
 * Webhook Shopify orders/refunded → révocation de la commission parrain.
 *
 * Règle (spec §4) : on ne révoque que sur remboursement TOTAL
 * (financial_status = 'refunded'). Les remboursements PARTIELS
 * ('partially_refunded') sont ignorés (choix le plus simple, documenté).
 *
 * Flow :
 *   1. RAW body + HMAC SHA256 → 401 si invalide.
 *   2. financial_status !== 'refunded' → skip 200.
 *   3. revoke_referral_reward(order_id) : débite le parrain (plancher 0),
 *      passe la referral_rewards en 'revoked'. Idempotent (already_revoked).
 */
import { NextResponse } from 'next/server'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { verifyShopifyHmac } from '@/lib/loyalty/verify-hmac'
import { revokeReferralReward, reverseLoyaltySpend } from '@/lib/loyalty/revoke'
import { revokeAmbassadorCommission } from '@/lib/loyalty/ambassador'
import { reverseAmbassadorSpend } from '@/lib/loyalty/ambassador-redemption'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const rawBody = await req.text()
  const hmacHeader = req.headers.get('x-shopify-hmac-sha256')
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET

  if (!secret) {
    console.error('[loyalty refund webhook] SHOPIFY_WEBHOOK_SECRET non configuré')
    return NextResponse.json({ error: 'webhook_not_configured' }, { status: 500 })
  }
  if (!verifyShopifyHmac({ rawBody, hmacHeader, secret })) {
    return NextResponse.json({ error: 'invalid_hmac' }, { status: 401 })
  }

  let payload: { id?: number | string; financial_status?: string | null }
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'parse_error' }, { status: 400 })
  }

  const orderId = payload?.id != null ? String(payload.id) : null
  if (!orderId) {
    return NextResponse.json({ ok: true, skip_reason: 'no_order_id' })
  }

  const financialStatus = String(payload?.financial_status ?? '')
  if (financialStatus !== 'refunded') {
    return NextResponse.json({
      ok: true,
      skip_reason: 'not_total_refund',
      financial_status: financialStatus,
      order_ref: orderId,
    })
  }

  try {
    const supabase = getLoyaltyAdminClient()
    // Reprise sur les QUATRE leviers — chacun idempotent et keyé par order id :
    //  - revokeReferralReward      : commission parrain (débit parrain)
    //  - revokeAmbassadorCommission: commission ambassadeur (débit ambassadeur)
    //  - reverseAmbassadorSpend    : dépense de cagnotte ambassadeur (re-crédit)
    //  - reverseLoyaltySpend       : dépense de cagnotte FIDÉLITÉ (re-crédit
    //    acheteur, 00017) — asymétrie corrigée : le client qui payait avec sa
    //    cagnotte puis était remboursé perdait ce montant définitivement.
    // NB : commission parrain ET dépense fidélité peuvent coexister sur la
    // même commande (le filleul a payé avec sa cagnotte + code parrain lié).
    const [referral, ambassador, ambassadorSpend, loyaltySpend] = await Promise.all([
      revokeReferralReward(supabase, orderId),
      revokeAmbassadorCommission(supabase, orderId),
      reverseAmbassadorSpend(supabase, orderId),
      reverseLoyaltySpend(supabase, orderId),
    ])
    return NextResponse.json({
      ok: true,
      result: referral,
      ambassador,
      ambassador_spend: ambassadorSpend,
      loyalty_spend: loyaltySpend,
    })
  } catch (err) {
    console.error('[loyalty refund webhook] revoke error:', err)
    return NextResponse.json(
      { error: 'revoke_failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    )
  }
}
