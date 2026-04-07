import { NextRequest, NextResponse } from 'next/server'
import { shopifyAdminFetch } from '@/lib/shopify/client'

// Lit les query params → forcer le rendu dynamique pour éviter le warning au build
export const dynamic = 'force-dynamic'

// ─── Rate limiter : 30 requêtes / 1 min par IP (optionnel si Upstash non configuré) ───
let ratelimit: { limit: (key: string) => Promise<{ success: boolean; remaining: number }> } | null = null
if (process.env.UPSTASH_REDIS_REST_URL && !process.env.UPSTASH_REDIS_REST_URL.includes('xxx')) {
  const { Ratelimit } = require('@upstash/ratelimit')
  const { Redis } = require('@upstash/redis')
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    analytics: true,
    prefix: 'ratelimit:inventory',
  })
}

const GET_VARIANT_INVENTORY = `
  query GetVariantInventory($variantId: ID!) {
    productVariant(id: $variantId) {
      id
      inventoryItem {
        id
        inventoryLevels(first: 10) {
          nodes {
            location {
              id
              name
            }
            quantities(names: ["available"]) {
              name
              quantity
            }
          }
        }
      }
    }
  }
`

export async function GET(req: NextRequest) {
  try {
    // ─── Rate limiting (skip si Upstash non configuré) ───
    if (ratelimit) {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
      const { success, remaining } = await ratelimit.limit(ip)

      if (!success) {
        return NextResponse.json(
          { error: 'Trop de requêtes. Réessayez dans quelques instants.' },
          { status: 429, headers: { 'X-RateLimit-Remaining': String(remaining) } }
        )
      }
    }

    const variantId = req.nextUrl.searchParams.get('variantId')
    const locationId = req.nextUrl.searchParams.get('locationId')

    if (!variantId || !locationId) {
      return NextResponse.json(
        { error: 'Paramètres variantId et locationId requis.' },
        { status: 400 }
      )
    }

    const data = await shopifyAdminFetch<{
      productVariant: {
        id: string
        inventoryItem: {
          id: string
          inventoryLevels: {
            nodes: {
              location: { id: string; name: string }
              quantities: { name: string; quantity: number }[]
            }[]
          }
        }
      } | null
    }>(GET_VARIANT_INVENTORY, { variantId })

    if (!data.productVariant) {
      return NextResponse.json({ error: 'Variante introuvable.' }, { status: 404 })
    }

    const level = data.productVariant.inventoryItem.inventoryLevels.nodes.find(
      (l) => l.location.id === locationId
    )

    const available = level?.quantities.find((q) => q.name === 'available')?.quantity ?? 0

    return NextResponse.json({
      available,
      locationId,
      variantId: data.productVariant.id,
    })
  } catch (error) {
    console.error('[Inventory API] Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 })
  }
}
