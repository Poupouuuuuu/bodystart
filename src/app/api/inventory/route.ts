import { NextRequest, NextResponse } from 'next/server'
import { shopifyAdminFetch } from '@/lib/shopify/client'
import { getProductInventoryByLocation, getInventoryForVariants } from '@/lib/shopify'

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

const MAX_VARIANT_IDS = 10
const VARIANT_GID = /^gid:\/\/shopify\/ProductVariant\/\d+$/

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
    const productId = req.nextUrl.searchParams.get('productId')
    const variantIds = req.nextUrl.searchParams.get('variantIds')
    const locationId = req.nextUrl.searchParams.get('locationId')

    if ((!variantId && !productId && !variantIds) || !locationId) {
      return NextResponse.json(
        { error: 'Paramètres (variantId, productId OU variantIds) et locationId requis.' },
        { status: 400 }
      )
    }

    // ─── Mode LISTE : quelques variantes en 1 appel Admin ───
    // (guide /conseil : revérification du stock boutique juste avant de
    // réserver la sélection, au plus quelques produits.)
    if (variantIds) {
      const ids = variantIds.split(',').map((s) => s.trim()).filter(Boolean)
      if (ids.length === 0 || ids.length > MAX_VARIANT_IDS || !ids.every((id) => VARIANT_GID.test(id))) {
        return NextResponse.json(
          { error: `variantIds : 1 à ${MAX_VARIANT_IDS} identifiants de variante Shopify.` },
          { status: 400 }
        )
      }
      const levels = await getInventoryForVariants(ids, locationId)
      return NextResponse.json({
        locationId,
        variants: ids.map((id) => ({ variantId: id, available: levels[id] ?? 0 })),
      })
    }

    // ─── Mode PRODUIT : stock de TOUTES les variantes en 1 appel Admin ───
    // (fiche produit ISR : le stock C&C temps réel est fetché côté client —
    // 1 requête par vue au lieu d'1 par variante.)
    if (productId) {
      const levels = await getProductInventoryByLocation(productId, locationId)
      return NextResponse.json({
        locationId,
        productId,
        variants: levels.map((l) => ({ variantId: l.variantId, available: l.available })),
        totalAvailable: levels.reduce((sum, l) => sum + l.available, 0),
      })
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
