import { NextRequest, NextResponse } from 'next/server'
import { shopifyAdminFetch } from '@/lib/shopify/client'
import { createCoachingDiscount } from '@/lib/shopify/discounts'

// ⚠️  ENDPOINT DE DEBUG — UNIQUEMENT EN DÉVELOPPEMENT
// Permet d'activer manuellement le coaching pour un client
// sans passer par le webhook Stripe.
// Usage : GET /api/debug/activate-coaching?email=client@exemple.fr

const SEARCH_CUSTOMER_BY_EMAIL = `
  query SearchCustomerByEmail($query: String!) {
    customers(first: 1, query: $query) {
      nodes {
        id
        email
      }
    }
  }
`

const UPDATE_CUSTOMER_METAFIELDS = `
  mutation UpdateCustomerMetafields($input: CustomerInput!) {
    customerUpdate(input: $input) {
      customer {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`

export async function GET(req: NextRequest) {
  // Bloquer en production
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'Cet endpoint est uniquement disponible en développement.' },
      { status: 403 }
    )
  }

  const email = req.nextUrl.searchParams.get('email')
  if (!email) {
    return NextResponse.json(
      { error: 'Paramètre email requis. Usage : /api/debug/activate-coaching?email=xxx@xxx.fr' },
      { status: 400 }
    )
  }

  try {
    // 1. Rechercher le client Shopify par email
    const data = await shopifyAdminFetch<{
      customers: { nodes: { id: string; email: string }[] }
    }>(SEARCH_CUSTOMER_BY_EMAIL, { query: `email:${email}` })

    const customer = data.customers.nodes[0]
    if (!customer) {
      return NextResponse.json(
        { error: `Client Shopify introuvable pour ${email}. Vérifiez que le compte existe.` },
        { status: 404 }
      )
    }

    // 2. Mettre à jour les metafields coaching
    const metafieldResult = await shopifyAdminFetch<{
      customerUpdate: {
        customer: { id: string } | null
        userErrors: { field: string[]; message: string }[]
      }
    }>(UPDATE_CUSTOMER_METAFIELDS, {
      input: {
        id: customer.id,
        metafields: [
          {
            namespace: 'coaching',
            key: 'active',
            value: 'true',
            type: 'single_line_text_field',
          },
          {
            namespace: 'coaching',
            key: 'since',
            value: new Date().toISOString(),
            type: 'single_line_text_field',
          },
          {
            namespace: 'coaching',
            key: 'type',
            value: 'test',
            type: 'single_line_text_field',
          },
          {
            namespace: 'coaching',
            key: 'product_id',
            value: 'debug-manual-activation',
            type: 'single_line_text_field',
          },
        ],
      },
    })

    if (metafieldResult.customerUpdate.userErrors.length > 0) {
      return NextResponse.json(
        { error: 'Erreur mise à jour metafields.', details: metafieldResult.customerUpdate.userErrors },
        { status: 500 }
      )
    }

    // 3. Créer le code promo -15%
    let discountCode: string | null = null
    try {
      discountCode = await createCoachingDiscount(customer.id, email)
    } catch (discountErr) {
      console.error('[Debug] Erreur création discount (peut-être déjà existant):', discountErr)
    }

    return NextResponse.json({
      success: true,
      message: `Coaching activé pour ${email}`,
      shopifyCustomerId: customer.id,
      metafields: {
        'coaching.active': 'true',
        'coaching.since': new Date().toISOString(),
        'coaching.type': 'test',
      },
      discountCode: discountCode ?? 'Erreur création (peut-être déjà existant)',
    })
  } catch (error) {
    console.error('[Debug] Erreur activation coaching:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'activation. Vérifiez que SHOPIFY_ADMIN_API_ACCESS_TOKEN est valide.' },
      { status: 500 }
    )
  }
}
