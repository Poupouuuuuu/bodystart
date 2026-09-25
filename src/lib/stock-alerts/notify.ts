/**
 * Envoi des alertes « De retour en stock » (Resend) pour des lignes déjà
 * réclamées (notified_at posé). Partagé par le webhook inventory_levels/update
 * et le cron de rattrapage /api/stock-alert/sweep.
 *
 * En cas d'échec d'envoi, notified_at est remis à NULL sur les lignes
 * concernées pour qu'un prochain passage les renvoie, puis l'erreur est relancée.
 *
 * Serveur uniquement (service_role + clé Resend).
 */
import type { SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { buildBackInStockEmail } from './core'

export const FROM = process.env.RESEND_FROM ?? 'BodyStart Nutrition <onboarding@resend.dev>'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodystart-nutrition.fr'
/** Taille max d'un lot Resend : on ne réclame jamais plus d'alertes que ça d'un coup. */
export const MAX_BATCH = 100

export interface AlertRow {
  id: string
  email: string
  product_handle: string
  product_title: string
  variant_title: string | null
}

export async function sendAlerts(supabase: SupabaseClient, rows: AlertRow[]): Promise<number> {
  if (rows.length === 0) return 0
  const resend = new Resend(process.env.RESEND_API_KEY)
  try {
    const batch = rows.map((row) => {
      const mail = buildBackInStockEmail({
        productTitle: row.product_title,
        variantTitle: row.variant_title,
        productHandle: row.product_handle,
        siteUrl: SITE_URL,
      })
      return { from: FROM, to: row.email, subject: mail.subject, html: mail.html, text: mail.text }
    })
    const { error } = await resend.batch.send(batch)
    if (error) throw new Error(error.message)
  } catch (err) {
    await supabase
      .from('stock_alerts')
      .update({ notified_at: null })
      .in('id', rows.map((r) => r.id))
    throw err
  }
  return rows.length
}
