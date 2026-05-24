/**
 * POST /api/loyalty/staff/customer-lookup
 *
 * Staff-only : recherche un loyalty_customer par téléphone E.164.
 *
 * Body : { phone: string }
 * Réponses :
 *   200 { customer: { id, firstName, lastName, phoneE164, loyaltyBalanceCents, referralCode, hasFirstPurchase } }
 *   401 si pas staff actif
 *   400 invalid_phone
 *   404 customer_not_found
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getStaffFromRequest } from '@/lib/loyalty/staff-session'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { normalizeToE164 } from '@/lib/loyalty/phone'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BodySchema = z.object({ phone: z.string().min(5).max(32) })

export async function POST(req: Request) {
  // 1. Auth staff (session Supabase obligatoire)
  const staff = await getStaffFromRequest()
  if (!staff) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
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

  const e164 = normalizeToE164(parsed.phone)
  if (!e164) {
    return NextResponse.json({ error: 'invalid_phone' }, { status: 400 })
  }

  // 3. Lookup
  const supabase = getLoyaltyAdminClient()
  const { data: customer, error } = await supabase
    .from('loyalty_customers')
    .select('id, first_name, last_name, phone, loyalty_balance_cents, referral_code, has_first_purchase')
    .eq('phone', e164)
    .maybeSingle()

  if (error) {
    console.error('[customer-lookup] error:', error)
    return NextResponse.json({ error: 'lookup_failed' }, { status: 500 })
  }

  if (!customer) {
    return NextResponse.json({ error: 'customer_not_found' }, { status: 404 })
  }

  return NextResponse.json({
    customer: {
      id: customer.id,
      firstName: customer.first_name,
      lastName: customer.last_name,
      phoneE164: customer.phone,
      loyaltyBalanceCents: customer.loyalty_balance_cents,
      referralCode: customer.referral_code,
      hasFirstPurchase: customer.has_first_purchase,
    },
  })
}
