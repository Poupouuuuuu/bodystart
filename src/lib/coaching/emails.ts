/**
 * Templates emails coaching — Resend.
 *
 * Tous les emails sont :
 *   - Envoyés depuis `Body Start Coaching <onboarding@resend.dev>` (sandbox Sprint 2)
 *     → à remplacer par un domaine perso vérifié sur Resend en prod (cf. Sprint 5)
 *   - Stylés HTML simple (table-based pour compat clients mail)
 *   - Tous les inputs utilisateurs sont escapés (XSS protection)
 *
 * Idempotent par design : le webhook peut retry, l'audit log côté DB
 * (programs.client_email_sent_at) empêche le double envoi.
 */
import { Resend } from 'resend'

const FROM = 'Body Start Coaching <onboarding@resend.dev>'

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('[emails] RESEND_API_KEY manquant.')
  }
  return new Resend(apiKey)
}

function escapeHtml(s: string | null | undefined): string {
  if (s == null) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodystart.vercel.app').replace(/\/$/, '')
}

function getCoachEmail(): string | null {
  const csv = process.env.COACHING_ADMIN_EMAILS ?? ''
  return csv.split(',')[0]?.trim() || null
}

// ============================================================
// EMAIL 1 — Bienvenue client après paiement
// ============================================================
export async function sendWelcomeAfterPayment(opts: {
  to: string
  firstName?: string | null
  tier: 'oneshot' | 'monthly_followup'
}): Promise<void> {
  const resend = getResend()
  const isMonthly = opts.tier === 'monthly_followup'
  const intakeUrl = `${getSiteUrl()}/coaching/intake`

  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: isMonthly
      ? '✅ Bienvenue dans le Suivi Personnalisé Body Start'
      : '✅ Ton Programme Personnalisé Body Start',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a2e23; padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; margin: 0;">
            Body Start Coaching
          </h1>
        </div>
        <div style="padding: 32px; background: #ffffff;">
          <h2 style="color: #1a2e23; font-size: 20px; margin: 0 0 16px;">
            Bienvenue ${escapeHtml(opts.firstName ?? '')} 👋
          </h2>
          <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
            Ton paiement a bien été reçu. Pour que notre coach puisse construire ton programme
            sur-mesure, nous avons besoin de quelques informations.
          </p>
          <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
            Remplis dès maintenant ton <strong>questionnaire d'intake</strong> (~5 minutes) en
            cliquant sur le bouton ci-dessous :
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${intakeUrl}" style="display: inline-block; background: #1a2e23; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 999px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
              Remplir mon intake
            </a>
          </div>
          ${
            isMonthly
              ? `<p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin-top: 24px; padding: 16px; background: #f0fdf4; border-left: 4px solid #15803d;">
                  🎁 <strong>Ton avantage abonné :</strong> tu bénéficies désormais d'une
                  réduction permanente de -15% sur l'ensemble du shop Body Start.
                  Le code apparaît dans ton espace coaching.
                </p>`
              : ''
          }
          <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 24px 0 0;">
            Une fois ton intake soumis, notre coach prendra le relais et te délivrera ton
            programme sous <strong>48 à 72h</strong> en PDF dans ton espace personnel.
          </p>
        </div>
        <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 2px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">
            Body Start Nutrition · 8 Rue du Pont des Landes, 78310 Coignières · 07 61 84 75 80
          </p>
        </div>
      </div>
    `,
  })
}

// ============================================================
// EMAIL 2 — Notif coach quand l'intake est soumis
// ============================================================
export async function sendIntakeReceivedToCoach(opts: {
  intakeId: string
  clientEmail: string
  clientName: string
  tier: 'oneshot' | 'monthly_followup'
  intakeFields: Record<string, unknown>
}): Promise<void> {
  const coachEmail = getCoachEmail()
  if (!coachEmail) {
    console.warn('[emails] COACHING_ADMIN_EMAILS non configuré, email coach skip.')
    return
  }
  const resend = getResend()
  const adminUrl = `${getSiteUrl()}/admin/programs/${opts.intakeId}`

  // Format des champs intake en HTML
  const rows = Object.entries(opts.intakeFields)
    .filter(([k]) => !['id', 'user_id', 'status', 'created_at'].includes(k))
    .map(([k, v]) => {
      const label = escapeHtml(
        k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      )
      let displayValue: string
      if (v == null || v === '') displayValue = '<em style="color:#9ca3af">non renseigné</em>'
      else if (Array.isArray(v)) displayValue = v.length ? escapeHtml(v.join(', ')) : '<em style="color:#9ca3af">aucun</em>'
      else if (typeof v === 'object') displayValue = `<pre style="margin:0;font-size:12px">${escapeHtml(JSON.stringify(v, null, 2))}</pre>`
      else displayValue = escapeHtml(String(v))
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;width:200px;vertical-align:top">${label}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#111827;font-size:14px">${displayValue}</td>
      </tr>`
    })
    .join('')

  await resend.emails.send({
    from: FROM,
    to: coachEmail,
    subject: `🆕 Nouvel intake — ${opts.clientName} (${opts.tier === 'monthly_followup' ? 'abo mensuel' : 'one-shot 49€'})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
        <div style="background: #1a2e23; padding: 24px;">
          <h1 style="color: #ffffff; font-size: 18px; font-weight: 900; margin: 0;">
            🆕 Nouvel intake reçu
          </h1>
        </div>
        <div style="padding: 24px; background: #ffffff;">
          <table style="width: 100%; margin-bottom: 24px; border-collapse: collapse">
            <tr>
              <td style="padding:8px 12px;background:#f9fafb;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;width:200px">Client</td>
              <td style="padding:8px 12px;background:#f9fafb;color:#111827;font-size:14px;font-weight:600">${escapeHtml(opts.clientName)} &lt;${escapeHtml(opts.clientEmail)}&gt;</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase">Offre</td>
              <td style="padding:8px 12px;color:#111827;font-size:14px;font-weight:600">${opts.tier === 'monthly_followup' ? '89€/mois — Suivi Personnalisé' : '49€ one-shot — Programme Personnalisé'}</td>
            </tr>
            <tr>
              <td style="padding:8px 12px;background:#f9fafb;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase">Intake ID</td>
              <td style="padding:8px 12px;background:#f9fafb;color:#111827;font-size:13px"><code>${escapeHtml(opts.intakeId)}</code></td>
            </tr>
          </table>

          <h2 style="color: #1a2e23; font-size: 16px; font-weight: 900; text-transform: uppercase; margin: 0 0 12px;">
            Réponses du formulaire
          </h2>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb">
            ${rows}
          </table>

          <div style="text-align: center; margin: 32px 0 16px;">
            <a href="${adminUrl}" style="display: inline-block; background: #1a2e23; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 999px; font-weight: 700; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">
              Ouvrir dans l'admin
            </a>
          </div>

          <p style="color: #6b7280; font-size: 12px; margin: 16px 0 0;">
            Prochaine étape : génère le programme PDF dans ton autre chat Claude, puis upload-le
            depuis l'interface admin pour livrer au client.
          </p>
        </div>
      </div>
    `,
  })
}

