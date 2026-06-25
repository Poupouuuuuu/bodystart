/**
 * GET /api/loyalty/admin/ambassadors/[id]/transactions — grand livre cagnotte
 * (admin-gated). Sert la sous-section « Mouvements de cagnotte » du détail :
 * commission / revoke / spend / spend_reversal / adjustment / manual_adjustment,
 * avec le sens (signe) déduit du type pour l'affichage.
 */
import { NextResponse } from 'next/server'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { requireAdmin } from '@/lib/loyalty/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Sens d'affichage : +1 crédit, −1 débit. (amount_cents est toujours positif ;
// le signe est porté par le type. manual_adjustment est lui aussi positif en base
// → le sens réel est dans la note ; on l'affiche neutre côté liste.)
const SIGN: Record<string, 1 | -1 | 0> = {
  commission: 1,
  spend_reversal: 1,
  revoke: -1,
  spend: -1,
  adjustment: 0,
  manual_adjustment: 0,
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return NextResponse.json({ error: 'forbidden' }, { status: gate.status })
  if (!UUID_RE.test(params.id)) return NextResponse.json({ error: 'invalid_id' }, { status: 400 })

  const supabase = getLoyaltyAdminClient()
  const { data, error } = await supabase
    .from('ambassador_transactions')
    .select('id, type, amount_cents, balance_after_cents, shopify_order_id, notes, created_at')
    .eq('ambassador_id', params.id)
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) return NextResponse.json({ error: 'fetch_failed', detail: error.message }, { status: 500 })

  return NextResponse.json({
    transactions: (data ?? []).map((t) => ({
      id: t.id,
      type: t.type,
      sign: SIGN[t.type] ?? 0,
      amountCents: t.amount_cents,
      balanceAfterCents: t.balance_after_cents,
      orderId: t.shopify_order_id,
      notes: t.notes,
      createdAt: t.created_at,
    })),
  })
}
