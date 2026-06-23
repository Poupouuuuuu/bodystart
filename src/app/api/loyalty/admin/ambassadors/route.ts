/**
 * Admin — gestion des ambassadeurs (gated requireAdmin EN TÊTE).
 *
 * GET  : liste (nom, email, code, solde, statut, ventes, CA).
 * POST : création — (a) valide+normalise, (b) garde-fous unicité email/code,
 *        (c) crée le code Shopify -10% (recette validée), (d) insère la ligne.
 *        Échec géré : Shopify KO → pas d'insert ; insert KO → suppression
 *        compensatoire du code Shopify (sinon signalement clair).
 */
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import {
  requireAdmin,
  normalizeAmbassadorCode,
  ambassadorCodeFromName,
  withUniquenessSuffix,
} from '@/lib/loyalty/admin'
import { createAmbassadorDiscountCode, deleteDiscountCode } from '@/lib/shopify/loyalty-discounts'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const gate = await requireAdmin()
  if (!gate.ok) return NextResponse.json({ error: 'forbidden' }, { status: gate.status })

  const supabase = getLoyaltyAdminClient()
  const { data: ambs, error } = await supabase
    .from('ambassadors')
    .select('id, name, email, shopify_discount_code, rate, balance_cents, active, created_at')
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: 'fetch_failed', detail: error.message }, { status: 500 })

  const { data: comms } = await supabase
    .from('ambassador_commissions')
    .select('ambassador_id, order_subtotal_cents, status')
    .eq('status', 'credited')

  const statsByAmb = new Map<string, { ordersCount: number; revenueCents: number }>()
  for (const c of comms ?? []) {
    const s = statsByAmb.get(c.ambassador_id) ?? { ordersCount: 0, revenueCents: 0 }
    s.ordersCount += 1
    s.revenueCents += c.order_subtotal_cents ?? 0
    statsByAmb.set(c.ambassador_id, s)
  }

  return NextResponse.json({
    ambassadors: (ambs ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      email: a.email,
      code: a.shopify_discount_code,
      ratePct: Math.round(Number(a.rate) * 100),
      balanceCents: a.balance_cents,
      active: a.active,
      createdAt: a.created_at,
      ordersCount: statsByAmb.get(a.id)?.ordersCount ?? 0,
      revenueCents: statsByAmb.get(a.id)?.revenueCents ?? 0,
    })),
  })
}

const CreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(180),
  code: z.string().trim().max(40).optional(),
})

export async function POST(req: Request) {
  const gate = await requireAdmin()
  if (!gate.ok) return NextResponse.json({ error: 'forbidden' }, { status: gate.status })

  let body: z.infer<typeof CreateSchema>
  try {
    body = CreateSchema.parse(await req.json())
  } catch (err) {
    return NextResponse.json(
      { error: 'invalid_body', detail: err instanceof Error ? err.message : 'parse error' },
      { status: 400 }
    )
  }

  const supabase = getLoyaltyAdminClient()
  const email = body.email.toLowerCase()
  const name = body.name

  // Garde-fou : email déjà ambassadeur ?
  const { data: existingEmail } = await supabase
    .from('ambassadors')
    .select('id')
    .ilike('email', email)
    .maybeSingle()
  if (existingEmail) {
    return NextResponse.json({ error: 'email_exists' }, { status: 409 })
  }

  // Code : custom normalisé OU auto depuis le prénom.
  const isCustom = !!body.code && normalizeAmbassadorCode(body.code).length > 0
  const base = isCustom ? normalizeAmbassadorCode(body.code as string) : ambassadorCodeFromName(name)
  if (!base) {
    return NextResponse.json({ error: 'invalid_code' }, { status: 400 })
  }

  // Codes déjà pris en base (normalisés) → unicité.
  const { data: allCodes } = await supabase.from('ambassadors').select('shopify_discount_code')
  const taken = new Set((allCodes ?? []).map((c) => normalizeAmbassadorCode(c.shopify_discount_code)))
  if (isCustom && taken.has(base)) {
    return NextResponse.json({ error: 'code_exists' }, { status: 409 })
  }

  // Création Shopify (retry suffixe si code pris côté Shopify, pour l'auto-généré).
  let candidate = isCustom ? base : withUniquenessSuffix(base, taken)
  let shopifyNodeId: string | null = null
  for (let attempt = 0; attempt < 6; attempt++) {
    let r: Awaited<ReturnType<typeof createAmbassadorDiscountCode>>
    try {
      r = await createAmbassadorDiscountCode({ code: candidate, ambassadorEmail: email })
    } catch (err) {
      return NextResponse.json(
        { error: 'shopify_failed', detail: err instanceof Error ? err.message : 'unknown' },
        { status: 502 }
      )
    }
    if (r.ok) {
      shopifyNodeId = r.shopifyDiscountNodeId
      break
    }
    if (!r.codeTaken) {
      return NextResponse.json({ error: 'shopify_failed', detail: r.message }, { status: 502 })
    }
    // Code pris côté Shopify
    if (isCustom) return NextResponse.json({ error: 'code_exists' }, { status: 409 })
    taken.add(candidate)
    candidate = withUniquenessSuffix(base, taken)
  }
  if (!shopifyNodeId) {
    return NextResponse.json({ error: 'code_generation_failed' }, { status: 500 })
  }

  const code = candidate

  // Insert ligne ambassadeur. Si échec → compensation : suppression du code Shopify.
  const { data: inserted, error: insErr } = await supabase
    .from('ambassadors')
    .insert({ name, email, shopify_discount_code: code, rate: 0.1, active: true })
    .select('id, name, email, shopify_discount_code, rate, balance_cents, active, created_at')
    .single()

  if (insErr || !inserted) {
    // Compensation : on supprime le code Shopify orphelin qu'on vient de créer.
    // deleteDiscountCode renvoie false si Shopify refuse la suppression (userErrors)
    // → on NE prétend PAS que le nettoyage a réussi : on signale le code orphelin.
    let compensated = false
    try {
      compensated = await deleteDiscountCode(shopifyNodeId)
    } catch (err) {
      compensated = false
      console.error('[admin ambassadors] insert failed AND Shopify cleanup threw. Orphan code:', code, 'gid:', shopifyNodeId, err)
    }
    if (!compensated) {
      console.error('[admin ambassadors] insert failed AND orphan -10% Shopify code left:', code, 'gid:', shopifyNodeId)
    }
    const isConflict = (insErr?.code === '23505')
    return NextResponse.json(
      {
        error: isConflict ? 'conflict' : 'insert_failed',
        detail: insErr?.message ?? 'insert returned no row',
        shopifyCodeCleanedUp: compensated,
        orphanCode: compensated ? undefined : code,
      },
      { status: isConflict ? 409 : 500 }
    )
  }

  return NextResponse.json({
    ok: true,
    ambassador: {
      id: inserted.id,
      name: inserted.name,
      email: inserted.email,
      code: inserted.shopify_discount_code,
      ratePct: Math.round(Number(inserted.rate) * 100),
      balanceCents: inserted.balance_cents,
      active: inserted.active,
      createdAt: inserted.created_at,
      ordersCount: 0,
      revenueCents: 0,
    },
  })
}
