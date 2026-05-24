/**
 * POST /api/loyalty/redeem-online
 *
 * Reserve une cagnotte cote DB + cree un code Shopify (endsAt 1h).
 *
 * Flow :
 *   1. Validation Zod + E.164
 *   2. Lookup customer (par phone)
 *   3. Sweep lazy : passe les anciennes reservations 'reserved' expirees en 'expired'
 *   4. validateRedemptionRequest (spec V2 §3 : min 20€ + cap 50% panier)
 *   5. reserveRedemption (cree code Shopify + insert DB)
 *   6. Retourne { discountCode, amountCents, expiresAt }
 *
 * Body : { phone, cartSubtotalCents, requestedAmountCents }
 *
 * Reponses :
 *   200 { ok, redemption: { discountCode, amountCents, expiresAt } }
 *   400 invalid_body / invalid_phone / validation_failed (avec reason + maxAllowed)
 *   404 customer_not_found
 *   500 shopify_failed / db_failed
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { normalizeToE164 } from '@/lib/loyalty/phone'
import {
  validateRedemptionRequest,
  expireOldRedemptions,
  reserveRedemption,
} from '@/lib/loyalty/redemption'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BodySchema = z.object({
  phone: z.string().min(5).max(32),
  cartSubtotalCents: z.number().int().min(1),
  requestedAmountCents: z.number().int().min(1),
})

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
    return NextResponse.json({ error: 'invalid_phone' }, { status: 400 })
  }

  const supabase = getLoyaltyAdminClient()
  const { data: customer, error: lookupErr } = await supabase
    .from('loyalty_customers')
    .select('id, phone, loyalty_balance_cents')
    .eq('phone', e164)
    .maybeSingle()

  if (lookupErr) {
    return NextResponse.json(
      { error: 'lookup_failed', detail: lookupErr.message },
      { status: 500 }
    )
  }
  if (!customer) {
    return NextResponse.json({ error: 'customer_not_found' }, { status: 404 })
  }

  // Sweep lazy DB-side : libere mentalement les vieilles reservations expirees
  try {
    await expireOldRedemptions(supabase, customer.id)
  } catch (err) {
    // Non-bloquant : on continue, le pire qui peut arriver est un message d'erreur
    // au client si une autre reservation active bloque sa demande.
    console.warn('[redeem-online] expireOldRedemptions failed (non-blocking):', err)
  }

  const validation = validateRedemptionRequest({
    balanceCents: customer.loyalty_balance_cents,
    cartSubtotalCents: parsed.cartSubtotalCents,
    requestedAmountCents: parsed.requestedAmountCents,
  })
  if (!validation.ok) {
    return NextResponse.json(
      {
        error: 'validation_failed',
        reason: validation.reason,
        maxAllowedCents: validation.maxAllowedCents,
      },
      { status: 400 }
    )
  }

  try {
    const reservation = await reserveRedemption(supabase, {
      customerId: customer.id,
      customerHint: customer.phone,
      amountCents: validation.appliedCents,
      cartSubtotalCents: parsed.cartSubtotalCents,
    })

    return NextResponse.json({
      ok: true,
      redemption: {
        discountCode: reservation.discountCode,
        amountCents: reservation.amountCents,
        expiresAt: reservation.expiresAt,
      },
    })
  } catch (err) {
    console.error('[redeem-online] reserve failed:', err)
    const msg = err instanceof Error ? err.message : 'unknown'
    return NextResponse.json(
      { error: 'reserve_failed', detail: msg },
      { status: 500 }
    )
  }
}
