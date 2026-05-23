// STANDBY 2026-05-23 : coaching masqué, voir tech-specs/site-rewrite-copy-v1.md §7.4
// L'API checkout n'était utilisée que pour vendre les offres coaching.
// On la neutralise au niveau serveur pour qu'aucune commande coaching ne
// puisse être créée, même si un ancien bouton/site externe l'appelait encore.
//
// Si un futur sprint réintroduit le coaching, restaurer la version pré-standby
// depuis l'historique git (commit antérieur au sprint "recentrage compléments").
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  return NextResponse.json(
    {
      error: 'Service indisponible',
      message:
        "Le coaching n'est plus proposé pour le moment. BodyStart se concentre désormais sur les compléments sport et santé. Pour toute demande, contactez-nous au 07 61 84 75 80.",
      code: 'COACHING_STANDBY',
    },
    { status: 410 } // Gone — ressource volontairement retirée
  )
}
