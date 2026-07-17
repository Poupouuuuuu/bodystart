/**
 * Resolution session Shopify -> loyalty_customer.
 *
 * Strategie 2 niveaux :
 *   1. Match prioritaire par shopify_customer_id.
 *   2. Fallback : match par email + auto-upgrade (UPDATE shopify_customer_id
 *      pour stabiliser le lien primary).
 *
 * Si rien trouve : { state: 'not_enrolled' } => le front affiche le bloc
 * d'enrolment (demander le telephone E.164).
 */
import { cookies } from 'next/headers'
import { getCustomer } from '@/lib/shopify/customer-server'
import { getLoyaltyAdminClient } from './supabase-admin'

const SHOPIFY_TOKEN_COOKIE = 'body-start-customer-token'

export interface ShopifyContext {
  id: string
  email: string
  firstName: string
}

export interface LoyaltyCustomerRow {
  id: string
  phone: string
  email: string | null
  firstName: string
  referralCode: string
  loyaltyBalanceCents: number
  hasFirstPurchase: boolean
  referralCommissionUntil: string | null
  shopifyCustomerId: string | null
}

export type ResolveResult =
  | { state: 'logged_out' }
  | { state: 'not_enrolled'; shopify: ShopifyContext }
  | { state: 'enrolled'; shopify: ShopifyContext; customer: LoyaltyCustomerRow }

function rowToCustomer(row: {
  id: string
  phone: string
  email: string | null
  first_name: string
  referral_code: string
  loyalty_balance_cents: number
  has_first_purchase: boolean
  referral_commission_until: string | null
  shopify_customer_id: string | null
}): LoyaltyCustomerRow {
  return {
    id: row.id,
    phone: row.phone,
    email: row.email,
    firstName: row.first_name,
    referralCode: row.referral_code,
    loyaltyBalanceCents: row.loyalty_balance_cents,
    hasFirstPurchase: row.has_first_purchase,
    referralCommissionUntil: row.referral_commission_until,
    shopifyCustomerId: row.shopify_customer_id,
  }
}

export async function resolveLoyaltyForSession(): Promise<ResolveResult> {
  // 1. Lit le cookie Shopify (cookies() est async depuis Next 15)
  const cookieStore = await cookies()
  const tokenCookie = cookieStore.get(SHOPIFY_TOKEN_COOKIE)
  if (!tokenCookie?.value) {
    return { state: 'logged_out' }
  }

  // 2. Resout le customer Shopify
  const shopifyCustomer = await getCustomer(tokenCookie.value)
  if (!shopifyCustomer) {
    return { state: 'logged_out' }
  }

  const shopify: ShopifyContext = {
    id: shopifyCustomer.id,
    email: shopifyCustomer.email,
    firstName: shopifyCustomer.firstName,
  }

  const admin = getLoyaltyAdminClient()
  const SELECT = 'id, phone, email, first_name, referral_code, loyalty_balance_cents, has_first_purchase, referral_commission_until, shopify_customer_id'

  // 3. Lookup prioritaire par shopify_customer_id
  const byShopifyId = await admin
    .from('loyalty_customers')
    .select(SELECT)
    .eq('shopify_customer_id', shopify.id)
    .maybeSingle()

  if (byShopifyId.data) {
    return { state: 'enrolled', shopify, customer: rowToCustomer(byShopifyId.data) }
  }

  // 4. Fallback : lookup par email
  if (!shopify.email) {
    return { state: 'not_enrolled', shopify }
  }
  const byEmail = await admin
    .from('loyalty_customers')
    .select(SELECT)
    .eq('email', shopify.email)
    .maybeSingle()

  if (!byEmail.data) {
    return { state: 'not_enrolled', shopify }
  }

  // 5. Auto-upgrade : on lie shopify_customer_id pour stabiliser
  if (!byEmail.data.shopify_customer_id) {
    try {
      await admin
        .from('loyalty_customers')
        .update({ shopify_customer_id: shopify.id })
        .eq('id', byEmail.data.id)
    } catch (err) {
      // Conflit UNIQUE possible (cas marginal : 2 comptes Shopify pour 1 phone loyalty)
      // On laisse le client garder son ancien lien, on log juste.
      console.warn('[resolveLoyaltyForSession] auto-upgrade failed (non-blocking):', err)
    }
  }

  return { state: 'enrolled', shopify, customer: rowToCustomer(byEmail.data) }
}
