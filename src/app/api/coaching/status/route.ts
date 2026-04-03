import { NextRequest, NextResponse } from 'next/server'
import { shopifyAdminFetch } from '@/lib/shopify/client'

const GET_CUSTOMER_COACHING_STATUS = `
  query GetCustomerCoachingStatus($query: String!) {
    customers(first: 1, query: $query) {
      nodes {
        id
        metafields(first: 5, namespace: "coaching") {
          nodes {
            key
            value
          }
        }
      }
    }
  }
`

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: 'Email requis.' }, { status: 400 })
  }

  try {
    const data = await shopifyAdminFetch<{
      customers: {
        nodes: {
          id: string
          metafields: {
            nodes: { key: string; value: string }[]
          }
        }[]
      }
    }>(GET_CUSTOMER_COACHING_STATUS, { query: `email:${email}` })

    const customer = data.customers.nodes[0]
    if (!customer) {
      return NextResponse.json({ active: false })
    }

    const activeMetafield = customer.metafields.nodes.find((m) => m.key === 'active')
    const typeMetafield = customer.metafields.nodes.find((m) => m.key === 'type')
    const sinceMetafield = customer.metafields.nodes.find((m) => m.key === 'since')

    return NextResponse.json({
      active: activeMetafield?.value === 'true',
      type: typeMetafield?.value ?? null,
      since: sinceMetafield?.value ?? null,
    })
  } catch (error) {
    console.error('[Coaching Status] Erreur:', error)
    return NextResponse.json({ active: false, error: 'Erreur vérification statut.' }, { status: 500 })
  }
}
