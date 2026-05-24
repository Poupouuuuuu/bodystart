/**
 * POST /api/loyalty/finalize
 *
 * Endpoint caisse boutique → finalize_order_loyalty (channel='in_store').
 *
 * SECURITY (Sprint L5) :
 *   - PRIORITAIRE : session staff Supabase Auth (cookies) → staff_user_id = auth.uid()
 *     C'est ce que la caisse UI doit utiliser.
 *   - FALLBACK M2M ONLY : header X-Staff-Token = LOYALTY_STAFF_SECRET
 *     → staff_user_id = NULL + log d'audit explicite (machine-to-machine,
 *     scripts CLI, jobs futurs).
 *
 * On rejette si NI session NI secret valide.
 *
 * Champs requis :
 *   - customerId (uuid loyalty_customers.id)
 *   - paidItemsCents (>= 0)
 *
 * Champs optionnels :
 *   - orderRef (id caisse interne, libre)
 *   - spentLoyaltyCents (defaut 0)
 *   - referredByCodeUsed (BS-XXXXX, rattachage post-inscription)
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'node:crypto'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { getStaffFromRequest, type StaffContext } from '@/lib/loyalty/staff-session'
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

type AuthResult =
  | { kind: 'staff_session'; staff: StaffContext }
  | { kind: 'm2m_secret' }
  | { kind: 'unauthorized' }

async function authenticate(req: Request): Promise<AuthResult> {
  // 1. Tente session staff (priorite)
  const staff = await getStaffFromRequest()
  if (staff) return { kind: 'staff_session', staff }

  // 2. Fallback : X-Staff-Token (machine-to-machine ONLY)
  const expectedSecret = process.env.LOYALTY_STAFF_SECRET
  if (expectedSecret) {
    const providedSecret = req.headers.get('x-staff-token') ?? ''
    if (providedSecret && timingSafeEqualStr(providedSecret, expectedSecret)) {
      return { kind: 'm2m_secret' }
    }
  }

  return { kind: 'unauthorized' }
}

export async function POST(req: Request) {
  // ─── Auth (session staff OU secret M2M) ───
  const auth = await authenticate(req)
  if (auth.kind === 'unauthorized') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // ─── Parse body ───
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

  // ─── Determine staff_user_id ───
  // session staff : vrai user id (audit complet)
  // M2M secret : NULL + log explicite (traçabilité minimale)
  const staffUserId = auth.kind === 'staff_session' ? auth.staff.id : null

  if (auth.kind === 'm2m_secret') {
    console.warn(
      '[finalize] AUDIT M2M : appel via X-Staff-Token (staff_user_id=null) ' +
        'customerId=%s orderRef=%s paid=%s spent=%s',
      parsed.customerId,
      parsed.orderRef,
      parsed.paidItemsCents,
      parsed.spentLoyaltyCents ?? 0
    )
  }

  // ─── Appel finalize Postgres ───
  try {
    const supabase = getLoyaltyAdminClient()
    const result = await finalizeOrderLoyalty(supabase, {
      customerId: parsed.customerId,
      orderRef: parsed.orderRef ?? null,
      paidItemsCents: parsed.paidItemsCents,
      spentLoyaltyCents: parsed.spentLoyaltyCents ?? 0,
      referredByCodeUsed: parsed.referredByCodeUsed ?? null,
      channel: 'in_store',
      staffUserId,
    })
    return NextResponse.json({ ok: true, result, auth: auth.kind })
  } catch (err) {
    console.error('[finalize] error:', err)
    return NextResponse.json(
      { error: 'finalize_failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    )
  }
}
