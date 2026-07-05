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
 *   4. Lookup loyalty_customer par phone. Si absent : AUTO-ENRÔLEMENT à la
 *      volée (GO parrainage boutique 2026-07-06) — le client a donné son
 *      téléphone (attaché à la vente POS ou saisi au checkout), on crée sa
 *      fiche et on continue. Avant : skip customer_not_found → un code
 *      parrain BS- sur la commande était perdu DÉFINITIVEMENT (idempotence).
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
import { parseShopifyOrder, moneyStringToCents } from '@/lib/loyalty/parse-shopify-order'
import { spendAmbassadorCagnotte } from '@/lib/loyalty/ambassador-redemption'
import { finalizeOrderLoyalty } from '@/lib/loyalty/finalize'
import { upsertLoyaltyCustomer } from '@/lib/loyalty/upsert-customer'
import { ensureReferralCodeShopify } from '@/lib/loyalty/referral-shopify'
import {
  interpretDiscountCodes,
  type ReferralCodeLookup,
  type RedemptionLookup,
} from '@/lib/loyalty/interpret-discount-codes'
import {
  creditAmbassadorCommission,
  computeAmbassadorEligibleCents,
  isAmbassadorSelfMatch,
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
  parsed: { shopifyOrderId: string; email: string | null; phoneE164: string | null; discountCodes: string[]; paidItemsCents: number }
): Promise<unknown> {
  if (parsed.discountCodes.length === 0) return { ambassador: 'no_codes' }

  // Le(s) code(s) de la commande correspondent-ils à un ambassadeur actif ?
  const { data: ambassadors } = await supabase
    .from('ambassadors')
    .select('shopify_discount_code, email, phone')
    .eq('active', true)
  // Normalisation trim + casse des DEUX côtés : le code commande (déjà trim par
  // parseShopifyOrder) et le code stocké côté ambassadeur (défense contre un
  // espace parasite saisi à la main dans Supabase). cf. SQL: lower(btrim(...)).
  type AmbMatch = { code: string; email: string; phone: string | null }
  const activeByLower = new Map<string, AmbMatch>(
    (ambassadors ?? []).map((a: { shopify_discount_code: string; email: string; phone: string | null }) => [
      a.shopify_discount_code.trim().toLowerCase(),
      { code: a.shopify_discount_code, email: a.email, phone: a.phone },
    ])
  )
  const matched = parsed.discountCodes
    .map((c) => activeByLower.get(c.trim().toLowerCase()))
    .find((m): m is AmbMatch => !!m)
  if (!matched) return { ambassador: 'no_match' }
  const matchedCode = matched.code

  // Anti auto-commission : l'acheteur EST l'ambassadeur sur EMAIL OU TÉLÉPHONE
  // → on saute (le SQL bloque aussi, mais ici on évite l'appel is_new_customer).
  if (isAmbassadorSelfMatch(parsed.email, parsed.phoneE164, matched.email, matched.phone)) {
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
    // Tél acheteur (E.164) pour l'anti auto-commission tél (cf. isAmbassadorSelfMatch).
    buyerPhone: parsed.phoneE164,
    // Nom de commande (#1001) pour le reporting admin (capté tel quel du payload).
    shopifyOrderName: typeof payload?.name === 'string' ? payload.name : null,
  })
}

/**
 * Bloc DÉPENSE cagnotte ambassadeur — INDÉPENDANT (l'ambassadeur qui dépense
 * n'est pas forcément membre loyalty/téléphone). Si un code de la commande
 * correspond à une réservation AMB- → débit du montant RÉELLEMENT appliqué
 * (lu sur discount_codes[].amount), plafonné au réservé puis au solde. Idempotent
 * côté SQL (claim par code unique). Best-effort : ne casse jamais le webhook.
 */
