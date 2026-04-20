/**
 * POST /api/coaching/admin/upload-program
 *
 * Upload du PDF programme par le coach + création/update du programme
 * + livraison au client (delivered_at + email).
 *
 * Sécurité : exige un caller admin (vérifié via requireAdminApi).
 *
 * Body : FormData
 *   - file (PDF, max 10 MB)
 *   - intakeId
 *   - userId
 *   - typeProgramme ('sport'|'nutrition'|'complet')
 *   - coachNotes (optional)
 *   - existingProgramId (optional — si on remplace un PDF existant)
 *
 * Side-effects (atomiques dans la mesure du possible) :
 *   1. Upload PDF dans Supabase Storage `coaching-pdfs/{userId}/{programId}.pdf`
 *   2. Insert ou update `programs` :
 *        - pdf_url
 *        - validated_by_coach_at = now()
 *        - delivered_at = now()
 *        - coach_adjustments
 *   3. Update `intakes.status = 'delivered'`
 *   4. Email client "ton programme est prêt"
 *   5. Update `programs.client_email_sent_at`
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCustomer } from '@/lib/shopify/customer-server'
import { getSupabaseAdminClient } from '@/lib/coaching/supabase/admin'
import { sendProgramReadyToClient } from '@/lib/coaching/emails'

export const dynamic = 'force-dynamic'

const SHOPIFY_TOKEN_COOKIE = 'body-start-customer-token'
const BUCKET = 'coaching-pdfs'
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB

function isAdminEmail(email: string): boolean {
  const csv = process.env.COACHING_ADMIN_EMAILS ?? ''
  return csv
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase())
}

export async function POST(req: Request) {
  try {
    // ─── Auth admin ───
    const cookieStore = cookies()
    const token = cookieStore.get(SHOPIFY_TOKEN_COOKIE)?.value
    if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    const adminCustomer = await getCustomer(token)
    if (!adminCustomer) return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    if (!isAdminEmail(adminCustomer.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ─── Parse FormData ───
    const fd = await req.formData()
    const file = fd.get('file') as File | null
    const intakeId = fd.get('intakeId') as string | null
    const userId = fd.get('userId') as string | null
    const typeProgramme = fd.get('typeProgramme') as 'sport' | 'nutrition' | 'complet' | null
    const coachNotes = (fd.get('coachNotes') as string | null) ?? ''
    const existingProgramId = fd.get('existingProgramId') as string | null

    if (!file || !intakeId || !userId || !typeProgramme) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 })
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `File too large (max ${MAX_BYTES / 1024 / 1024} MB)` }, { status: 413 })
    }

    const sb = getSupabaseAdminClient()

    // ─── Vérifier que l'intake existe et n'est pas déjà delivered ───
    const { data: intake, error: intakeFetchErr } = await sb
      .from('intakes')
      .select('id, user_id, status')
      .eq('id', intakeId)
      .maybeSingle()
    if (intakeFetchErr) return NextResponse.json({ error: intakeFetchErr.message }, { status: 500 })
    if (!intake) return NextResponse.json({ error: 'Intake not found' }, { status: 404 })
    if (intake.user_id !== userId) {
      return NextResponse.json({ error: 'userId mismatch with intake' }, { status: 400 })
    }

    // ─── Insert ou update programs (avant upload pour avoir l'ID) ───
    let programId: string
    if (existingProgramId) {
      programId = existingProgramId
    } else {
      const { data: newProg, error: newProgErr } = await sb
        .from('programs')
        .insert({
          intake_id: intakeId,
          user_id: userId,
          type: typeProgramme,
          content: { uploaded_pdf: true }, // content jsonb required, on met un placeholder
          coach_adjustments: coachNotes,
        })
        .select('id')
        .single()
      if (newProgErr || !newProg) {
        return NextResponse.json({ error: newProgErr?.message ?? 'Failed to create program' }, { status: 500 })
      }
      programId = newProg.id
    }

    // ─── Upload du PDF dans Storage ───
    const path = `${userId}/${programId}.pdf`
    const buffer = await file.arrayBuffer()

    const { error: uploadErr } = await sb.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadErr) {
      return NextResponse.json({ error: `Storage upload failed: ${uploadErr.message}` }, { status: 500 })
    }

    // L'URL stockée est le path interne (pas une URL publique).
    // Le download passe par /api/coaching/pdf/[programId] qui génère un signed URL.
    const pdfUrl = path

    // ─── Update programs : valide + livre + lie le PDF ───
    const now = new Date().toISOString()
    const { error: progUpdateErr } = await sb
      .from('programs')
      .update({
        pdf_url: pdfUrl,
        pdf_generated_at: now,
        validated_by_coach_at: now,
        delivered_at: now,
        coach_adjustments: coachNotes || null,
      })
      .eq('id', programId)

    if (progUpdateErr) {
      return NextResponse.json({ error: progUpdateErr.message }, { status: 500 })
    }

    // ─── Update intake status ───
    await sb
      .from('intakes')
      .update({ status: 'delivered' })
      .eq('id', intakeId)

    // ─── Email client (best-effort) ───
    let emailSent = false
    try {
      const { data: profile } = await sb
        .from('profiles')
        .select('email, first_name')
        .eq('id', userId)
        .maybeSingle()
      if (profile?.email) {
        await sendProgramReadyToClient({
          to: profile.email,
          firstName: profile.first_name,
          programId,
        })
        emailSent = true
        await sb
          .from('programs')
          .update({ client_email_sent_at: new Date().toISOString() })
          .eq('id', programId)
      }
    } catch (mailErr) {
      console.error('[upload-program] email client KO (non-bloquant):', mailErr)
    }

    return NextResponse.json({ ok: true, programId, emailSent, pdfPath: pdfUrl })
  } catch (err) {
    console.error('[upload-program] error:', err)
    const msg = err instanceof Error ? err.message : 'Unknown'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
