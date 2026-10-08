/**
 * GET /api/loyalty/admin/customers?email=... : un compte client Shopify
 * existe-t-il avec cet e-mail exact ? (formulaire d'ajout d'ambassadeur).
 * ADMIN ONLY → requireAdmin() en tête.
 *
 * Forfait Shopify Basic : l'app du site ne peut pas RELIRE nom, e-mail ni
 * téléphone d'un client (refus « not approved to access the Customer
 * object »). On cherche donc PAR e-mail et on ne lit que l'id : la recherche
 * par nom n'est pas possible sur ce forfait.
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/loyalty/admin'
import { shopifyAdminFetch } from '@/lib/shopify/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const EMAIL_RE = /^[^@\s"]+@[^@\s"]+\.[^@\s"]+$/

const FIND = `
  query AdminCustomerByEmail($q: String!) {
    customers(first: 1, query: $q) {
      nodes { id }
    }
  }
`

export async function GET(req: NextRequest) {
  const gate = await requireAdmin()
  if (!gate.ok) return NextResponse.json({ error: 'forbidden' }, { status: gate.status })

  const email = (new URL(req.url).searchParams.get('email') ?? '').trim().toLowerCase()
  if (!EMAIL_RE.test(email) || email.length > 180) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 })
  }

  try {
    const data = await shopifyAdminFetch<{ customers: { nodes: { id: string }[] } }>(FIND, {
      q: `email:"${email}"`,
    })
    return NextResponse.json({ exists: (data.customers?.nodes ?? []).length > 0 })
  } catch (err) {
    console.error('[loyalty/admin/customers]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'search_failed' }, { status: 502 })
  }
}
