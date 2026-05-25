/**
 * POST /api/loyalty/preview
 *
 * SECURITY (Sprint L4) :
 *   - PRIORITAIRE : session staff Supabase Auth (cookies).
 *   - FALLBACK M2M : header X-Staff-Token = LOYALTY_STAFF_SECRET.
 *   - Plus jamais d'acces public anonyme (clients web passent par /me/preview).
 *
 * Rate limit Upstash (defense en profondeur) : 30 req/min/IP.
 *
 * Body : { phone: E.164, cartSubtotalCents: integer >= 0 }
 * Reponse : { balanceCents, maxRedeemableCents, eligible, reason?, config }
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'node:crypto'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { getStaffFromRequest, type StaffContext } from '@/lib/loyalty/staff-session'
import { normalizeToE164 } from '@/lib/loyalty/phone'
import { buildPreview } from '@/lib/loyalty/preview-core'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// ─── Rate limiter Upstash : 30 req/min par IP ───
let rateLimiter: { limit: (key: string) => Promise<{ success: boolean; remaining: number }> } | null = null
if (
  process.env.UPSTASH_REDIS_REST_URL &&
  !process.env.UPSTASH_REDIS_REST_URL.includes('xxx')
) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Ratelimit } = require('@upstash/ratelimit')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Redis } = require('@upstash/redis')
  rateLimiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: true,
    prefix: 'ratelimit:loyalty:preview',
  })
}

const BodySchema = z.object({
  phone: z.string().min(5).max(32),
  cartSubtotalCents: z.number().int().min(0),
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
  // ─── Auth obligatoire (staff session OU secret M2M) ───
  const auth = await authenticate(req)
  if (auth.kind === 'unauthorized') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (auth.kind === 'm2m_secret') {
    console.warn('[preview] AUDIT M2M : appel via X-Staff-Token (staff_user_id=null)')
  }

  // ─── Rate limit (defense en profondeur, meme en mode auth) ───
  if (rateLimiter) {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      '127.0.0.1'
    const { success, remaining } = await rateLimiter.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: 'rate_limited', detail: 'Trop de demandes.' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }
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

  const e164 = normalizeToE164(parsed.phone)
  if (!e164) {
    return NextResponse.json({ error: 'invalid_phone' }, { status: 400 })
  }

  // ─── Lookup customer + delegue a buildPreview ───
  const supabase = getLoyaltyAdminClient()
  const { data: customer, error } = await supabase
    .from('loyalty_customers')
    .select('id, loyalty_balance_cents')
    .eq('phone', e164)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'lookup_failed', detail: error.message }, { status: 500 })
  }

  if (!customer) {
    // Phone inconnu : reponse "vide" mais 200 (le widget caisse affichera juste "Pas de cagnotte")
    return NextResponse.json({
      balanceCents: 0,
      maxRedeemableCents: 0,
      eligible: false,
      reason: 'customer_not_found',
      config: { minBalanceCents: 2000, cartCapRatio: 0.5 },
    })
  }

  const preview = buildPreview({
    customer: { id: customer.id, loyaltyBalanceCents: customer.loyalty_balance_cents },
    cartSubtotalCents: parsed.cartSubtotalCents,
  })
  return NextResponse.json(preview)
}
