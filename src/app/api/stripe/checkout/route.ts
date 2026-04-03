import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { COACHING_PRODUCTS } from '@/lib/stripe/types'
import { getCustomer } from '@/lib/shopify/customer-server'

export async function POST(req: NextRequest) {
  try {
    // Vérifier que l'utilisateur est connecté
    const cookieStore = await cookies()
    const customerToken = cookieStore.get('body-start-customer-token')?.value
    if (!customerToken) {
      return NextResponse.json(
        { error: 'Vous devez être connecté pour accéder au paiement.', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    // Récupérer l'email client depuis le token Shopify
    const customer = await getCustomer(customerToken)
    if (!customer?.email) {
      return NextResponse.json(
        { error: 'Session expirée. Veuillez vous reconnecter.', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }

    const { priceId, mode, productId } = await req.json()

    if (!priceId || !mode || !productId) {
      return NextResponse.json(
        { error: 'Paramètres priceId, mode et productId requis.' },
        { status: 400 }
      )
    }

    // Vérifier que le produit existe dans notre catalogue
    const product = COACHING_PRODUCTS.find((p) => p.id === productId)
    if (!product) {
      return NextResponse.json(
        { error: 'Produit coaching introuvable.' },
        { status: 404 }
      )
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: mode === 'subscription' ? 'subscription' : 'payment',
      customer_email: customer.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        productId: product.id,
        productType: product.type,
        productName: product.name,
        customerEmail: customer.email,
        shopifyCustomerId: customer.id,
      },
      success_url: `${siteUrl}/account/coaching?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${siteUrl}/coaching/tarifs?canceled=true`,
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (error: unknown) {
    console.error('[Stripe Checkout] Erreur:', error)

    // Erreurs Stripe typées
    if (error && typeof error === 'object' && 'type' in error) {
      const stripeError = error as { type: string; message?: string; code?: string }
      const messages: Record<string, string> = {
        'StripeCardError': 'Votre carte a été refusée. Veuillez réessayer avec un autre moyen de paiement.',
        'StripeInvalidRequestError': 'Requête invalide. Veuillez réessayer.',
        'StripeAPIError': 'Erreur temporaire du service de paiement. Réessayez dans quelques instants.',
        'StripeConnectionError': 'Impossible de contacter le service de paiement. Vérifiez votre connexion.',
        'StripeAuthenticationError': 'Erreur de configuration du paiement. Contactez-nous.',
        'StripeRateLimitError': 'Trop de requêtes. Veuillez patienter un instant.',
      }
      return NextResponse.json(
        { error: messages[stripeError.type] || stripeError.message || 'Erreur de paiement.' },
        { status: stripeError.type === 'StripeCardError' ? 402 : 500 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur inattendue lors de la création du paiement. Veuillez réessayer.' },
      { status: 500 }
    )
  }
}
