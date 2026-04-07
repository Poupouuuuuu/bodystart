import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID ?? ''

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const body = await req.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email requis.' }, { status: 400 })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Email invalide.' }, { status: 400 })
    }

    // Ajouter le contact à l'audience Resend (si configurée)
    if (AUDIENCE_ID) {
      try {
        await resend.contacts.create({
          email,
          audienceId: AUDIENCE_ID,
          unsubscribed: false,
        })
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        if (message.includes('already exists')) {
          return NextResponse.json({ error: 'Cet email est déjà inscrit.' }, { status: 409 })
        }
        throw err
      }
    }

    // Email de bienvenue
    const safeEmail = escapeHtml(email)
    await resend.emails.send({
      from: 'Body Start Nutrition <onboarding@resend.dev>',
      to: email,
      subject: 'Bienvenue dans la communauté Body Start ! Votre code -10%',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #111827; padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; margin: 0;">
              Body Start Nutrition
            </h1>
          </div>
          <div style="padding: 32px; background: #ffffff;">
            <h2 style="color: #111827; font-size: 22px; font-weight: 800; margin: 0 0 16px;">
              Bienvenue dans la communauté !
            </h2>
            <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
              Merci pour votre inscription. Voici votre code de réduction pour votre première commande :
            </p>
            <div style="background: #f0fdf4; border: 2px solid #15803d; border-radius: 4px; padding: 24px; margin-bottom: 24px; text-align: center;">
              <p style="margin: 0 0 8px; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #15803d; letter-spacing: 2px;">Votre code promo</p>
              <p style="margin: 0; font-size: 32px; font-weight: 900; color: #15803d; letter-spacing: 2px;">BIENVENUE10</p>
              <p style="margin: 8px 0 0; font-size: 13px; color: #6b7280;">-10% sur votre première commande</p>
            </div>
            <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
              Chaque semaine, vous recevrez nos conseils nutrition, offres exclusives et nouveautés.
            </p>
            <p style="color: #9ca3af; font-size: 12px; margin: 24px 0 0;">
              Vous pouvez vous désabonner à tout moment en cliquant sur le lien en bas de chaque email.
            </p>
          </div>
          <div style="background: #f9fafb; padding: 20px 32px; border-top: 2px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
              Body Start Nutrition — 8 Rue du Pont des Landes, 78310 Coignieres
            </p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Newsletter API] Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
