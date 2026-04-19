/**
 * GET /api/coaching/export
 *
 * RGPD art. 20 — Portabilité.
 * Exporte toutes les données du user authentifié au format JSON téléchargeable.
 *
 * Authentification : via cookie Shopify → résolution profile via shopify_customer_id.
 * On utilise admin client pour bypasser RLS (la fonction SQL fait son propre check
 * d'autorisation via auth.uid() — mais on n'a pas auth.uid() côté API REST sans JWT
 * Supabase, donc on appelle l'admin et on filtre par profile.id manuellement).
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCustomer } from '@/lib/shopify/customer-server'
import { getSupabaseAdminClient } from '@/lib/coaching/supabase/admin'

export const dynamic = 'force-dynamic'

const SHOPIFY_TOKEN_COOKIE = 'body-start-customer-token'

export async function GET() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get(SHOPIFY_TOKEN_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const customer = await getCustomer(token)
    if (!customer) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const admin = getSupabaseAdminClient()

    // Récupérer le profile id
    const { data: profile, error: pErr } = await admin
      .from('profiles')
      .select('*')
      .eq('shopify_customer_id', customer.id)
      .maybeSingle()

    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })
    if (!profile) return NextResponse.json({ error: 'No profile found' }, { status: 404 })

    // Aggregate all data
    const [intakes, programs, subs, checkins, orders] = await Promise.all([
      admin.from('intakes').select('*').eq('user_id', profile.id),
      admin.from('programs').select('*').eq('user_id', profile.id),
      admin.from('subscriptions').select('*').eq('user_id', profile.id),
      admin.from('weekly_checkins').select('*').eq('user_id', profile.id),
      admin.from('coaching_orders').select('*').eq('user_id', profile.id),
    ])

    const payload = {
      profile,
      intakes: intakes.data ?? [],
      programs: programs.data ?? [],
      subscriptions: subs.data ?? [],
      checkins: checkins.data ?? [],
      orders: orders.data ?? [],
      exported_at: new Date().toISOString(),
    }

    const filename = `bodystart-coaching-export-${profile.id}-${new Date().toISOString().slice(0, 10)}.json`

    return new NextResponse(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('[export] Error:', err)
    const msg = err instanceof Error ? err.message : 'Unknown'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
