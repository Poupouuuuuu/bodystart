// STANDBY 2026-05-23 + neutralisation 2026-07-03 (review sécurité) :
// cette route publique permettait d'énumérer les clients Shopify par email
// (?email=... → existence + metafields coaching) sans auth ni rate limit.
// Le coaching est en standby (les pages /account/coaching sont 301) : plus
// aucun appelant légitime → 410 Gone, comme /api/stripe/checkout.
//
// Si un futur sprint réintroduit le coaching, restaurer la version pré-standby
// depuis l'historique git ET la gater derrière la session client
// (resolveLoyaltyForSession, restreinte au propre email de l'appelant).
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(
    {
      error: 'Service indisponible',
      message: "Le coaching n'est plus proposé pour le moment.",
      code: 'COACHING_STANDBY',
    },
    { status: 410 } // Gone — ressource volontairement retirée
  )
}
