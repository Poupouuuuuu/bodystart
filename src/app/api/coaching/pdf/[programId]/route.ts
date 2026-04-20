/**
 * GET /api/coaching/pdf/[programId]
 *
 * Génère une signed URL Supabase Storage (expirant 60s) et redirige
 * le client vers cette URL pour télécharger son PDF.
 *
 * Sécurité :
 *   - Auth Shopify obligatoire
 *   - Le program doit appartenir au user authentifié
 *   - Le program doit être delivered_at NOT NULL (jamais avant validation coach)
 *   - Admin peut accéder à n'importe quel programme (pour tests)
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCustomer } from '@/lib/shopify/customer-server'
import { getSupabaseAdminClient } from '@/lib/coaching/supabase/admin'

export const dynamic = 'force-dynamic'

const SHOPIFY_TOKEN_COOKIE = 'body-start-customer-token'
const BUCKET = 'coaching-pdfs'
const SIGNED_URL_EXPIRY_SECONDS = 60

function isAdminEmail(email: string): boolean {
  const csv = process.env.COACHING_ADMIN_EMAILS ?? ''
  return csv
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase())
}

export async function GET(_req: Request, { params }: { params: { programId: string } }) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get(SHOPIFY_TOKEN_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const customer = await getCustomer(token)
    if (!customer) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })

    const sb = getSupabaseAdminClient()

    // Récupérer le programme
    const { data: program } = await sb
      .from('programs')
      .select('id, user_id, pdf_url, delivered_at')
      .eq('id', params.programId)
      .maybeSingle()

    if (!program) return NextResponse.json({ error: 'Program not found' }, { status: 404 })
    if (!program.delivered_at || !program.pdf_url) {
      return NextResponse.json({ error: 'Program not yet delivered' }, { status: 403 })
    }

    // Vérifier ownership (sauf admin)
    const isAdmin = isAdminEmail(customer.email)
    if (!isAdmin) {
      const { data: profile } = await sb
        .from('profiles')
        .select('id')
        .eq('shopify_customer_id', customer.id)
        .maybeSingle()
      if (!profile || profile.id !== program.user_id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Generate signed URL
    const { data: signed, error: signErr } = await sb.storage
      .from(BUCKET)
      .createSignedUrl(program.pdf_url, SIGNED_URL_EXPIRY_SECONDS)

    if (signErr || !signed?.signedUrl) {
      console.error('[pdf] signed URL error:', signErr)
      return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 })
    }

    // Redirection 302 vers le signed URL → le browser télécharge
    return NextResponse.redirect(signed.signedUrl, 302)
  } catch (err) {
    console.error('[pdf] error:', err)
    const msg = err instanceof Error ? err.message : 'Unknown'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
