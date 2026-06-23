/**
 * GET /api/loyalty/admin/customers?q=... — recherche de comptes clients Shopify
 * (pour le sélecteur d'ajout d'ambassadeur). ADMIN ONLY : expose des PII →
 * requireAdmin() en tête. Renvoie le strict minimum (id, nom, email).
 */
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/loyalty/admin'
import { shopifyAdminFetch } from '@/lib/shopify/client'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const SEARCH = `
  query AdminCustomerSearch($q: String!) {
    customers(first: 10, query: $q) {
      nodes { id displayName firstName lastName email }
    }
  }
`

interface RawCustomer {
  id: string
  displayName?: string | null
  firstName?: string | null
  lastName?: string | null
  email?: string | null
}

export async function GET(req: NextRequest) {
  const gate = await requireAdmin()
  if (!gate.ok) return NextResponse.json({ error: 'forbidden' }, { status: gate.status })

  const q = (new URL(req.url).searchParams.get('q') ?? '').trim()
  if (q.length < 2) return NextResponse.json({ customers: [] })

  try {
    const data = await shopifyAdminFetch<{ customers: { nodes: RawCustomer[] } }>(SEARCH, { q })
    const customers = (data.customers?.nodes ?? [])
      .filter((c) => !!c.email)
      .map((c) => ({
        id: c.id,
        name:
          (c.displayName || [c.firstName, c.lastName].filter(Boolean).join(' ')).trim() ||
          (c.email as string),
        email: c.email as string,
      }))
    return NextResponse.json({ customers })
  } catch (err) {
    // Ex. scope read_customers manquant sur le token Admin → message clair.
    return NextResponse.json(
      { error: 'search_failed', detail: err instanceof Error ? err.message : 'unknown' },
      { status: 502 }
    )
  }
}
