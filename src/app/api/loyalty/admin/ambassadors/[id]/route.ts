/**
 * PATCH /api/loyalty/admin/ambassadors/[id] — désactiver/réactiver (gated).
 * Body : { active: boolean }. Ne touche QUE le flag `active` (historique cagnotte
 * intact). Quand active=false, le webhook orders/paid ne crédite plus (il filtre
 * sur active). NB : le code Shopify -10% reste actif côté boutique (voir rapport).
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { requireAdmin } from '@/lib/loyalty/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const PatchSchema = z.object({ active: z.boolean() })
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const gate = await requireAdmin()
  if (!gate.ok) return NextResponse.json({ error: 'forbidden' }, { status: gate.status })

  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }

  let body: z.infer<typeof PatchSchema>
  try {
    body = PatchSchema.parse(await req.json())
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: err instanceof Error ? err.message : 'parse error' },
      { status: 400 }
    )
  }

  const supabase = getLoyaltyAdminClient()
  const { data, error } = await supabase
    .from('ambassadors')
    .update({ active: body.active })
    .eq('id', id)
    .select('id, active')
    .maybeSingle()

  if (error) return NextResponse.json({ error: 'update_failed', detail: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 })

  return NextResponse.json({ ok: true, id: data.id, active: data.active })
}
