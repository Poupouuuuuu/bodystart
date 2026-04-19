/**
 * POST /api/coaching/delete-request
 *
 * RGPD art. 17 — Demande de suppression / anonymisation.
 *
 * Décision de design (Sprint 1) :
 *   - Le user demande la suppression
 *   - On envoie un email au coach (via Resend) qui valide manuellement
 *   - Le coach déclenche `anonymize_user(p_user_id)` depuis le panel admin
 *
 * Pourquoi pas auto ?
 *   - Vérification d'identité (éviter qu'un attaquant ayant volé un token
 *     supprime un compte sans confirmation)
 *   - Délai légal CNIL : on doit répondre sous 1 mois, pas immédiatement
 *   - Permet au coach de récupérer les données utiles avant anonymisation
 *
 * Sprint 4 : pourra évoluer vers un flow auto avec confirmation par email
 *   (lien magique avec token signé, expiration 24h).
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { Resend } from 'resend'
import { getCustomer } from '@/lib/shopify/customer-server'
import { getSupabaseAdminClient } from '@/lib/coaching/supabase/admin'

export const dynamic = 'force-dynamic'

const SHOPIFY_TOKEN_COOKIE = 'body-start-customer-token'

export async function POST(req: Request) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get(SHOPIFY_TOKEN_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const customer = await getCustomer(token)
    if (!customer) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const reason = typeof body.reason === 'string' ? body.reason.slice(0, 500) : ''

    const admin = getSupabaseAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('id, email, first_name, last_name')
      .eq('shopify_customer_id', customer.id)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json({ error: 'No profile found' }, { status: 404 })
    }

    // Notify le coach par email
    const resend = new Resend(process.env.RESEND_API_KEY)
    const adminEmail = (process.env.COACHING_ADMIN_EMAILS ?? '').split(',')[0]?.trim()

    if (adminEmail && process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: 'Body Start Coaching <onboarding@resend.dev>',
        to: adminEmail,
        subject: `[RGPD] Demande de suppression — ${profile.email}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px;">
            <h2>Demande de suppression de compte coaching</h2>
            <p><strong>Profile ID:</strong> <code>${profile.id}</code></p>
            <p><strong>Email:</strong> ${profile.email}</p>
            <p><strong>Nom:</strong> ${profile.first_name ?? ''} ${profile.last_name ?? ''}</p>
            ${reason ? `<p><strong>Raison:</strong> ${reason.replace(/</g, '&lt;')}</p>` : ''}
            <hr>
            <p style="color: #666; font-size: 13px;">
              Pour traiter cette demande, va dans le panel admin et déclenche
              <code>anonymize_user('${profile.id}')</code>. Délai légal CNIL : 1 mois.
            </p>
          </div>
        `,
      })
    }

    return NextResponse.json({
      ok: true,
      message: 'Demande envoyée. Vous recevrez une confirmation par email sous 1 mois maximum.',
    })
  } catch (err) {
    console.error('[delete-request] Error:', err)
    const msg = err instanceof Error ? err.message : 'Unknown'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
