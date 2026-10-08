import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { isAuthorizedCron } from '@/lib/stock-alerts/core'
import { buildRecap, loadRecapData, renderRecapEmail } from '@/lib/jeu-roue/recap'
import { CONTACT_EMAIL } from '@/lib/store-info'

// ============================================================
// GET /api/jeu/recap : cron Vercel du lundi (vercel.json)
// ============================================================
// Récap du jeu de la roue sur les 7 derniers jours (participations, lots,
// codes utilisés en caisse ou en ligne, case offres cochée, stock des lots),
// envoyé par e-mail à l'adresse de contact de la boutique.
//
// Auth : Vercel appelle la route avec « Authorization: Bearer <CRON_SECRET> ».
// Sans CRON_SECRET configuré, la route refuse tout (fail closed).

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

const FROM = process.env.RESEND_FROM ?? 'BodyStart Nutrition <onboarding@resend.dev>'

export async function GET(req: Request) {
  if (!isAuthorizedCron(req.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let recap
  try {
    recap = buildRecap(await loadRecapData(), new Date())
  } catch (err) {
    console.error('[jeu-roue/recap] shopify :', err)
    return NextResponse.json({ error: 'shopify' }, { status: 502 })
  }

  const mail = renderRecapEmail(recap)
  try {
    const { error } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: FROM,
      to: CONTACT_EMAIL,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    })
    if (error) throw new Error(error.message)
  } catch (err) {
    console.error('[jeu-roue/recap] resend :', err)
    return NextResponse.json({ error: 'email' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    plays: recap.week.plays,
    used: recap.week.uses.length,
    total: recap.total.plays,
  })
}
