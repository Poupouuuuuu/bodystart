/**
 * POST /api/loyalty/admin/ambassadors/[id]/adjust — ajustement MANUEL de la
 * cagnotte (gated requireAdmin). Body : { deltaCents: int ≠ 0, reason: 1..200 }.
 * deltaCents > 0 = crédit (rattrapage), < 0 = déduction (ex. dépense caisse POS).
 * Plancher 0 + plafonnement + cap ±1 000 € = autoritaires côté RPC SQL.
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { requireAdmin } from '@/lib/loyalty/admin'
import { adjustAmbassadorCagnotte, AMBASSADOR_MANUAL_ADJUST_MAX_CENTS } from '@/lib/loyalty/ambassador'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const AdjustSchema = z.object({
  deltaCents: z
    .number()
    .int()
    .refine((n) => n !== 0, 'deltaCents must be non-zero')
    .refine((n) => Math.abs(n) <= AMBASSADOR_MANUAL_ADJUST_MAX_CENTS, 'deltaCents exceeds cap'),
  reason: z.string().trim().min(1).max(200),
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const gate = await requireAdmin()
  if (!gate.ok) return NextResponse.json({ error: 'forbidden' }, { status: gate.status })

  if (!UUID_RE.test(params.id)) {
    return NextResponse.json({ error: 'invalid_id' }, { status: 400 })
  }

  let body: z.infer<typeof AdjustSchema>
  try {
    body = AdjustSchema.parse(await req.json())
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: err instanceof Error ? err.message : 'parse error' },
      { status: 400 }
    )
  }

  const supabase = getLoyaltyAdminClient()
  let result: Awaited<ReturnType<typeof adjustAmbassadorCagnotte>>
  try {
    result = await adjustAmbassadorCagnotte(supabase, {
      ambassadorId: params.id,
      deltaCents: body.deltaCents,
      reason: body.reason,
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'rpc_failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 500 }
    )
  }

  if (!result.ok) {
    // reason ∈ ambassador_not_found | zero_delta | exceeds_cap | reason_required
    const status = result.reason === 'ambassador_not_found' ? 404 : 400
    return NextResponse.json({ error: result.reason ?? 'adjust_failed', maxCents: result.maxCents }, { status })
  }

  return NextResponse.json({
    ok: true,
    reason: result.reason, // 'applied' | 'no_change'
    ambassadorId: result.ambassadorId,
    requestedDeltaCents: result.requestedDeltaCents,
    appliedDeltaCents: result.appliedDeltaCents,
    newBalanceCents: result.newBalanceCents,
    capped: result.capped,
  })
}
