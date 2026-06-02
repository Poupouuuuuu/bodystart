/**
 * POST /api/loyalty/me/phone
 *
 * Synchronise le téléphone de la cagnotte (loyalty_customers.phone) quand
 * l'utilisateur modifie son numéro dans le profil. UN seul numéro par client :
 * le profil Shopify a déjà été mis à jour côté client, on répercute ici sur
 * la fidélité (best-effort).
 *
 * - logged_out (401)
 * - not_enrolled : 200 { ok: true, synced: false } (rien à synchroniser)
 * - enrolled : update loyalty_customers.phone = E.164 (par id, on garde le
 *   même solde / referral_code). Collision UNIQUE (numéro déjà pris) → 409.
 *
 * Body : { phone: string }  (E.164 ou format FR normalisable ; vide = no-op)
 * Auth via cookie body-start-customer-token (Shopify).
 */
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { resolveLoyaltyForSession } from '@/lib/loyalty/session'
import { normalizeToE164 } from '@/lib/loyalty/phone'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BodySchema = z.object({ phone: z.string().max(32) })

export async function POST(req: NextRequest) {
  const session = await resolveLoyaltyForSession()
  if (session.state === 'logged_out') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  // Pas encore inscrit à la cagnotte : rien à synchroniser, on ne bloque pas.
  if (session.state === 'not_enrolled') {
    return NextResponse.json({ ok: true, synced: false })
  }

  let parsed: z.infer<typeof BodySchema>
  try {
    parsed = BodySchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'invalid_body' }, { status: 400 })
  }

  // Vide → no-op (on ne supprime jamais le numéro de fidélité, c'est l'identité).
  if (!parsed.phone.trim()) {
    return NextResponse.json({ ok: true, synced: false })
  }

  const e164 = normalizeToE164(parsed.phone)
  if (!e164) {
    return NextResponse.json({ error: 'invalid_phone' }, { status: 400 })
  }

  // Déjà à jour → no-op.
  if (e164 === session.customer.phone) {
    return NextResponse.json({ ok: true, synced: false })
  }

  const admin = getLoyaltyAdminClient()
  const { error } = await admin
    .from('loyalty_customers')
    .update({ phone: e164 })
    .eq('id', session.customer.id)

  if (error) {
    // 23505 = unique_violation : le numéro appartient déjà à un autre client fidélité.
    if (error.code === '23505') {
      return NextResponse.json({ error: 'phone_conflict' }, { status: 409 })
    }
    return NextResponse.json({ error: 'update_failed', detail: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, synced: true })
}
