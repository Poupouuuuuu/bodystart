/**
 * GET /api/loyalty/admin/ambassadors/[id]/commissions — détail commande par
 * commande d'un ambassadeur (admin-gated). Affiche le nom de commande STOCKÉ
 * (shopify_order_name) ; fallback Admin API pour d'éventuelles lignes sans nom.
 */
import { NextResponse } from 'next/server'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { requireAdmin } from '@/lib/loyalty/admin'
import { shopifyAdminFetch } from '@/lib/shopify/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const gate = await requireAdmin()
  if (!gate.ok) return NextResponse.json({ error: 'forbidden' }, { status: gate.status })
  if (!UUID_RE.test(id)) return NextResponse.json({ error: 'invalid_id' }, { status: 400 })

  const supabase = getLoyaltyAdminClient()
  const { data, error } = await supabase
    .from('ambassador_commissions')
    .select('shopify_order_id, shopify_order_name, order_subtotal_cents, commission_cents, is_new_customer, status, created_at')
    .eq('ambassador_id', id)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) return NextResponse.json({ error: 'fetch_failed', detail: error.message }, { status: 500 })

  const rows = data ?? []

  // Fallback : récupérer le nom des commandes sans shopify_order_name (legacy).
  const missing = rows.filter((c) => !c.shopify_order_name && c.shopify_order_id)
  const nameById = new Map<string, string>()
  if (missing.length > 0) {
    try {
      const gids = missing.map((c) => `gid://shopify/Order/${c.shopify_order_id}`)
      const Q = `query OrderNames($ids: [ID!]!) { nodes(ids: $ids) { ... on Order { id name } } }`
      const res = await shopifyAdminFetch<{ nodes: Array<{ id: string; name: string } | null> }>(Q, { ids: gids })
      for (const n of res.nodes ?? []) {
        if (n?.id && n?.name) nameById.set(n.id.split('/').pop() ?? n.id, n.name)
      }
    } catch (err) {
      console.warn('[admin commissions] order name fallback failed (non-blocking):', err)
    }
  }

  return NextResponse.json({
    commissions: rows.map((c) => ({
      orderId: c.shopify_order_id,
      orderName: c.shopify_order_name ?? nameById.get(c.shopify_order_id) ?? null,
      subtotalCents: c.order_subtotal_cents,
      commissionCents: c.commission_cents,
      isNewCustomer: c.is_new_customer,
      status: c.status,
      createdAt: c.created_at,
    })),
  })
}
