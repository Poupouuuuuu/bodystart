/**
 * POST /api/coaching/checkout (alias /api/stripe/checkout)
 *
 * Crée une Stripe Checkout Session pour une offre coaching.
 *
 * Sprint 2 — refactor : utilise lookup_key (string stable) au lieu
 * d'un priceId hardcodé. Le frontend envoie juste le `tier` (oneshot
 * ou monthly_followup), on résout le price via lookup_key côté serveur.
 *
 * Body : { tier: 'oneshot' | 'monthly_followup' }
 *
 * Réponse : { url: string } — URL de redirection Stripe Checkout
 */
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { COACHING_PRODUCTS, type CoachingTier } from '@/lib/stripe/types'
import { getCustomer } from '@/lib/shopify/customer-server'

export const dynamic = 'force-dynamic'

const ALLOWED_TIERS: CoachingTier[] = ['oneshot', 'monthly_followup']

export async function POST(req: NextRequest) {
  try {
    // ─── Auth ───
    const cookieStore = cookies()
    const customerToken = cookieStore.get('body-start-customer-token')?.value
    if (!customerToken) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour accéder au paiement.', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const customer = await getCustomer(customerToken)
    if (!customer?.email) {
      return NextResponse.json(
        { error: 'Session expirée. Veuillez vous reconnecter.', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    // ─── Body ───
    const body = await req.json()
    const tier = body.tier as CoachingTier | undefined

    if (!tier || !ALLOWED_TIERS.includes(tier)) {
      return NextResponse.json(
        { error: `Paramètre 'tier' invalide. Attendu : ${ALLOWED_TIERS.join(' | ')}.` },
        { status: 400 }
      )
    }

    const product = COACHING_PRODUCTS[tier]

    // ─── Résoudre le price via lookup_key Stripe ───
    const prices = await stripe.prices.list({
      lookup_keys: [product.stripeLookupKey],
      active: true,
      limit: 1,
    })

    if (prices.data.length === 0) {
      console.error(`[Checkout] Price introuvable pour lookup_key: ${product.stripeLookupKey}`)
      return NextResponse.json(
        {
          error:
            'Configuration produit Stripe manquante. Contactez le support (lookup_key absent).',
          code: 'STRIPE_PRICE_NOT_FOUND',
        },
        { status: 500 }
      )
    }
    const priceId = prices.data[0].id

    const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

    const session = await stripe.checkout.sessions.create({
      mode: product.stripeMode,
      customer_email: customer.email,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        // ⚠️ Le webhook lit ces metadata pour créer coaching_orders / subscriptions / intakes
        coaching_tier: product.tier,
        coaching_lookup_key: product.stripeLookupKey,
        shopify_customer_id: customer.id,
        customer_email: customer.email,
      },
      // Pour les abonnements, on ajoute aussi en subscription_data.metadata
      // (la session.metadata n'est pas reportée sur l'objet subscription)
      ...(product.stripeMode === 'subscription'
        ? {
            subscription_data: {
              metadata: {
                coaching_tier: product.tier,
                shopify_customer_id: customer.id,
                customer_email: customer.email,
              },
            },
          }
        : {}),
      // Après paiement → on redirige vers la page intake (qui va trouver
      // l'intake "pending" créé par le webhook et le proposer à remplir)
      success_url: `${siteUrl}/coaching/intake?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/coaching/tarifs?canceled=true`,
      allow_promotion_codes: false, // pas de code promo sur les offres coaching
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    console.error('[Stripe Checkout] Erreur:', error)

    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as { type: string; message?: string; code?: string }
      const messages: Record<string, string> = {
        StripeCardError: 'Votre carte a été refusée. Veuillez réessayer avec un autre moyen de paiement.',
        StripeInvalidRequestError: 'Requête invalide. Veuillez réessayer.',
        StripeAPIError: 'Erreur temporaire du service de paiement. Réessayez dans quelques instants.',
        StripeConnectionError: 'Impossible de contacter le service de paiement.',
        StripeAuthenticationError: 'Erreur de configuration du paiement. Contactez-nous.',
        StripeRateLimitError: 'Trop de requêtes. Veuillez patienter un instant.',
      }
      return NextResponse.json(
        { error: messages[stripeError.type] || stripeError.message || 'Erreur de paiement.' },
        { status: stripeError.type === 'StripeCardError' ? 402 : 500 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur inattendue lors de la création du paiement.' },
      { status: 500 }
    )
  }
}
