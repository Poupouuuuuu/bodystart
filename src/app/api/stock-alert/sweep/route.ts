import { NextResponse } from 'next/server'
import { shopifyAdminFetch } from '@/lib/shopify/client'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { chunk, isAuthorizedCron, selectBackInStockVariantIds, type VariantAvailabilityNode } from '@/lib/stock-alerts/core'
import { MAX_BATCH, sendAlerts, type AlertRow } from '@/lib/stock-alerts/notify'

// ============================================================
// GET /api/stock-alert/sweep — cron Vercel quotidien (vercel.json)
// ============================================================
// Filet de sécurité du webhook inventory_levels/update : si un retour en stock
// n'a pas déclenché d'email (webhook manqué, Resend en panne au mauvais moment,
// stock rentré par un canal qui n'émet pas l'événement), on relit les alertes
// en attente, on demande à Shopify quelles variantes sont de nouveau
// disponibles, et on envoie.
//
// Auth : Vercel appelle la route avec « Authorization: Bearer <CRON_SECRET> ».
// Sans CRON_SECRET configuré, la route refuse tout (fail closed).
// Plan Hobby : un déclenchement par jour, à l'heure près.

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

const MAX_PENDING = 500

const VARIANTS_QUERY = `
  query SweepVariants($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        availableForSale
        product { status }
      }
    }
  }
`

interface VariantsResult {
  nodes: Array<VariantAvailabilityNode | null>
}

export async function GET(req: Request) {
  if (!isAuthorizedCron(req.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const supabase = getLoyaltyAdminClient()
  const { data: pending, error: pendingError } = await supabase
    .from('stock_alerts')
    .select('id, variant_id')
    .is('notified_at', null)
    .limit(MAX_PENDING)
  if (pendingError) {
    console.error('[stock-alert/sweep] pending', pendingError)
    return NextResponse.json({ error: 'db' }, { status: 500 })
  }
  const rows = (pending ?? []) as Array<{ id: string; variant_id: string }>
  if (rows.length === 0) return NextResponse.json({ ok: true, pending: 0, back: 0, sent: 0 })

  const variantIds = [...new Set(rows.map((r) => r.variant_id))]
  const nodes: Array<VariantAvailabilityNode | null> = []
  try {
    for (const ids of chunk(variantIds, 50)) {
      const data = await shopifyAdminFetch<VariantsResult>(VARIANTS_QUERY, { ids })
      nodes.push(...data.nodes)
    }
  } catch (err) {
    console.error('[stock-alert/sweep] shopify', err)
    return NextResponse.json({ error: 'shopify' }, { status: 502 })
  }
  const back = selectBackInStockVariantIds(nodes)
  if (back.length === 0) return NextResponse.json({ ok: true, pending: rows.length, back: 0, sent: 0 })

  // Réclamation atomique (même garde que le webhook) : pas de doublon si le
  // webhook passe au même moment.
  const { data: claimed, error: claimError } = await supabase
    .from('stock_alerts')
    .update({ notified_at: new Date().toISOString() })
    .in('variant_id', back)
    .is('notified_at', null)
    .select('id, email, product_handle, product_title, variant_title')
    .limit(MAX_BATCH)
  if (claimError) {
    console.error('[stock-alert/sweep] claim', claimError)
    return NextResponse.json({ error: 'db' }, { status: 500 })
  }

  try {
    const sent = await sendAlerts(supabase, (claimed ?? []) as AlertRow[])
    return NextResponse.json({ ok: true, pending: rows.length, back: back.length, sent })
  } catch (err) {
    console.error('[stock-alert/sweep] resend', err)
    return NextResponse.json({ error: 'email' }, { status: 500 })
  }
}
