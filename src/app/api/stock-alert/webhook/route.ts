import { NextResponse } from 'next/server'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { verifyShopifyHmac } from '@/lib/loyalty/verify-hmac'
import { parseInventoryLevelPayload } from '@/lib/stock-alerts/core'
import { MAX_BATCH, sendAlerts, type AlertRow } from '@/lib/stock-alerts/notify'

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
// 4. Envoi Resend en lot (lib/stock-alerts/notify). En cas d'échec, notified_at
//    est remis à NULL et on répond 500 : Shopify rejoue le webhook.
// Filet de sécurité quotidien : /api/stock-alert/sweep (cron Vercel).

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
    .limit(MAX_BATCH)
  if (claimError) {
    console.error('[stock-alert/webhook] claim', claimError)
    return NextResponse.json({ error: 'db' }, { status: 500 })
  }
  const rows = (claimed ?? []) as AlertRow[]
  if (rows.length === 0) return NextResponse.json({ ok: true, sent: 0 })

  try {
    const sent = await sendAlerts(supabase, rows)
    return NextResponse.json({ ok: true, sent })
  } catch (err) {
    console.error('[stock-alert/webhook] resend', err)
    return NextResponse.json({ error: 'email' }, { status: 500 })
  }
}
