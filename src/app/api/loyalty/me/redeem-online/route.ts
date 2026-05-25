/**
 * POST /api/loyalty/me/redeem-online
 *
 * Reserve cagnotte pour le client Shopify connecte. Cree un code
 * Shopify (endsAt 1h) + insert loyalty_redemptions(reserved).
 *
 * Auth via cookie body-start-customer-token.
 *
 * Body : { cartSubtotalCents, requestedAmountCents }
 * Reponse 200 : { ok, redemption: { discountCode, amountCents, expiresAt } }
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { resolveLoyaltyForSession } from '@/lib/loyalty/session'
import { executeRedeem } from '@/lib/loyalty/redeem-online-core'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Rate limit 10 req/min/IP (chaque appel = 1 code Shopify cree, couteux)
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
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'ratelimit:loyalty:me:redeem',
  })
}

const BodySchema = z.object({
  cartSubtotalCents: z.number().int().min(1),
  requestedAmountCents: z.number().int().min(1),
})

export async function POST(req: NextRequest) {
  const session = await resolveLoyaltyForSession()
  if (session.state === 'logged_out') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (session.state === 'not_enrolled') {
    return NextResponse.json({ error: 'not_enrolled' }, { status: 403 })
  }

  if (rateLimiter) {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      '127.0.0.1'
    const { success, remaining } = await rateLimiter.limit(ip)
    if (!success) {
      return NextResponse.json(
        { error: 'rate_limited' },
        { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }
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

  const supabase = getLoyaltyAdminClient()
  const result = await executeRedeem({
    supabase,
    customer: {
      id: session.customer.id,
      phone: session.customer.phone,
      loyaltyBalanceCents: session.customer.loyaltyBalanceCents,
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
