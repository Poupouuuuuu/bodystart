import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { verifyShopifyHmac } from '@/lib/loyalty/verify-hmac'
import { buildBackInStockEmail, parseInventoryLevelPayload } from '@/lib/stock-alerts/core'

// ============================================================
// POST /api/stock-alert/webhook — Shopify `inventory_levels/update`
// ============================================================
// Créé dans l'admin Shopify (Paramètres → Notifications → Webhooks), donc
// signé avec le secret partagé de la boutique (SHOPIFY_WEBHOOK_SECRET), comme
// le webhook fidélité. Appelé à CHAQUE mouvement de stock (ventes caisse
// comprises) : le chemin « rien à faire » doit rester très court.
//
// 1. Raw body + HMAC → 401 si invalide.
// 2. available <= 0 → 200 (rien à faire).
// 3. Réclamation atomique des alertes en attente sur cet inventory_item
//    (UPDATE … WHERE notified_at IS NULL RETURNING) → pas de doublon si deux
//    webhooks arrivent en même temps.
// 4. Envoi Resend en lot. En cas d'échec, on remet notified_at à NULL et on
//    répond 500 : Shopify rejoue le webhook, l'alerte sera renvoyée.

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const FROM = process.env.RESEND_FROM ?? 'BodyStart Nutrition <onboarding@resend.dev>'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodystart-nutrition.fr'
const MAX_PER_EVENT = 100 // taille max d'un lot Resend

interface AlertRow {
  id: string
  email: string
  product_handle: string
  product_title: string
  variant_title: string | null
}

export async function POST(req: Request) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET
  const rawBody = await req.text()
  const hmacHeader = req.headers.get('x-shopify-hmac-sha256')
  if (!secret || !verifyShopifyHmac({ rawBody, hmacHeader, secret })) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let payload: unknown
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  const level = parseInventoryLevelPayload(payload)
  if (!level) return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  if (level.available === null || level.available <= 0) {
    return NextResponse.json({ ok: true, skipped: 'not_available' })
  }

  const supabase = getLoyaltyAdminClient()
  const now = new Date().toISOString()
  const { data: claimed, error: claimError } = await supabase
    .from('stock_alerts')
    .update({ notified_at: now })
    .eq('inventory_item_id', level.inventoryItemId)
    .is('notified_at', null)
    .select('id, email, product_handle, product_title, variant_title')
    .limit(MAX_PER_EVENT)
  if (claimError) {
    console.error('[stock-alert/webhook] claim', claimError)
    return NextResponse.json({ error: 'db' }, { status: 500 })
  }
  const rows = (claimed ?? []) as AlertRow[]
  if (rows.length === 0) return NextResponse.json({ ok: true, sent: 0 })

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
    console.error('[stock-alert/webhook] resend', err)
    // Libère les alertes pour que le rejeu Shopify les renvoie.
    await supabase
      .from('stock_alerts')
      .update({ notified_at: null })
      .in('id', rows.map((r) => r.id))
    return NextResponse.json({ error: 'email' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, sent: rows.length })
}
