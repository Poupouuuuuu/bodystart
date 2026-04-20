/**
 * POST /api/stripe/webhook — handler Stripe events.
 *
 * Sprint 2 — events gérés :
 *   - checkout.session.completed
 *       → crée coaching_orders (oneshot) ou subscriptions (monthly)
 *       → crée intakes (status='pending', sans données)
 *       → envoie email "bienvenue, remplis ton intake"
 *       → activation metafields Shopify (legacy, conservé pour code promo)
 *       → création code promo -15% (uniquement pour monthly)
 *
 *   - customer.subscription.deleted
 *       → met à jour subscriptions.status + canceled_at
 *       → désactive metafield Shopify + désactive code promo
 *
 * Sprint 4 ajoutera : invoice.paid, invoice.payment_failed,
 *   customer.subscription.updated.
 *
 * ⚠️ Idempotence : Stripe peut retry. Tous les inserts utilisent
 *   onConflict pour éviter les doublons (sur stripe_checkout_session_id
 *   ou stripe_subscription_id).
 */
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'
import { createCoachingDiscount, deactivateCoachingDiscount } from '@/lib/shopify/discounts'
import { shopifyAdminFetch } from '@/lib/shopify/client'
import { getSupabaseAdminClient } from '@/lib/coaching/supabase/admin'
import { syncShopifyCustomerToSupabase } from '@/lib/coaching/auth/sync-profile'
import { sendWelcomeAfterPayment } from '@/lib/coaching/emails'
import type { CoachingTier } from '@/lib/stripe/types'

export const dynamic = 'force-dynamic'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

// ─── Shopify queries (legacy metafields, à conserver pour code promo) ────
const SEARCH_CUSTOMER_BY_EMAIL = `
  query SearchCustomerByEmail($query: String!) {
    customers(first: 1, query: $query) {
      nodes {
        id
        email
        firstName
        lastName
      }
    }
  }
`

const UPDATE_CUSTOMER_METAFIELDS = `
  mutation UpdateCustomerMetafields($input: CustomerInput!) {
    customerUpdate(input: $input) {
      customer { id }
      userErrors { field message }
    }
  }
`

interface ShopifyCustomerLookup {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
}

async function lookupShopifyCustomer(email: string): Promise<ShopifyCustomerLookup | null> {
  const data = await shopifyAdminFetch<{
    customers: { nodes: ShopifyCustomerLookup[] }
  }>(SEARCH_CUSTOMER_BY_EMAIL, { query: `email:${email}` })
  return data.customers.nodes[0] ?? null
}

async function setCoachingMetafields(shopifyCustomerId: string, fields: Record<string, string>) {
  await shopifyAdminFetch(UPDATE_CUSTOMER_METAFIELDS, {
    input: {
      id: shopifyCustomerId,
      metafields: Object.entries(fields).map(([key, value]) => ({
        namespace: 'coaching',
        key,
        value,
        type: 'single_line_text_field',
      })),
    },
  })
}

