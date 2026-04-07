import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const TO = process.env.CONTACT_EMAIL_TO ?? 'bodystartnutrition@gmail.com'

// ─── Rate limiter : 5 requêtes / 10 min par IP (optionnel si Upstash non configuré) ───
let ratelimit: { limit: (key: string) => Promise<{ success: boolean; remaining: number }> } | null = null
if (process.env.UPSTASH_REDIS_REST_URL && !process.env.UPSTASH_REDIS_REST_URL.includes('xxx')) {
  const { Ratelimit } = require('@upstash/ratelimit')
  const { Redis } = require('@upstash/redis')
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '10 m'),
    analytics: true,
    prefix: 'ratelimit:contact',
  })
}

// ─── Échappement HTML ────────────────────────────────────────
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
    // ─── Rate limiting (skip si Upstash non configuré) ───
    if (ratelimit) {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
      const { success, remaining } = await ratelimit.limit(ip)

      if (!success) {
        return NextResponse.json(
          { error: 'Trop de requêtes. Réessayez dans quelques minutes.' },
          { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
        )
      }
    }

    const body = await req.json()
    const { name, email, phone, objectif, message } = body

    if (!name || !email || !objectif) {
      return NextResponse.json({ error: 'Champs requis manquants.' }, { status: 400 })
    }

    // ─── Échapper tous les champs utilisateur ───
    const safeName = escapeHtml(name)
    const safeEmail = escapeHtml(email)
    const safePhone = phone ? escapeHtml(phone) : ''
    const safeMessage = message ? escapeHtml(message) : ''

    const objectifLabels: Record<string, string> = {
      'prise-de-muscle': '💪 Prise de muscle',
      'perte-de-poids': '🔥 Perte de poids',
      'energie': '⚡ Énergie & Endurance',
      'recuperation': '🌙 Récupération',
      'immunite': '🛡️ Immunité',
      'autre': '❓ Autre',
    }
    const objectifLabel = objectifLabels[objectif] ?? escapeHtml(objectif)

    await resend.emails.send({
      from: 'Body Start Nutrition <onboarding@resend.dev>',
      to: TO,
      replyTo: email,
      subject: `🏋️ Nouvelle demande de conseil — ${safeName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 0;">
          <div style="background: #111827; padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; margin: 0;">
              Body Start Nutrition
            </h1>
            <p style="color: #6b7280; margin: 8px 0 0; font-size: 12px; text-transform: uppercase; letter-spacing: 2px;">
              Nouvelle demande de conseil
            </p>
          </div>

          <div style="padding: 32px; background: #ffffff; border-left: 4px solid #15803d;">
            <h2 style="color: #111827; font-size: 18px; font-weight: 800; text-transform: uppercase; margin: 0 0 24px;">
              ${safeName} souhaite un conseil personnalisé
            </h2>

            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6b7280; width: 140px;">Nom</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #111827; font-weight: 600;">${safeName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6b7280;">Email</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #111827; font-weight: 600;">
                  <a href="mailto:${safeEmail}" style="color: #15803d;">${safeEmail}</a>
                </td>
              </tr>
              ${safePhone ? `<tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6b7280;">Téléphone</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #111827; font-weight: 600;">
                  <a href="tel:${safePhone}" style="color: #15803d;">${safePhone}</a>
                </td>
              </tr>` : ''}
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6b7280;">Objectif</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #f3f4f6; font-size: 14px; color: #15803d; font-weight: 800; text-transform: uppercase;">${objectifLabel}</td>
              </tr>
              ${safeMessage ? `<tr>
                <td style="padding: 10px 0; font-size: 12px; font-weight: 700; text-transform: uppercase; color: #6b7280; vertical-align: top;">Message</td>
                <td style="padding: 10px 0; font-size: 14px; color: #374151; line-height: 1.6;">${safeMessage.replace(/\n/g, '<br>')}</td>
              </tr>` : ''}
            </table>
          </div>

          <div style="background: #f9fafb; padding: 20px 32px; border-top: 2px solid #e5e7eb;">
            <p style="margin: 0; font-size: 12px; color: #9ca3af; text-align: center;">
              📍 Body Start Nutrition — 8 Rue du Pont des Landes, 78310 Coignières · 07 61 84 75 80
            </p>
          </div>
        </div>
      `,
    })

    // Email de confirmation au client
    await resend.emails.send({
      from: 'Body Start Nutrition <onboarding@resend.dev>',
      to: email,
      subject: 'Votre demande de conseil a bien été reçue — Body Start',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #111827; padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; margin: 0;">
              Body Start Nutrition
            </h1>
          </div>
          <div style="padding: 32px; background: #ffffff;">
            <h2 style="color: #111827; font-size: 20px; font-weight: 800; margin: 0 0 16px;">
              Bonjour ${safeName} 👋
            </h2>
            <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
              Nous avons bien reçu votre demande de conseil pour l'objectif <strong style="color: #15803d;">${objectifLabel}</strong>.
            </p>
            <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
              Notre équipe va vous contacter sous <strong>24–48h</strong> pour vous proposer un rendez-vous personnalisé en boutique.
            </p>
            <div style="background: #f0fdf4; border: 2px solid #15803d; border-radius: 4px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0; font-size: 13px; font-weight: 700; text-transform: uppercase; color: #15803d; letter-spacing: 1px;">Notre boutique</p>
              <p style="margin: 8px 0 0; color: #111827; font-size: 14px; font-weight: 600;">8 Rue du Pont des Landes, 78310 Coignières</p>
              <p style="margin: 4px 0 0; color: #6b7280; font-size: 13px;">Ouvert 7j/7 · 11h–19h</p>
            </div>
            <p style="color: #9ca3af; font-size: 13px; margin: 0;">
              Pour toute question urgente : <a href="tel:+33761847580" style="color: #15803d;">07 61 84 75 80</a>
            </p>
          </div>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Contact API] Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