async function processAmbassadorSpend(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  shopifyOrderId: string
): Promise<unknown> {
  const codes = (payload?.discount_codes ?? []) as Array<{ code?: string | null; amount?: string | number | null }>
  if (!Array.isArray(codes) || codes.length === 0) return { spend: 'no_codes' }

  const results: unknown[] = []
  for (const dc of codes) {
    const code = (dc?.code ?? '').trim()
    if (!code) continue
    const appliedAmountCents = moneyStringToCents(dc?.amount ?? 0)
    try {
      const r = await spendAmbassadorCagnotte(supabase, { shopifyOrderId, discountCode: code, appliedAmountCents })
      // On ne remonte que les codes pertinents (une vraie dépense ou un état non trivial).
      if (r.spent || (r.reason && r.reason !== 'no_redemption')) results.push({ code, ...r })
    } catch (err) {
      console.error('[loyalty webhook] ambassador spend error for code %s:', code, err)
      results.push({ code, spend: 'error', detail: err instanceof Error ? err.message : 'unknown' })
    }
  }
  return results.length > 0 ? results : { spend: 'no_match' }
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

  // ─── Blocs ambassadeur (AVANT tout skip : indépendants du parrainage/phone) ───
  // Best-effort : on logge mais on ne casse jamais le webhook.
  const ambPayload = JSON.parse(rawBody)
  let ambassadorResult: unknown = { ambassador: 'skipped' }
  try {
    ambassadorResult = await processAmbassadorCommission(supabase, ambPayload, parsed)
  } catch (err) {
    console.error('[loyalty webhook] ambassador commission error:', err)
    ambassadorResult = { ambassador: 'error', detail: err instanceof Error ? err.message : 'unknown' }
  }
  let ambassadorSpendResult: unknown = { spend: 'skipped' }
  try {
    ambassadorSpendResult = await processAmbassadorSpend(supabase, ambPayload, parsed.shopifyOrderId)
  } catch (err) {
    console.error('[loyalty webhook] ambassador spend error:', err)
    ambassadorSpendResult = { spend: 'error', detail: err instanceof Error ? err.message : 'unknown' }
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
      ambassador_spend: ambassadorSpendResult,
    })
  }

  // Lookup customer par phone
  const { data: existingCustomer, error: lookupErr } = await supabase
    .from('loyalty_customers')
    .select('id')
    .eq('phone', parsed.phoneE164)
    .maybeSingle()

  if (lookupErr) {
    console.error('[loyalty webhook] customer lookup error:', lookupErr)
    return NextResponse.json({ error: 'lookup_failed' }, { status: 500 })
  }

  let customer: { id: string } | null = existingCustomer

  // ─── AUTO-ENRÔLEMENT à la volée (GO parrainage boutique, 2026-07-06) ───
  // Le client a un téléphone sur la commande (attaché à la vente en caisse
  // Shopify POS, ou saisi au checkout en ligne) mais pas encore de fiche
  // fidélité → on la crée et on CONTINUE le traitement. Avant : la vente
  // était ignorée (skip customer_not_found + marquée processed) et un code
  // parrain BS- présent sur la commande était perdu définitivement.
  // RGPD : donner son téléphone en caisse pour le programme = l'adhésion ;
  // AUCUN consentement marketing implicite (emailOptIn: false).
  if (!customer) {
    try {
      const created = await upsertLoyaltyCustomer(supabase, {
        phone: parsed.phoneE164,
        firstName: parsed.firstName ?? 'Client',
        lastName: parsed.lastName ?? null,
        email: parsed.email ?? null,
        shopifyCustomerId:
          ambPayload?.customer?.id != null ? String(ambPayload.customer.id) : null,
        referredByCode: null, // le lien parrain passe par finalize (code sur la commande)
        emailOptIn: false,
        source: ambPayload?.source_name === 'pos' ? 'in_store' : 'online',
      })
      customer = { id: created.id }
      // Code parrain Shopify du nouveau membre : best-effort — l'échec est
      // tracé en DB par la lib (vue de réparation) et ne bloque pas le webhook.
      try {
        await ensureReferralCodeShopify(supabase, created.id, created.referralCode, created.email)
      } catch (err) {
        console.error('[loyalty webhook] ensureReferralCodeShopify failed (non-blocking):', err)
      }
    } catch (err) {
      // Échec de création → 500 SANS marquer la commande processed :
      // Shopify retentera le webhook, rien n'est perdu.
      console.error('[loyalty webhook] auto-enroll failed:', err)
      return NextResponse.json({ error: 'enroll_failed' }, { status: 500 })
    }
  }

  // ─── L3 : interpretation des codes de reduction ───
  let referralLookups: ReferralCodeLookup[] = []
  let redemptionLookups: RedemptionLookup[] = []

  if (parsed.discountCodes.length > 0) {
    // ⚠️ Les DEUX lookups checkent `error` (GO parrainage boutique) : un blip
    // DB avalé faisait tourner finalize avec spentLoyaltyCents=0 /
    // referredByCodeUsed=null PUIS marquait la commande processed →
    // commission parrain perdue / cagnotte non débitée, DÉFINITIVEMENT.
    // 500 AVANT finalize → Shopify retente, rien n'est perdu.

    // Lookup parrains (codes BS-* qui appartiennent a un autre customer)
    const { data: parrains, error: parrainsErr } = await supabase
      .from('loyalty_customers')
      .select('id, referral_code')
      .in('referral_code', parsed.discountCodes)
    if (parrainsErr) {
      console.error('[loyalty webhook] referral lookup error:', parrainsErr)
      return NextResponse.json({ error: 'lookup_failed' }, { status: 500 })
    }
    referralLookups = (parrains ?? []).map((p) => ({
      code: p.referral_code,
      ownerId: p.id,
    }))

    // Lookup redemptions de cet acheteur
    const { data: redemptions, error: redemptionsErr } = await supabase
      .from('loyalty_redemptions')
      .select('id, discount_code, amount_cents, status, customer_id')
      .eq('customer_id', customer.id)
      .in('discount_code', parsed.discountCodes)
    if (redemptionsErr) {
      console.error('[loyalty webhook] redemption lookup error:', redemptionsErr)
      return NextResponse.json({ error: 'lookup_failed' }, { status: 500 })
    }
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
      // Canal réel : vente Shopify POS → in_store (reporting). L'idempotence
      // par order_ref est inconditionnelle depuis 00009, les retries webhook
      // restent dédupliqués quel que soit le canal.
      channel: ambPayload?.source_name === 'pos' ? 'in_store' : 'online',
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

    return NextResponse.json({ ok: true, result, diagnostics: interpreted.diagnostics, ambassador: ambassadorResult, ambassador_spend: ambassadorSpendResult })
  } catch (err) {
    console.error('[loyalty webhook] finalize error:', err)
    return NextResponse.json(
      { error: 'finalize_failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    )
  }
}
