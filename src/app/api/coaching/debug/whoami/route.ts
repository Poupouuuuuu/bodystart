/**
 * GET /api/coaching/debug/whoami
 *
 * Endpoint de diagnostic Sprint 1 — vérifie que le serveur lit correctement
 * la session Shopify + la whitelist admin.
 *
 * ⚠️ À supprimer après validation Sprint 1.
 *
 * Sortie : JSON avec
 *   - hasCookie : bool
 *   - shopifyEmail : email récupéré de Shopify (null si invalide)
 *   - adminEmailsConfigured : nombre d'emails configurés dans COACHING_ADMIN_EMAILS
 *   - adminEmailsList : liste anonymisée (3 premiers chars + ...)
 *   - isAdmin : résultat du check
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCustomer } from '@/lib/shopify/customer-server'

export const dynamic = 'force-dynamic'

const SHOPIFY_TOKEN_COOKIE = 'body-start-customer-token'

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  return `${local.slice(0, 3)}***@${domain}`
}

export async function GET() {
  const cookieStore = cookies()
  const token = cookieStore.get(SHOPIFY_TOKEN_COOKIE)?.value

  const adminCsv = process.env.COACHING_ADMIN_EMAILS ?? ''
  const adminList = adminCsv
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  let shopifyEmail: string | null = null
  let shopifyEmailMasked: string | null = null
  if (token) {
    const c = await getCustomer(token)
    if (c) {
      shopifyEmail = c.email
      shopifyEmailMasked = maskEmail(c.email)
    }
  }

  const isAdmin = shopifyEmail !== null && adminList.includes(shopifyEmail.toLowerCase())

  return NextResponse.json({
    hasCookie: !!token,
    shopifyEmailMasked,
    shopifyEmailLowercase: shopifyEmail?.toLowerCase() ?? null,
    adminEmailsConfigured: adminList.length,
    adminEmailsListMasked: adminList.map(maskEmail),
    isAdmin,
    nodeEnv: process.env.NODE_ENV,
  })
}
