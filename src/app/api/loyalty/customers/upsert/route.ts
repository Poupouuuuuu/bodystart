/**
 * POST /api/loyalty/customers/upsert
 *
 * Cree ou recupere un loyalty_customer par telephone (E.164).
 * Genere un referral_code unique au premier insert.
 *
 * Validation Zod + libphonenumber-js (E.164).
 *
 * SECURITY :
 *   - Aucune auth obligatoire pour le L2 (l'inscription publique est legitime).
 *   - Rate-limiting a ajouter au L5 (anti-spam).
 *   - La RLS deny-par-defaut bloque tout acces direct ; seul service_role
 *     (utilise dans cette route) peut ecrire.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { normalizeToE164 } from '@/lib/loyalty/phone'
import { isValidReferralCode } from '@/lib/loyalty/calculate'
import { upsertLoyaltyCustomer } from '@/lib/loyalty/upsert-customer'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs' // libphonenumber-js + supabase-js

const BodySchema = z.object({
  phone: z.string().min(5).max(32), // sera re-normalise en E.164
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().max(120).optional().nullable(),
  email: z.string().trim().email().max(254).optional().nullable(),
  shopifyCustomerId: z.string().trim().max(200).optional().nullable(),
  referredByCode: z.string().trim().max(20).optional().nullable(),
  emailOptIn: z.boolean().optional(),
  source: z.enum(['in_store', 'online', 'import_legacy']).optional(),
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

  // Normalisation E.164 (parse FR par defaut)
  const e164 = normalizeToE164(parsed.phone)
  if (!e164) {
    return NextResponse.json(
      { error: 'invalid_phone', detail: 'Numero invalide ou pays non detectable.' },
      { status: 400 }
    )
  }

  // Validation du code parrain si fourni (format strict)
  if (parsed.referredByCode && !isValidReferralCode(parsed.referredByCode)) {
    return NextResponse.json(
      { error: 'invalid_referral_code', detail: 'Format attendu : BS-XXXXX.' },
      { status: 400 }
    )
  }

  try {
    const supabase = getLoyaltyAdminClient()
    const result = await upsertLoyaltyCustomer(supabase, {
      phone: e164,
      firstName: parsed.firstName,
      lastName: parsed.lastName ?? null,
      email: parsed.email ?? null,
      shopifyCustomerId: parsed.shopifyCustomerId ?? null,
      referredByCode: parsed.referredByCode ?? null,
      emailOptIn: parsed.emailOptIn ?? false,
      source: parsed.source ?? 'online',
    })

    return NextResponse.json({
      ok: true,
      customer: {
        id: result.id,
        phone: result.phone,
        email: result.email,
        firstName: result.firstName,
        referralCode: result.referralCode,
        loyaltyBalanceCents: result.loyaltyBalanceCents,
        isNew: result.isNew,
      },
    })
  } catch (err) {
    console.error('[upsert customer] error:', err)
    return NextResponse.json(
      { error: 'upsert_failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    )
  }
}
