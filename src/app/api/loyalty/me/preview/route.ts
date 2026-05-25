/**
 * POST /api/loyalty/me/preview
 *
 * Preview cagnotte pour le client Shopify connecte.
 * Auth via cookie body-start-customer-token.
 *
 * Body : { cartSubtotalCents: integer >= 0 }
 * Reponse : voir PreviewOutput de preview-core.ts
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { resolveLoyaltyForSession } from '@/lib/loyalty/session'
import { buildPreview } from '@/lib/loyalty/preview-core'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BodySchema = z.object({
  cartSubtotalCents: z.number().int().min(0),
})

export async function POST(req: Request) {
  const session = await resolveLoyaltyForSession()
  if (session.state === 'logged_out') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  if (session.state === 'not_enrolled') {
    return NextResponse.json({ error: 'not_enrolled' }, { status: 403 })
  }

  let parsed: z.infer<typeof BodySchema>
  try {
    const body = await req.json()
    parsed = BodySchema.parse(body)
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: err instanceof Error ? err.message : 'parse error' },
      { status: 400 }
    )
  }

  const preview = buildPreview({
    customer: {
      id: session.customer.id,
      loyaltyBalanceCents: session.customer.loyaltyBalanceCents,
    },
    cartSubtotalCents: parsed.cartSubtotalCents,
  })

  return NextResponse.json(preview)
}
