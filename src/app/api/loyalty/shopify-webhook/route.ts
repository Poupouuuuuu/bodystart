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
import {
  creditAmbassadorCommission,
  computeAmbassadorEligibleCents,
  isAmbassadorSelfPurchase,
  EXCLUDED_AMBASSADOR_PRODUCT_TAGS,
} from '@/lib/loyalty/ambassador'
import {
  parseAmbassadorOrderLines,
  isFirstPaidOrderForEmail,
  resolveExcludedProductIds,
} from '@/lib/loyalty/ambassador-order'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Bloc ambassadeur — INDÉPENDANT du parrainage (l'acheteur d'un influenceur
 * n'est pas forcément membre loyalty : aucune dépendance au téléphone). Crédite
 * 10 % à l'ambassadeur dont le code Shopify a été utilisé. Idempotent côté SQL
 * (UNIQUE shopify_order_id). Best-effort : ne fait jamais échouer le webhook.
 */
async function processAmbassadorCommission(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  parsed: { shopifyOrderId: string; email: string | null; discountCodes: string[]; paidItemsCents: number }
): Promise<unknown> {
  if (parsed.discountCodes.length === 0) return { ambassador: 'no_codes' }

  // Le(s) code(s) de la commande correspondent-ils à un ambassadeur actif ?
  const { data: ambassadors } = await supabase
    .from('ambassadors')
    .select('shopify_discount_code, email')
    .eq('active', true)
  // Normalisation trim + casse des DEUX côtés : le code commande (déjà trim par
  // parseShopifyOrder) et le code stocké côté ambassadeur (défense contre un
  // espace parasite saisi à la main dans Supabase). cf. SQL: lower(btrim(...)).
  const activeByLower = new Map<string, { code: string; email: string }>(
    (ambassadors ?? []).map((a: { shopify_discount_code: string; email: string }) => [
      a.shopify_discount_code.trim().toLowerCase(),
      { code: a.shopify_discount_code, email: a.email },
    ])
  )
  const matched = parsed.discountCodes
    .map((c) => activeByLower.get(c.trim().toLowerCase()))
    .find((m): m is { code: string; email: string } => !!m)
  if (!matched) return { ambassador: 'no_match' }
  const matchedCode = matched.code

  // Anti auto-commission : l'acheteur EST l'ambassadeur (même email) → on saute
  // (le SQL bloque aussi, mais ici on évite l'appel Admin API is_new_customer).
  if (isAmbassadorSelfPurchase(parsed.email, matched.email)) {
    return { ambassador: 'self_purchase' }
  }

  // Assiette éligible : fast path = sous-total complet (aucune exclusion au
  // lancement). Si des tags sont exclus → calcul ligne par ligne.
  let eligibleCents = parsed.paidItemsCents
  if (EXCLUDED_AMBASSADOR_PRODUCT_TAGS.length > 0) {
    const lines = parseAmbassadorOrderLines(payload)
    const excludedIds = await resolveExcludedProductIds(
      lines.map((l) => l.productId).filter((id): id is string => !!id),
      EXCLUDED_AMBASSADOR_PRODUCT_TAGS
    )
    eligibleCents = computeAmbassadorEligibleCents(lines, excludedIds)
  }

  const isNewCustomer = await isFirstPaidOrderForEmail(parsed.email, parsed.shopifyOrderId)

  return creditAmbassadorCommission(supabase, {
    shopifyOrderId: parsed.shopifyOrderId,
    discountCode: matchedCode,
    eligibleSubtotalCents: eligibleCents,
    isNewCustomer,
    buyerEmail: parsed.email,
  })
}

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

  // ─── Bloc ambassadeur (AVANT tout skip : indépendant du parrainage/phone) ───
  let ambassadorResult: unknown = { ambassador: 'skipped' }
  try {
    ambassadorResult = await processAmbassadorCommission(supabase, JSON.parse(rawBody), parsed)
  } catch (err) {
    // Best-effort : on logge mais on ne casse pas le webhook (le parrainage doit
    // continuer, et Shopify ne doit pas rejouer indéfiniment pour ça).
    console.error('[loyalty webhook] ambassador processing error:', err)
    ambassadorResult = { ambassador: 'error', detail: err instanceof Error ? err.message : 'unknown' }
  }

  if (!parsed.phoneE164) {
    await supabase
      .from('loyalty_processed_orders')
      .upsert({ shopify_order_id: parsed.shopifyOrderId }, { onConflict: 'shopify_order_id' })
    return NextResponse.json({
      ok: true,
      skip_reason: 'no_phone_on_order',
      shopify_order_id: parsed.shopifyOrderId,
      ambassador: ambassadorResult,
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
      ambassador: ambassadorResult,
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

    return NextResponse.json({ ok: true, result, diagnostics: interpreted.diagnostics, ambassador: ambassadorResult })
  } catch (err) {
    console.error('[loyalty webhook] finalize error:', err)
    return NextResponse.json(
      { error: 'finalize_failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    )
  }
}
