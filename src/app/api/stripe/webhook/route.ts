import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'
import { createCoachingDiscount, deactivateCoachingDiscount } from '@/lib/shopify/discounts'
import { shopifyAdminFetch } from '@/lib/shopify/client'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

// ─── Queries Admin API pour les metafields client ────────────

const SEARCH_CUSTOMER_BY_EMAIL = `
  query SearchCustomerByEmail($query: String!) {
    customers(first: 1, query: $query) {
      nodes {
        id
        email
        metafields(first: 10, namespace: "coaching") {
          nodes {
            id
            key
            value
          }
        }
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

async function activateCoaching(
  customerEmail: string,
  productType: string,
  productId: string
): Promise<void> {
  const data = await shopifyAdminFetch<{
    customers: { nodes: { id: string; email: string }[] }
  }>(SEARCH_CUSTOMER_BY_EMAIL, { query: `email:${customerEmail}` })

  const shopifyCustomer = data.customers.nodes[0]
  if (!shopifyCustomer) {
    console.error(`[Stripe Webhook] Client Shopify introuvable pour ${customerEmail}`)
    return
  }

  await shopifyAdminFetch(UPDATE_CUSTOMER_METAFIELDS, {
    input: {
      id: shopifyCustomer.id,
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
          value: productType,
          type: 'single_line_text_field',
        },
        {
          namespace: 'coaching',
          key: 'product_id',
          value: productId,
          type: 'single_line_text_field',
        },
      ],
    },
  })

  console.log(`[Stripe Webhook] Coaching activé pour ${customerEmail} (${productType})`)
}

async function deactivateCoaching(customerEmail: string): Promise<void> {
  const data = await shopifyAdminFetch<{
    customers: { nodes: { id: string; email: string }[] }
  }>(SEARCH_CUSTOMER_BY_EMAIL, { query: `email:${customerEmail}` })

  const shopifyCustomer = data.customers.nodes[0]
  if (!shopifyCustomer) {
    console.error(`[Stripe Webhook] Client Shopify introuvable pour désactivation: ${customerEmail}`)
    return
  }

  await shopifyAdminFetch(UPDATE_CUSTOMER_METAFIELDS, {
    input: {
      id: shopifyCustomer.id,
      metafields: [
        {
          namespace: 'coaching',
          key: 'active',
          value: 'false',
          type: 'single_line_text_field',
        },
      ],
    },
  })

  console.log(`[Stripe Webhook] Coaching désactivé pour ${customerEmail}`)
}

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET non configuré.')
    return NextResponse.json({ error: 'Webhook non configuré.' }, { status: 500 })
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Signature manquante.' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    console.error('[Stripe Webhook] Signature invalide:', err)
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const customerEmail = session.customer_details?.email ?? session.metadata?.customerEmail
        const customerId = session.customer as string | null
        const productId = session.metadata?.productId ?? ''
        const productType = session.metadata?.productType ?? ''

        console.log(`[Stripe Webhook] Checkout completed: ${productId} (${productType}) pour ${customerEmail}`)

        if (!customerEmail) {
          console.error('[Stripe Webhook] Pas d\'email client dans la session checkout.')
          break
        }

        // 1. Activer le coaching dans les metafields Shopify
        try {
          await activateCoaching(customerEmail, productType, productId)
        } catch (metaErr) {
          console.error('[Stripe Webhook] Erreur activation metafields:', metaErr)
        }

        // 2. Créer un code promo -15% pour les clients coaching
        if (customerId) {
          try {
            const code = await createCoachingDiscount(customerId, customerEmail)
            console.log(`[Stripe Webhook] Discount -15% créé: ${code} pour ${customerEmail}`)
          } catch (discountErr) {
            console.error('[Stripe Webhook] Erreur création discount:', discountErr)
          }
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        console.log(`[Stripe Webhook] Subscription canceled: ${customerId}`)

        // Récupérer l'email du client Stripe
        try {
          const stripeCustomer = await stripe.customers.retrieve(customerId)
          const customerEmail = 'email' in stripeCustomer ? stripeCustomer.email : null

          if (customerEmail) {
            // 1. Désactiver le coaching dans les metafields Shopify
            await deactivateCoaching(customerEmail)

            // 2. Désactiver le code promo
            await deactivateCoachingDiscount(customerId)
            console.log(`[Stripe Webhook] Coaching + discount désactivés pour ${customerEmail}`)
          } else {
            console.error(`[Stripe Webhook] Email non trouvé pour le client Stripe ${customerId}`)
          }
        } catch (deactivateErr) {
          console.error('[Stripe Webhook] Erreur désactivation:', deactivateErr)
        }

        break
      }

      default:
        console.log(`[Stripe Webhook] Événement non géré: ${event.type}`)
    }
  } catch (error) {
    console.error('[Stripe Webhook] Erreur traitement:', error)
    return NextResponse.json({ error: 'Erreur traitement webhook.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
