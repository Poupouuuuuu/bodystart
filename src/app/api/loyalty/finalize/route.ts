/**
 * POST /api/loyalty/finalize
 *
 * Endpoint caisse boutique → finalize_order_loyalty (channel='in_store').
 *
 * SECURITY (provisoire L2) :
 *   - Header obligatoire : X-Staff-Token = LOYALTY_STAFF_SECRET
 *   - Le secret est partage entre le terminal caisse et l'API. Suffisant pour
 *     proteger contre les acces publics tant que le Sprint L5 n'a pas refonctionne
 *     l'auth staff (Supabase Auth + role 'staff').
 *   - Comparaison timing-safe.
 *
 * Champs requis :
 *   - customerId (uuid loyalty_customers.id)
 *   - paidItemsCents (>= 0)
 *
 * Champs optionnels :
 *   - orderRef (id caisse interne, libre)
 *   - spentLoyaltyCents (defaut 0)
 *   - referredByCodeUsed (BS-XXXXX, rattachage post-inscription)
 *   - staffUserId (uuid pour audit ; au L5 on le derivera de la session)
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'node:crypto'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { finalizeOrderLoyalty } from '@/lib/loyalty/finalize'
import { isValidReferralCode } from '@/lib/loyalty/calculate'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BodySchema = z.object({
  customerId: z.string().uuid(),
  orderRef: z.string().trim().max(200).optional().nullable(),
  paidItemsCents: z.number().int().min(0),
  spentLoyaltyCents: z.number().int().min(0).optional(),
  referredByCodeUsed: z.string().trim().max(20).optional().nullable(),
  staffUserId: z.string().uuid().optional().nullable(),
})

function timingSafeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ba.length !== bb.length) return false
  try {
    return crypto.timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  // 1. Auth staff secret
  const expectedSecret = process.env.LOYALTY_STAFF_SECRET
  if (!expectedSecret) {
    console.error('[loyalty finalize] LOYALTY_STAFF_SECRET non configure')
    return NextResponse.json({ error: 'staff_secret_not_configured' }, { status: 500 })
  }
  const providedSecret = req.headers.get('x-staff-token') ?? ''
  if (!timingSafeEqualStr(providedSecret, expectedSecret)) {
    return NextResponse.json({ error: 'invalid_staff_token' }, { status: 401 })
  }

  // 2. Parse body
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

  if (parsed.referredByCodeUsed && !isValidReferralCode(parsed.referredByCodeUsed)) {
    return NextResponse.json(
      { error: 'invalid_referral_code', detail: 'Format attendu : BS-XXXXX.' },
      { status: 400 }
    )
  }

  // 3. Appel finalize
  try {
    const supabase = getLoyaltyAdminClient()
    const result = await finalizeOrderLoyalty(supabase, {
      customerId: parsed.customerId,
      orderRef: parsed.orderRef ?? null,
      paidItemsCents: parsed.paidItemsCents,
      spentLoyaltyCents: parsed.spentLoyaltyCents ?? 0,
      referredByCodeUsed: parsed.referredByCodeUsed ?? null,
      channel: 'in_store',
      staffUserId: parsed.staffUserId ?? null,
    })
    return NextResponse.json({ ok: true, result })
  } catch (err) {
    console.error('[loyalty finalize] error:', err)
    return NextResponse.json(
      { error: 'finalize_failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    )
  }
}
