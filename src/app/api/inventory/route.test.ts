import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

const { getInventoryForVariants, getProductInventoryByLocation } = vi.hoisted(() => ({
  getInventoryForVariants: vi.fn(),
  getProductInventoryByLocation: vi.fn(),
}))
vi.mock('@/lib/shopify', () => ({
  getInventoryForVariants: (...a: unknown[]) => getInventoryForVariants(...a),
  getProductInventoryByLocation: (...a: unknown[]) => getProductInventoryByLocation(...a),
}))
vi.mock('@/lib/shopify/client', () => ({ shopifyAdminFetch: vi.fn() }))

import { GET } from './route'

const LOC = 'gid://shopify/Location/119350657366'
const v = (n: number) => `gid://shopify/ProductVariant/${n}`

async function appel(params: Record<string, string>) {
  const res = await GET(new NextRequest(`http://x/api/inventory?${new URLSearchParams(params)}`))
  return { status: res.status, json: await res.json() }
}

beforeEach(() => {
  getInventoryForVariants.mockReset()
  getProductInventoryByLocation.mockReset()
})

describe('GET /api/inventory, mode variantIds (guide /conseil)', () => {
  it('renvoie le stock boutique de chaque variante demandée (0 si inconnue)', async () => {
    getInventoryForVariants.mockResolvedValue({ [v(1)]: 3 })
    const r = await appel({ variantIds: `${v(1)},${v(2)}`, locationId: LOC })
    expect(r.status).toBe(200)
    expect(getInventoryForVariants).toHaveBeenCalledWith([v(1), v(2)], LOC)
    expect(r.json).toEqual({
      locationId: LOC,
      variants: [
        { variantId: v(1), available: 3 },
        { variantId: v(2), available: 0 },
      ],
    })
  })

  it('400 : identifiant invalide, plus de 10 variantes, liste vide, emplacement manquant', async () => {
    expect((await appel({ variantIds: 'gid://shopify/Product/1', locationId: LOC })).status).toBe(400)
    const onze = Array.from({ length: 11 }, (_, i) => v(i + 1)).join(',')
    expect((await appel({ variantIds: onze, locationId: LOC })).status).toBe(400)
    expect((await appel({ variantIds: ' , ', locationId: LOC })).status).toBe(400)
    expect((await appel({ variantIds: v(1) })).status).toBe(400)
    expect(getInventoryForVariants).not.toHaveBeenCalled()
  })

  it('le mode produit existant est inchangé', async () => {
    getProductInventoryByLocation.mockResolvedValue([{ variantId: v(1), title: 'Chocolat', available: 2 }])
    const r = await appel({ productId: 'gid://shopify/Product/9', locationId: LOC })
    expect(r.json).toEqual({
      locationId: LOC,
      productId: 'gid://shopify/Product/9',
      variants: [{ variantId: v(1), available: 2 }],
      totalAvailable: 2,
    })
  })
})
