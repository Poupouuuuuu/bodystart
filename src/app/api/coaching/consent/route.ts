/**
 * POST /api/coaching/consent
 *
 * Marque le consentement RGPD du user authentifié.
 * Met à jour profiles.rgpd_consent_at = now() pour ce user.
 *
 * Authentification : via le cookie Shopify (on récupère l'email,
 * puis on retrouve le profile correspondant).
 *
 * Idempotent : si déjà consenti, ne fait rien.
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCustomer } from '@/lib/shopify/customer-server'
import { getSupabaseAdminClient } from '@/lib/coaching/supabase/admin'

export const dynamic = 'force-dynamic'

const SHOPIFY_TOKEN_COOKIE = 'body-start-customer-token'

export async function POST() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get(SHOPIFY_TOKEN_COOKIE)?.value

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const customer = await getCustomer(token)
    if (!customer) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const admin = getSupabaseAdminClient()

    const { data: profile, error: selectErr } = await admin
      .from('profiles')
      .select('id, rgpd_consent_at')
      .eq('shopify_customer_id', customer.id)
      .maybeSingle()

    if (selectErr) {
      return NextResponse.json({ error: selectErr.message }, { status: 500 })
    }
    if (!profile) {
      // Le profil devrait exister via le bridge auth — sinon le user n'a pas
      // encore visité une page coaching authentifiée. On le crée à la volée.
      return NextResponse.json(
        { error: 'Profile not synced yet. Visit /account/coaching first.' },
        { status: 409 }
      )
    }

    if (profile.rgpd_consent_at) {
      return NextResponse.json({ ok: true, already: true, rgpd_consent_at: profile.rgpd_consent_at })
    }

    const { error: updateErr } = await admin
      .from('profiles')
      .update({ rgpd_consent_at: new Date().toISOString() })
      .eq('id', profile.id)

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, already: false })
  } catch (err) {
    console.error('[consent] Error:', err)
    const msg = err instanceof Error ? err.message : 'Unknown'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