// ============================================================
// EMAIL 3 — Programme prêt côté client
// ============================================================
export async function sendProgramReadyToClient(opts: {
  to: string
  firstName?: string | null
  programId: string
}): Promise<void> {
  const resend = getResend()
  const programUrl = `${getSiteUrl()}/account/coaching/programmes/${opts.programId}`

  await resend.emails.send({
    from: FROM,
    to: opts.to,
    subject: '🎯 Ton programme Body Start est prêt',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a2e23; padding: 32px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 22px; font-weight: 900; text-transform: uppercase; letter-spacing: -0.5px; margin: 0;">
            🎯 Ton programme est prêt
          </h1>
        </div>
        <div style="padding: 32px; background: #ffffff;">
          <h2 style="color: #1a2e23; font-size: 20px; margin: 0 0 16px;">
            Salut ${escapeHtml(opts.firstName ?? '')},
          </h2>
          <p style="color: #374151; font-size: 15px; line-height: 1.7; margin: 0 0 16px;">
            Notre coach vient de finaliser ton programme personnalisé.
            Il est disponible dans ton espace coaching, prêt à télécharger en PDF.
          </p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${programUrl}" style="display: inline-block; background: #1a2e23; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 999px; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
              Accéder à mon programme
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 24px 0 0;">
            On te recommande de prendre 10 minutes au calme pour parcourir tout le programme
            avant de commencer. Si tu as une question, écris-nous depuis ton espace.
          </p>
        </div>
        <div style="background: #f9fafb; padding: 16px 32px; text-align: center; border-top: 2px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">
            Body Start Nutrition · 8 Rue du Pont des Landes, 78310 Coignières · 07 61 84 75 80
          </p>
        </div>
      </div>
    `,
  })
}
