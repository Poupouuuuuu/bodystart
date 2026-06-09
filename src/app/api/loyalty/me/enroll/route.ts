/**
 * POST /api/loyalty/me/enroll
 *
 * Inscrit un client Shopify connecte au programme loyalty.
 * Auth via cookie body-start-customer-token.
 *
 * Body : { phone: string (E.164 ou format francais normalisable) }
 * Reponse 200 : { ok, customer: { id, referralCode, loyaltyBalanceCents } }
 */
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { resolveLoyaltyForSession } from '@/lib/loyalty/session'
import { normalizeToE164 } from '@/lib/loyalty/phone'
import { isValidReferralCode } from '@/lib/loyalty/calculate'
import { upsertLoyaltyCustomer } from '@/lib/loyalty/upsert-customer'
import { updateCustomerPhoneServer } from '@/lib/shopify/customer-server'

const SHOPIFY_TOKEN_COOKIE = 'body-start-customer-token'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// --- Rate limiter Upstash : reutilise le prefix d'upsert ---
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
    limiter: Ratelimit.slidingWindow(5, '10 m'),
    analytics: true,
    prefix: 'ratelimit:loyalty:me:enroll',
  })
}

const BodySchema = z.object({
  phone: z.string().min(5).max(32),
  // Code parrain capturé (cookie bs_referral). Optionnel ; validé ci-dessous.
  referredByCode: z.string().trim().max(20).optional().nullable(),
})

export async function POST(req: NextRequest) {
  const session = await resolveLoyaltyForSession()
  if (session.state === 'logged_out') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (session.state === 'enrolled') {
    return NextResponse.json({ error: 'already_enrolled' }, { status: 409 })
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

  const e164 = normalizeToE164(parsed.phone)
  if (!e164) {
    return NextResponse.json({ error: 'invalid_phone' }, { status: 400 })
  }

  try {
    // Code parrain : on ne lie que si le format est valide (anti-injection).
    // L'auto-parrainage est impossible ici (le client n'a pas encore de code).
    const referredByCode =
      parsed.referredByCode && isValidReferralCode(parsed.referredByCode)
        ? parsed.referredByCode
        : null

    const admin = getLoyaltyAdminClient()
    const result = await upsertLoyaltyCustomer(admin, {
      phone: e164,
      firstName: session.shopify.firstName,
      email: session.shopify.email,
      shopifyCustomerId: session.shopify.id,
      referredByCode,
      source: 'online',
    })

    // Sync profil Shopify ← cagnotte : on écrit le numéro saisi à l'enrôlement
    // dans le profil client, pour qu'il n'y ait QU'UN seul numéro (best-effort).
    const token = cookies().get(SHOPIFY_TOKEN_COOKIE)?.value
    if (token) await updateCustomerPhoneServer(token, e164)

    return NextResponse.json({
      ok: true,
      customer: {
        id: result.id,
        referralCode: result.referralCode,
        loyaltyBalanceCents: result.loyaltyBalanceCents,
      },
    })
  } catch (err) {
    console.error('[me/enroll] error:', err)
    return NextResponse.json(
      { error: 'enroll_failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    )
  }
}
