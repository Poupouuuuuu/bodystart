/**
 * Helper server-side : exige que le caller soit un admin.
 * Utilisé dans les layouts/pages /admin/* et les API routes /api/coaching/admin/*.
 *
 * Stratégie :
 *   1. Lire le cookie Shopify
 *   2. Récupérer l'email via Shopify Storefront API (validation token + identité)
 *   3. Vérifier que cet email est dans COACHING_ADMIN_EMAILS
 *
 * On ne passe pas par Supabase pour cette vérif car :
 *   - C'est plus rapide (1 call Shopify déjà fait au login → cache navigateur)
 *   - Le COACHING_ADMIN_EMAILS est la SOURCE DE VÉRITÉ canonique du rôle admin
 *   - profiles.role est synchronisé depuis cette env var au sync, pas l'inverse
 */
import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { getCustomer } from '@/lib/shopify/customer-server'

const SHOPIFY_TOKEN_COOKIE = 'body-start-customer-token'

function isAdminEmail(email: string): boolean {
  const csv = process.env.COACHING_ADMIN_EMAILS ?? ''
  const list = csv
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.toLowerCase())
}

export interface AdminContext {
  email: string
  shopifyCustomerId: string
  firstName: string | null
  lastName: string | null
}

/**
 * À appeler en haut d'un Server Component admin.
 * - Pas de session Shopify → redirect /login
 * - Session Shopify mais email pas dans la whitelist → notFound() (404 furtif, pas 403)
 * - Sinon → retourne le contexte admin
 */
export async function requireAdmin(): Promise<AdminContext> {
  const cookieStore = cookies()
  const token = cookieStore.get(SHOPIFY_TOKEN_COOKIE)?.value

  if (!token) {
    redirect('/login?redirect=/admin')
  }

  const customer = await getCustomer(token)
  if (!customer) {
    redirect('/login?redirect=/admin&reason=expired')
  }

  if (!isAdminEmail(customer.email)) {
    // 404 plutôt que 403 : on ne veut pas révéler l'existence du panel admin
    notFound()
  }

  return {
    email: customer.email,
    shopifyCustomerId: customer.id,
    firstName: customer.firstName ?? null,
    lastName: customer.lastName ?? null,
  }
}
