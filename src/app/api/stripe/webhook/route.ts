// STANDBY 2026-05-23 : coaching masqué, voir tech-specs/site-rewrite-copy-v1.md §7.4
// Le webhook Stripe ne servait qu'à activer/désactiver le coaching côté Shopify
// (metafields, code promo -15%). Comme on a coupé l'amont (/api/stripe/checkout
// renvoie 410), il ne devrait plus y avoir de nouveaux events coaching.
//
// On garde le handler pour valider les signatures et logger d'éventuels events
// résiduels (subscriptions trialing en cours, etc.), mais on ne déclenche plus
// AUCUNE action côté Shopify : zéro nouveau code promo, zéro metafield touché.
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

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

  // STANDBY : on log l'event pour audit mais on ne déclenche aucune action.
  // Si un event coaching arrive (subscription d'un client legacy), on le saura
  // dans les logs Vercel et on pourra le traiter à la main.
  console.log(
    `[Stripe Webhook · STANDBY coaching] Event reçu : ${event.type} · id=${event.id} — aucune action déclenchée.`
  )

  return NextResponse.json({ received: true, standby: true })
}
