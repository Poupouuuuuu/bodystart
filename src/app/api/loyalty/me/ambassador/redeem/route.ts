/**
 * POST /api/loyalty/me/ambassador/redeem
 *
 * Réserve une dépense de cagnotte AMBASSADEUR pour le client Shopify connecté
 * (lookup par email). Crée un code Shopify AMB-XXXX (endsAt 1 h, usage unique,
 * non combinable, min achat 2× le montant) + insert ambassador_redemptions(reserved).
 * Le solde n'est PAS débité ici — il l'est au paiement réel (webhook orders/paid).
 *
 * Auth via cookie Shopify (resolveLoyaltyForSession → email).
 * Body : { cartSubtotalCents, requestedAmountCents }
 * 200 : { ok, redemption: { discountCode, amountCents, expiresAt } }
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { resolveLoyaltyForSession } from '@/lib/loyalty/session'
import { usableAmbassadorBalanceCents } from '@/lib/loyalty/ambassador'
import {
  validateAmbassadorRedemption,
  reserveAmbassadorRedemption,
  expireOldAmbassadorRedemptions,
} from '@/lib/loyalty/ambassador-redemption'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Rate limit 10 req/min/IP (chaque appel = 1 code Shopify créé, coûteux)
let rateLimiter: { limit: (key: string) => Promise<{ success: boolean; remaining: number }> } | null = null
if (process.env.UPSTASH_REDIS_REST_URL && !process.env.UPSTASH_REDIS_REST_URL.includes('xxx')) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Ratelimit } = require('@upstash/ratelimit')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Redis } = require('@upstash/redis')
  rateLimiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(10, '1 m'),
    analytics: true,
    prefix: 'ratelimit:loyalty:me:ambassador:redeem',
  })
}

// L'ambassadeur choisit un montant (≥ 10 €) ≤ son solde utilisable. Le panier
// n'est pas requis : le cap 50 % est garanti par le min d'achat du code (2× montant).
const BodySchema = z.object({
  requestedAmountCents: z.number().int().min(1),
})

export async function POST(req: NextRequest) {
  const session = await resolveLoyaltyForSession()
  if (session.state === 'logged_out') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const email = session.shopify.email
  if (!email) {
    return NextResponse.json({ error: 'not_ambassador' }, { status: 403 })
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
    parsed = BodySchema.parse(await req.json())
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: err instanceof Error ? err.message : 'parse error' },
      { status: 400 }
    )
  }

  const supabase = getLoyaltyAdminClient()
  const { data: amb, error: lookupErr } = await supabase
    .from('ambassadors')
    .select('id, email, balance_cents, active, last_activity_at')
    .ilike('email', email)
    .maybeSingle()

  if (lookupErr) {
    return NextResponse.json({ error: 'lookup_failed', detail: lookupErr.message }, { status: 500 })
  }
  if (!amb || !amb.active) {
    return NextResponse.json({ error: 'not_ambassador' }, { status: 403 })
  }

  // Sweep lazy des réservations expirées (non bloquant).
  try {
    await expireOldAmbassadorRedemptions(supabase, amb.id)
  } catch (err) {
    console.warn('[ambassador redeem] expire sweep failed (non-blocking):', err)
  }

  const usableBalanceCents = usableAmbassadorBalanceCents(amb.balance_cents, amb.last_activity_at)
  const validation = validateAmbassadorRedemption({
    usableBalanceCents,
    requestedAmountCents: parsed.requestedAmountCents,
  })
  if (!validation.ok) {
    return NextResponse.json(
      { error: 'validation_failed', reason: validation.reason, maxAllowedCents: validation.maxAllowedCents },
      { status: 400 }
    )
  }

  try {
    const reservation = await reserveAmbassadorRedemption(supabase, {
      ambassadorId: amb.id,
      ambassadorEmail: amb.email,
      amountCents: validation.appliedCents,
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
    return NextResponse.json(
      { error: 'reserve_failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    )
  }
}
