/**
 * GET /api/loyalty/me/ambassador
 *
 * Dashboard ambassadeur du client Shopify connecté (lookup par email).
 *   - { isAmbassador: false } si l'email ne correspond à aucun ambassadeur.
 *   - sinon : solde + statut (utilisable/expiré) + historique + stats ventes
 *     (nb commandes, CA attribué, % nouveaux clients).
 *
 * Auth via cookie Shopify (resolveLoyaltyForSession donne l'email). 401 logged_out.
 */
import { NextResponse } from 'next/server'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { resolveLoyaltyForSession } from '@/lib/loyalty/session'
import {
  usableAmbassadorBalanceCents,
  isAmbassadorCagnotteExpired,
  AMBASSADOR_REDEEM_MIN_BALANCE_CENTS,
} from '@/lib/loyalty/ambassador'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const session = await resolveLoyaltyForSession()
  if (session.state === 'logged_out') {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // L'email est dispo dans les deux états non déconnectés.
  const email = session.shopify.email
  if (!email) {
    return NextResponse.json({ isAmbassador: false })
  }

  const admin = getLoyaltyAdminClient()
  const { data: amb, error } = await admin
    .from('ambassadors')
    .select('id, name, email, shopify_discount_code, rate, balance_cents, active, last_activity_at')
    .ilike('email', email)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: 'fetch_failed', detail: error.message }, { status: 500 })
  }
  // Garde défensif : une entrée de SUIVI (rate 0, ex. BODYSTART15) ne doit JAMAIS
  // afficher d'espace ambassadeur, même si son email coïncidait avec une session.
  if (!amb || Number(amb.rate) <= 0) {
    return NextResponse.json({ isAmbassador: false })
  }

  const [txQuery, commQuery] = await Promise.all([
    admin
      .from('ambassador_transactions')
      .select('id, type, amount_cents, balance_after_cents, shopify_order_id, notes, created_at')
      .eq('ambassador_id', amb.id)
      .order('created_at', { ascending: false })
      .limit(30),
    admin
      .from('ambassador_commissions')
      .select('order_subtotal_cents, commission_cents, is_new_customer, status')
      .eq('ambassador_id', amb.id),
  ])

  const commissions = commQuery.data ?? []
  const credited = commissions.filter((c) => c.status === 'credited')
  // Stats ventes (sur les commandes non remboursées)
  const ordersCount = credited.length
  const revenueCents = credited.reduce((s, c) => s + (c.order_subtotal_cents ?? 0), 0)
  const newCustomers = credited.filter((c) => c.is_new_customer).length
  const newCustomerRate = ordersCount > 0 ? Math.round((newCustomers / ordersCount) * 100) : 0

  const expired = isAmbassadorCagnotteExpired(amb.last_activity_at)
  const usableCents = usableAmbassadorBalanceCents(amb.balance_cents, amb.last_activity_at)

  return NextResponse.json({
    isAmbassador: true,
    ambassador: {
      name: amb.name,
      code: amb.shopify_discount_code,
      ratePct: Math.round(Number(amb.rate) * 100),
      active: amb.active,
      balanceCents: amb.balance_cents,
      usableCents,
      expired,
      minToUseCents: AMBASSADOR_REDEEM_MIN_BALANCE_CENTS,
      lastActivityAt: amb.last_activity_at,
    },
    stats: { ordersCount, revenueCents, newCustomers, newCustomerRate },
    transactions: (txQuery.data ?? []).map((t) => ({
      id: t.id,
      type: t.type,
      amountCents: t.amount_cents,
      balanceAfterCents: t.balance_after_cents,
      shopifyOrderId: t.shopify_order_id,
      notes: t.notes,
      createdAt: t.created_at,
    })),
  })
}
