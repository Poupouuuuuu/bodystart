/**
 * GET /api/loyalty/me
 *
 * Renvoie l'etat loyalty du client Shopify connecte :
 *   - logged_out (401)
 *   - not_enrolled : pas encore de loyalty_customer (200)
 *   - enrolled : customer + 20 dernieres transactions + totaux (200)
 *
 * Pas de body. Auth via cookie body-start-customer-token (Shopify).
 */
import { NextResponse } from 'next/server'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { resolveLoyaltyForSession } from '@/lib/loyalty/session'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const session = await resolveLoyaltyForSession()

  if (session.state === 'logged_out') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  if (session.state === 'not_enrolled') {
    return NextResponse.json({
      state: 'not_enrolled',
      shopify: { email: session.shopify.email, firstName: session.shopify.firstName },
    })
  }

  // enrolled : fetch transactions + totaux
  const admin = getLoyaltyAdminClient()
  const customerId = session.customer.id

  const [txQuery, totalsQuery, filleulsQuery] = await Promise.all([
    admin
      .from('loyalty_transactions')
      .select(`
        id, type, amount_cents, balance_after_cents, channel,
        shopify_order_id, related_customer_id, created_at
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(20),
    admin
      .from('loyalty_transactions')
      .select('type, amount_cents')
      .eq('customer_id', customerId),
    // Filleuls : clients ayant utilisé MON code parrain.
    admin
      .from('loyalty_customers')
      .select('id', { count: 'exact', head: true })
      .eq('referred_by_code', session.customer.referralCode),
  ])

  if (txQuery.error || totalsQuery.error) {
    return NextResponse.json(
      { error: 'fetch_failed', detail: txQuery.error?.message ?? totalsQuery.error?.message },
      { status: 500 }
    )
  }

  // Resolution prenoms des filleuls (pour referral_commission)
  const relatedIds = Array.from(
    new Set(
      (txQuery.data ?? [])
        .map((t) => t.related_customer_id)
        .filter((id): id is string => id !== null)
    )
  )
  let relatedNames: Record<string, string> = {}
  if (relatedIds.length > 0) {
    const { data: related } = await admin
      .from('loyalty_customers')
      .select('id, first_name')
      .in('id', relatedIds)
    relatedNames = Object.fromEntries((related ?? []).map((r) => [r.id, r.first_name]))
  }

  const recentTransactions = (txQuery.data ?? []).map((t) => ({
    id: t.id,
    type: t.type,
    amountCents: t.amount_cents,
    balanceAfterCents: t.balance_after_cents,
    channel: t.channel,
    shopifyOrderId: t.shopify_order_id,
    relatedCustomerFirstName: t.related_customer_id ? relatedNames[t.related_customer_id] ?? null : null,
    createdAt: t.created_at,
  }))

  const earnedCents = (totalsQuery.data ?? [])
    .filter((t) => t.type === 'referral_commission' || t.type === 'import_credit' || t.type === 'adjustment')
    .reduce((s, t) => s + (t.amount_cents > 0 ? t.amount_cents : 0), 0)
  const spentCents = (totalsQuery.data ?? [])
    .filter((t) => t.type === 'spend')
    .reduce((s, t) => s + t.amount_cents, 0)

  // Parrainage : gains nets (commissions − révocations) + nombre de filleuls.
  const referralCommissionCents = (totalsQuery.data ?? [])
    .filter((t) => t.type === 'referral_commission')
    .reduce((s, t) => s + t.amount_cents, 0)
  const referralRevokeCents = (totalsQuery.data ?? [])
    .filter((t) => t.type === 'referral_revoke')
    .reduce((s, t) => s + t.amount_cents, 0)
  const referralEarnedNetCents = Math.max(0, referralCommissionCents - referralRevokeCents)
  const filleulsCount = filleulsQuery.count ?? 0

  return NextResponse.json({
    state: 'enrolled',
    customer: {
      id: session.customer.id,
      firstName: session.customer.firstName,
      referralCode: session.customer.referralCode,
      loyaltyBalanceCents: session.customer.loyaltyBalanceCents,
      hasFirstPurchase: session.customer.hasFirstPurchase,
      referralCommissionUntil: session.customer.referralCommissionUntil,
    },
    recentTransactions,
    totals: { earnedCents, spentCents },
    referral: { filleulsCount, earnedNetCents: referralEarnedNetCents },
  })
}