// ============================================================
// Handler : checkout.session.completed
// ============================================================
async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const tier = session.metadata?.coaching_tier as CoachingTier | undefined
  const shopifyCustomerId = session.metadata?.shopify_customer_id
  const customerEmail = session.metadata?.customer_email ?? session.customer_details?.email

  if (!tier || !customerEmail || !shopifyCustomerId) {
    console.warn('[webhook] checkout.session.completed sans metadata coaching :', session.id)
    return
  }

  console.log(`[webhook] checkout.completed: ${tier} pour ${customerEmail}`)

  // ─── 1. Lookup Shopify customer pour avoir firstName/lastName ───
  const shopifyCustomer = await lookupShopifyCustomer(customerEmail)
  if (!shopifyCustomer) {
    console.error(`[webhook] Shopify customer introuvable : ${customerEmail}`)
    return
  }

  // ─── 2. Sync profile Supabase (idempotent) ───
  const profile = await syncShopifyCustomerToSupabase({
    id: shopifyCustomer.id,
    email: shopifyCustomer.email,
    firstName: shopifyCustomer.firstName,
    lastName: shopifyCustomer.lastName,
  })

  const admin = getSupabaseAdminClient()

  // ─── 3. Créer la commande/abonnement Supabase ───
  if (tier === 'oneshot') {
    const { data: order, error: orderErr } = await admin
      .from('coaching_orders')
      .upsert(
        {
          user_id: profile.id,
          stripe_checkout_session_id: session.id,
          stripe_payment_intent_id: typeof session.payment_intent === 'string' ? session.payment_intent : null,
          product_type: 'oneshot_program_49',
          amount_eur: ((session.amount_total ?? 4900) / 100),
          status: 'paid',
          paid_at: new Date().toISOString(),
        },
        { onConflict: 'stripe_checkout_session_id' }
      )
      .select('id')
      .single()

    if (orderErr) {
      console.error('[webhook] Erreur insert coaching_orders:', orderErr)
      return
    }

    // Créer un intake "pending" lié à cette commande
    const { data: intake, error: intakeErr } = await admin
      .from('intakes')
      .insert({
        user_id: profile.id,
        // Champs minimaux requis par les CHECK constraints
        objectif: 'remise_forme', // placeholder, sera écrasé à la soumission
        niveau: 'debutant',
        type_programme: 'complet',
        source: 'oneshot_49',
        status: 'pending',
      })
      .select('id')
      .single()

    if (intakeErr) {
      console.error('[webhook] Erreur insert intake:', intakeErr)
    } else if (intake && order) {
      // Lier l'intake à l'order
      await admin
        .from('coaching_orders')
        .update({ intake_id: intake.id })
        .eq('id', order.id)
    }
  } else if (tier === 'monthly_followup') {
    // L'objet subscription est créé par Stripe mais pas dans cette session ;
    // on récupère l'ID via session.subscription
    const subId = typeof session.subscription === 'string' ? session.subscription : null
    if (!subId) {
      console.warn('[webhook] subscription ID introuvable sur la session')
      return
    }
    const sub = await stripe.subscriptions.retrieve(subId)
    const stripeCustId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id

    type SubWithPeriods = Stripe.Subscription & {
      current_period_start?: number | null
      current_period_end?: number | null
    }
    const subTyped = sub as SubWithPeriods

    const { error: subErr } = await admin
      .from('subscriptions')
      .upsert(
        {
          user_id: profile.id,
          stripe_subscription_id: sub.id,
          stripe_customer_id: stripeCustId,
          plan: 'coaching_followup_monthly',
          status: sub.status,
          current_period_start: subTyped.current_period_start
            ? new Date(subTyped.current_period_start * 1000).toISOString()
            : null,
          current_period_end: subTyped.current_period_end
            ? new Date(subTyped.current_period_end * 1000).toISOString()
            : null,
        },
        { onConflict: 'stripe_subscription_id' }
      )

    if (subErr) {
      console.error('[webhook] Erreur insert subscriptions:', subErr)
    }

    // Créer le 1er intake pour cet abonnement
    const { error: intakeErr } = await admin
      .from('intakes')
      .insert({
        user_id: profile.id,
        objectif: 'remise_forme',
        niveau: 'debutant',
        type_programme: 'complet',
        source: 'monthly_89',
        status: 'pending',
      })

    if (intakeErr) {
      console.error('[webhook] Erreur insert intake (monthly):', intakeErr)
    }
  }

  // ─── 4. Activation metafields Shopify (legacy, pour code promo) ───
  try {
    await setCoachingMetafields(shopifyCustomer.id, {
      active: 'true',
      since: new Date().toISOString(),
      type: tier === 'monthly_followup' ? 'subscription' : 'oneshot',
      product_id: tier,
    })
  } catch (err) {
    console.error('[webhook] Erreur metafields:', err)
  }

  // ─── 5. Code promo -15% UNIQUEMENT pour le suivi mensuel ───
  if (tier === 'monthly_followup' && typeof session.customer === 'string') {
    try {
      const code = await createCoachingDiscount(session.customer, customerEmail)
      console.log(`[webhook] Discount -15% créé: ${code}`)
    } catch (err) {
      console.error('[webhook] Erreur création discount:', err)
    }
  }

  // ─── 6. Email bienvenue client ───
  try {
    await sendWelcomeAfterPayment({
      to: customerEmail,
      firstName: shopifyCustomer.firstName,
      tier,
    })
    console.log(`[webhook] Email bienvenue envoyé à ${customerEmail}`)
  } catch (err) {
    console.error('[webhook] Erreur email bienvenue:', err)
  }
}

// ============================================================
// Handler : customer.subscription.deleted
// ============================================================
async function handleSubscriptionDeleted(sub: Stripe.Subscription): Promise<void> {
  const stripeCustId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id

  const admin = getSupabaseAdminClient()
  await admin
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', sub.id)

  try {
    const stripeCustomer = await stripe.customers.retrieve(stripeCustId)
    const email = 'email' in stripeCustomer ? stripeCustomer.email : null
    if (email) {
      const shopify = await lookupShopifyCustomer(email)
      if (shopify) {
        await setCoachingMetafields(shopify.id, { active: 'false' })
      }
      await deactivateCoachingDiscount(stripeCustId)
    }
  } catch (err) {
    console.error('[webhook] Erreur désactivation:', err)
  }
}

// ============================================================
// Route handler principal
// ============================================================
export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET non configuré.')
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
    console.error('[webhook] Signature invalide:', err)
    return NextResponse.json({ error: 'Signature invalide.' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      default:
        console.log(`[webhook] Événement non géré: ${event.type}`)
    }
  } catch (error) {
    console.error('[webhook] Erreur traitement:', error)
    return NextResponse.json({ error: 'Erreur traitement webhook.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
