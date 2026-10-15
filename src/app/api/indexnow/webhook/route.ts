import { NextResponse } from 'next/server'
import { verifyShopifyHmac } from '@/lib/loyalty/verify-hmac'
import { synchroniserFiche } from '@/lib/indexnow-serveur'

// ============================================================
// POST /api/indexnow/webhook : Shopify `products/update`
// ============================================================
// À créer dans l'admin Shopify (Paramètres → Notifications → Webhooks,
// format JSON) : signé alors avec le secret partagé de la boutique
// (SHOPIFY_WEBHOOK_SECRET), comme les webhooks fidélité et alertes de stock.
// Shopify l'envoie aussi à chaque mouvement de stock : la fiche n'est soumise
// que si son contenu utile a changé (lib/indexnow-serveur), sinon 200 sans
// rien faire. Erreur Shopify ou IndexNow : 500, Shopify rejoue.

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET
  const rawBody = await req.text()
  if (!secret || !verifyShopifyHmac({ rawBody, hmacHeader: req.headers.get('x-shopify-hmac-sha256'), secret })) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  let handle: unknown
  try {
    handle = (JSON.parse(rawBody) as { handle?: unknown }).handle
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }
  if (typeof handle !== 'string' || !/^[a-z0-9][a-z0-9-]{0,254}$/.test(handle)) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 })
  }
  try {
    const resultat = await synchroniserFiche(handle)
    if (resultat.statut === 'refuse') {
      console.error('[indexnow/webhook] envoi refusé', handle, resultat)
      return NextResponse.json(resultat, { status: 500 })
    }
    return NextResponse.json(resultat)
  } catch (err) {
    console.error('[indexnow/webhook] échec', handle, err)
    return NextResponse.json({ error: 'failed' }, { status: 500 })
  }
}
