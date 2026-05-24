/**
 * POST /api/loyalty/shopify-webhook
 *
 * Webhook Shopify orders/paid → finalize_order_loyalty.
 *
 * Sprint L3 : interpretation des codes de reduction utilises.
 *
 * Flow :
 *   1. RAW body + HMAC SHA256 → 401 si invalide
 *   2. Parser le payload → phone E.164, sous-total cents, discount_codes[]
 *   3. Si pas de phone : marquer order processed + 200 (skip propre)
 *   4. Lookup loyalty_customer par phone. Si absent : pareil skip.
 *   5. Pour chaque code utilise : lookup parrain (loyalty_customers.referral_code)
 *      + lookup redemption (loyalty_redemptions.discount_code de cet acheteur, 'reserved')
 *   6. interpretDiscountCodes → { referredByCodeUsed, spentLoyaltyCents, appliedRedemptionId }
 *   7. Appeler finalizeOrderLoyalty(channel='online', ...)
 *   8. Si appliedRedemptionId : update loyalty_redemptions SET status='applied', shopify_order_id
 *
 * Idempotence cote Postgres via loyalty_processed_orders.
 */
import { NextResponse } from 'next/server'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { verifyShopifyHmac } from '@/lib/loyalty/verify-hmac'
import { parseShopifyOrder } from '@/lib/loyalty/parse-shopify-order'
import { finalizeOrderLoyalty } from '@/lib/loyalty/finalize'
import {
  interpretDiscountCodes,
  type ReferralCodeLookup,
  type RedemptionLookup,
} from '@/lib/loyalty/interpret-discount-codes'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const rawBody = await req.text()
  const hmacHeader = req.headers.get('x-shopify-hmac-sha256')
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET

  if (!secret) {
    console.error('[loyalty webhook] SHOPIFY_WEBHOOK_SECRET non configure')
    return NextResponse.json({ error: 'webhook_not_configured' }, { status: 500 })
  }

  if (!verifyShopifyHmac({ rawBody, hmacHeader, secret })) {
    console.warn(
      '[loyalty webhook] HMAC invalide. shop=%s topic=%s',
      req.headers.get('x-shopify-shop-domain'),
      req.headers.get('x-shopify-topic')
    )
    return NextResponse.json({ error: 'invalid_hmac' }, { status: 401 })
  }

  let parsed: ReturnType<typeof parseShopifyOrder>
  try {
    const payload = JSON.parse(rawBody)
    parsed = parseShopifyOrder(payload)
  } catch (err) {
    console.error('[loyalty webhook] parse error:', err)
    return NextResponse.json({ error: 'parse_error' }, { status: 400 })
  }

  const supabase = getLoyaltyAdminClient()

  if (!parsed.phoneE164) {
    await supabase
      .from('loyalty_processed_orders')
      .upsert({ shopify_order_id: parsed.shopifyOrderId }, { onConflict: 'shopify_order_id' })
    return NextResponse.json({
      ok: true,
      skip_reason: 'no_phone_on_order',
      shopify_order_id: parsed.shopifyOrderId,
    })
  }

  // Lookup customer par phone
  const { data: customer, error: lookupErr } = await supabase
    .from('loyalty_customers')
    .select('id')
    .eq('phone', parsed.phoneE164)
    .maybeSingle()

  if (lookupErr) {
    console.error('[loyalty webhook] customer lookup error:', lookupErr)
    return NextResponse.json({ error: 'lookup_failed' }, { status: 500 })
  }

  if (!customer) {
    await supabase
      .from('loyalty_processed_orders')
      .upsert({ shopify_order_id: parsed.shopifyOrderId }, { onConflict: 'shopify_order_id' })
    return NextResponse.json({
      ok: true,
      skip_reason: 'customer_not_found',
      shopify_order_id: parsed.shopifyOrderId,
      phone: parsed.phoneE164,
    })
  }

  // ─── L3 : interpretation des codes de reduction ───
  let referralLookups: ReferralCodeLookup[] = []
  let redemptionLookups: RedemptionLookup[] = []

  if (parsed.discountCodes.length > 0) {
    // Lookup parrains (codes BS-* qui appartiennent a un autre customer)
    const { data: parrains } = await supabase
      .from('loyalty_customers')
      .select('id, referral_code')
      .in('referral_code', parsed.discountCodes)
    referralLookups = (parrains ?? []).map((p) => ({
      code: p.referral_code,
      ownerId: p.id,
    }))

    // Lookup redemptions de cet acheteur
    const { data: redemptions } = await supabase
      .from('loyalty_redemptions')
      .select('id, discount_code, amount_cents, status, customer_id')
      .eq('customer_id', customer.id)
      .in('discount_code', parsed.discountCodes)
    redemptionLookups = (redemptions ?? []).map((r) => ({
      code: r.discount_code,
      id: r.id,
      amountCents: r.amount_cents,
      status: r.status as RedemptionLookup['status'],
      customerId: r.customer_id,
    }))
  }

  const interpreted = interpretDiscountCodes({
    discountCodes: parsed.discountCodes,
    buyerCustomerId: customer.id,
    referralLookups,
    redemptionLookups,
  })

  if (interpreted.diagnostics.length > 0) {
    console.log(
      '[loyalty webhook] discount diagnostics for order %s:',
      parsed.shopifyOrderId,
      interpreted.diagnostics
    )
  }

  // ─── Appel finalize (atomique cote Postgres) ───
  try {
    const result = await finalizeOrderLoyalty(supabase, {
      customerId: customer.id,
      orderRef: parsed.shopifyOrderId,
      paidItemsCents: parsed.paidItemsCents,
      spentLoyaltyCents: interpreted.spentLoyaltyCents,
      referredByCodeUsed: interpreted.referredByCodeUsed,
      channel: 'online',
      staffUserId: null,
    })

    // Marquer la redemption appliquee (apres finalize OK, dans le meme contexte)
    if (interpreted.appliedRedemptionId && !result.idempotentSkip) {
      const { error: updateErr } = await supabase
        .from('loyalty_redemptions')
        .update({
          status: 'applied',
          shopify_order_id: parsed.shopifyOrderId,
        })
        .eq('id', interpreted.appliedRedemptionId)
        .eq('status', 'reserved') // defense : ne pas ecraser si deja applied
      if (updateErr) {
        // Non-bloquant pour la reponse webhook, mais loggue
        console.error(
          '[loyalty webhook] failed to mark redemption applied:',
          interpreted.appliedRedemptionId,
          updateErr.message
        )
      }
    }

    return NextResponse.json({ ok: true, result, diagnostics: interpreted.diagnostics })
  } catch (err) {
    console.error('[loyalty webhook] finalize error:', err)
    return NextResponse.json(
      { error: 'finalize_failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    )
  }
}
