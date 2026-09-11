import { NextRequest, NextResponse } from 'next/server'
import { shopifyAdminFetch } from '@/lib/shopify/client'
import { getLoyaltyAdminClient } from '@/lib/loyalty/supabase-admin'
import { gidToNumericId, isValidEmail, isValidVariantGid } from '@/lib/stock-alerts/core'

// ============================================================
// POST /api/stock-alert — « Me prévenir quand c'est de retour »
// ============================================================
// Le client n'envoie que { email, variantId } : titre, handle et
// inventory_item_id sont résolus ici via l'Admin API (jamais de texte libre
// venant du navigateur en base). L'envoi de l'email se fait plus tard, par
// le webhook inventory_levels/update (voir ./webhook/route.ts).

export const dynamic = 'force-dynamic'

// ─── Rate limiter : 5 requêtes / 10 min par IP (optionnel si Upstash absent) ───
let ratelimit: { limit: (key: string) => Promise<{ success: boolean }> } | null = null
if (process.env.UPSTASH_REDIS_REST_URL && !process.env.UPSTASH_REDIS_REST_URL.includes('xxx')) {
  const { Ratelimit } = require('@upstash/ratelimit')
  const { Redis } = require('@upstash/redis')
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '10 m'),
    prefix: 'ratelimit:stock-alert',
  })
}

const VARIANT_QUERY = `
  query StockAlertVariant($id: ID!) {
    productVariant(id: $id) {
      id
      title
      availableForSale
      inventoryItem { id }
      product { handle title status }
    }
  }
`

interface VariantResult {
  productVariant: {
    id: string
    title: string
    availableForSale: boolean
    inventoryItem: { id: string } | null
    product: { handle: string; title: string; status: string }
  } | null
}

export async function POST(req: NextRequest) {
  try {
    if (ratelimit) {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
      const { success } = await ratelimit.limit(ip)
      if (!success) {
        return NextResponse.json({ error: 'Trop de demandes, réessaie dans quelques minutes.' }, { status: 429 })
      }
    }

    const body = await req.json().catch(() => null)
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    const variantId = body?.variantId

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Adresse email invalide.' }, { status: 400 })
    }
    if (!isValidVariantGid(variantId)) {
      return NextResponse.json({ error: 'Produit inconnu.' }, { status: 400 })
    }

    const data = await shopifyAdminFetch<VariantResult>(VARIANT_QUERY, { id: variantId })
    const variant = data.productVariant
    if (!variant || variant.product.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Produit inconnu.' }, { status: 404 })
    }
    // Déjà disponible : rien à enregistrer, le front rafraîchit son état.
    if (variant.availableForSale) {
      return NextResponse.json({ ok: true, available: true })
    }

    const supabase = getLoyaltyAdminClient()
    const { error } = await supabase.from('stock_alerts').upsert(
      {
        email,
        variant_id: variant.id,
        inventory_item_id: variant.inventoryItem ? gidToNumericId(variant.inventoryItem.id) : null,
        product_handle: variant.product.handle,
        product_title: variant.product.title,
        variant_title: variant.title,
        created_at: new Date().toISOString(),
        notified_at: null,
      },
      { onConflict: 'email,variant_id' }
    )
    if (error) {
      console.error('[stock-alert] upsert', error)
      return NextResponse.json({ error: 'Enregistrement impossible pour le moment.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, available: false })
  } catch (err) {
    console.error('[stock-alert] POST', err)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
