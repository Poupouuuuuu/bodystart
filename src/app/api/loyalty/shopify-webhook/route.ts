/**
 * POST /api/loyalty/shopify-webhook
 *
 * Webhook Shopify orders/paid → finalize_order_loyalty.
 *
 * Flow :
 *   1. Lire le RAW body (necessaire pour HMAC).
 *   2. Verifier signature HMAC SHA256 via SHOPIFY_WEBHOOK_SECRET.
 *      Rejeter en 401 si invalide. C'est la frontiere de confiance.
 *   3. Parser le payload → telephone E.164 + sous-total cents + discount codes.
 *   4. Lookup loyalty_customer par phone. Si absent → log + 200 (rien a creer,
 *      Shopify n'a pas notre app loyalty installee chez ce client).
 *   5. Appeler finalizeOrderLoyalty(...) avec channel='online'.
 *      L'idempotence est geree cote Postgres via loyalty_processed_orders.
 *
 * En L2 : on N'EXTRAIT PAS la cagnotte utilisee (spent_loyalty_cents=0).
 *   La methode A (codes Admin API + table loyalty_redemptions) sera ajoutee
 *   au Sprint L3.
 *
 * En L2 : on n'enregistre PAS le code parrain utilise pendant le checkout —
 *   c'est le referred_by_code stocke a l'inscription qui fait foi (UI L4
 *   permettra a un user existant de scanner un code).
 */
import { NextResponse } from 'next/server'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { verifyShopifyHmac } from '@/lib/loyalty/verify-hmac'
import { parseShopifyOrder } from '@/lib/loyalty/parse-shopify-order'
import { finalizeOrderLoyalty } from '@/lib/loyalty/finalize'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // crypto + supabase-js

export async function POST(req: Request) {
  // 1. RAW body (avant tout parsing JSON)
  const rawBody = await req.text()

  // 2. HMAC verification
  const hmacHeader = req.headers.get('x-shopify-hmac-sha256')
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET

  if (!secret) {
    console.error('[loyalty webhook] SHOPIFY_WEBHOOK_SECRET non configure')
    return NextResponse.json({ error: 'webhook_not_configured' }, { status: 500 })
  }

  const validHmac = verifyShopifyHmac({ rawBody, hmacHeader, secret })
  if (!validHmac) {
    console.warn(
      '[loyalty webhook] HMAC invalide. shop=%s topic=%s',
      req.headers.get('x-shopify-shop-domain'),
      req.headers.get('x-shopify-topic')
    )
    return NextResponse.json({ error: 'invalid_hmac' }, { status: 401 })
  }

  // 3. Parse payload
  let parsed: ReturnType<typeof parseShopifyOrder>
  try {
    const payload = JSON.parse(rawBody)
    parsed = parseShopifyOrder(payload)
  } catch (err) {
    console.error('[loyalty webhook] parse error:', err)
    return NextResponse.json({ error: 'parse_error' }, { status: 400 })
  }

  if (!parsed.phoneE164) {
    // Pas de telephone → impossible de matcher un loyalty_customer.
    // On marque l'order comme processed pour eviter les retry inutiles.
    const supabase = getLoyaltyAdminClient()
    await supabase
      .from('loyalty_processed_orders')
      .upsert({ shopify_order_id: parsed.shopifyOrderId }, { onConflict: 'shopify_order_id' })
    return NextResponse.json({
      ok: true,
      skip_reason: 'no_phone_on_order',
      shopify_order_id: parsed.shopifyOrderId,
    })
  }

  // 4. Lookup loyalty_customer par phone
  const supabase = getLoyaltyAdminClient()
  const { data: customer, error: lookupErr } = await supabase
    .from('loyalty_customers')
    .select('id')
    .eq('phone', parsed.phoneE164)
    .maybeSingle()

  if (lookupErr) {
    console.error('[loyalty webhook] lookup error:', lookupErr)
    return NextResponse.json({ error: 'lookup_failed' }, { status: 500 })
  }

  if (!customer) {
    // Pas inscrit → on note l'order traite pour ne pas retry, puis 200.
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

  // 5. Appel finalize (atomique cote Postgres)
  try {
    const result = await finalizeOrderLoyalty(supabase, {
      customerId: customer.id,
      orderRef: parsed.shopifyOrderId,
      paidItemsCents: parsed.paidItemsCents,
      spentLoyaltyCents: 0, // L3 ajoutera le lookup loyalty_redemptions
      referredByCodeUsed: null, // L4 ajoutera la possibilite de saisir un code post-inscription
      channel: 'online',
      staffUserId: null,
    })

    return NextResponse.json({ ok: true, result })
  } catch (err) {
    console.error('[loyalty webhook] finalize error:', err)
    return NextResponse.json(
      { error: 'finalize_failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    )
  }
}
