/**
 * POST /api/loyalty/preview
 *
 * Lecture seule (pas d'effet de bord) : renvoie au front l'etat necessaire
 * pour afficher le widget cagnotte au checkout.
 *
 * Body : { phone: E.164, cartSubtotalCents: integer > 0 }
 *
 * Reponse :
 *   { balanceCents, maxRedeemableCents, eligible: boolean, reason?: string }
 *
 * Pas d'auth requise (info non sensible : on retourne juste un montant calcule
 * a partir du panier public + du solde du customer dont on connait le phone).
 * Le solde reel n'est revele qu'a quelqu'un qui connait le phone E.164 du client,
 * ce qui est acceptable pour un widget checkout.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { normalizeToE164 } from '@/lib/loyalty/phone'
import { maxRedeemableCents, REDEEM_MIN_BALANCE_CENTS } from '@/lib/loyalty/calculate'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BodySchema = z.object({
  phone: z.string().min(5).max(32),
  cartSubtotalCents: z.number().int().min(0),
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
  const { data: customer, error } = await supabase
    .from('loyalty_customers')
    .select('id, loyalty_balance_cents')
    .eq('phone', e164)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'lookup_failed', detail: error.message }, { status: 500 })
  }

  // Phone inconnu : reponse "vide" mais 200 (le widget affichera juste "Tu n'as pas de cagnotte")
  if (!customer) {
    return NextResponse.json({
      balanceCents: 0,
      maxRedeemableCents: 0,
      eligible: false,
      reason: 'customer_not_found',
    })
  }

  const balanceCents = customer.loyalty_balance_cents
  const max = maxRedeemableCents(parsed.cartSubtotalCents, balanceCents)

  const eligible = max > 0
  let reason: string | undefined
  if (!eligible) {
    if (balanceCents < REDEEM_MIN_BALANCE_CENTS) reason = 'balance_below_minimum'
    else if (parsed.cartSubtotalCents <= 0) reason = 'invalid_cart'
    else reason = 'no_redeemable_amount'
  }

  return NextResponse.json({
    balanceCents,
    maxRedeemableCents: max,
    eligible,
    ...(reason ? { reason } : {}),
    config: {
      minBalanceCents: REDEEM_MIN_BALANCE_CENTS,
      cartCapRatio: 0.5,
    },
  })
}
