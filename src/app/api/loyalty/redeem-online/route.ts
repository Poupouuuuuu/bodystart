/**
 * POST /api/loyalty/redeem-online
 *
 * SECURITY (L4) : meme pattern que /api/loyalty/preview.
 *   - Staff session OU X-Staff-Token (M2M).
 *   - Plus d'acces public anonyme.
 *
 * Body : { phone: E.164, cartSubtotalCents, requestedAmountCents }
 * Reponse : { ok, redemption: { discountCode, amountCents, expiresAt } }
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'node:crypto'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { getStaffFromRequest, type StaffContext } from '@/lib/loyalty/staff-session'
import { normalizeToE164 } from '@/lib/loyalty/phone'
import { executeRedeem } from '@/lib/loyalty/redeem-online-core'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BodySchema = z.object({
  phone: z.string().min(5).max(32),
  cartSubtotalCents: z.number().int().min(1),
  requestedAmountCents: z.number().int().min(1),
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

async function authenticate(req: NextRequest): Promise<AuthResult> {
  const staff = await getStaffFromRequest()
  if (staff) return { kind: 'staff_session', staff }
  const expectedSecret = process.env.LOYALTY_STAFF_SECRET
  if (expectedSecret) {
    const provided = req.headers.get('x-staff-token') ?? ''
    if (provided && timingSafeEqualStr(provided, expectedSecret)) {
      return { kind: 'm2m_secret' }
    }
  }
  return { kind: 'unauthorized' }
}

export async function POST(req: NextRequest) {
  const auth = await authenticate(req)
  if (auth.kind === 'unauthorized') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (auth.kind === 'm2m_secret') {
    console.warn('[redeem-online] AUDIT M2M : appel via X-Staff-Token')
  }

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

  const result = await executeRedeem({
    supabase,
    customer: {
      id: customer.id,
      phone: customer.phone,
      loyaltyBalanceCents: customer.loyalty_balance_cents,
    },
    cartSubtotalCents: parsed.cartSubtotalCents,
    requestedAmountCents: parsed.requestedAmountCents,
  })

  if (!result.ok) {
    if (result.kind === 'validation') {
      return NextResponse.json(
        {
          error: 'validation_failed',
          reason: result.reason,
          maxAllowedCents: result.maxAllowedCents,
        },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'reserve_failed', detail: result.detail }, { status: 500 })
  }

  return NextResponse.json({ ok: true, redemption: result.redemption })
}
