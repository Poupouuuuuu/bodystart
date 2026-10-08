import { describe, it, expect, vi, beforeEach } from 'vitest'

const { shopifyFetch, getInventoryForVariants } = vi.hoisted(() => ({
  shopifyFetch: vi.fn(),
  getInventoryForVariants: vi.fn(),
}))
vi.mock('@/lib/shopify/client', () => ({ shopifyFetch: (...a: unknown[]) => shopifyFetch(...a) }))
vi.mock('@/lib/shopify', () => ({ getInventoryForVariants: (...a: unknown[]) => getInventoryForVariants(...a) }))

import { chargerGuideConseil } from './donnees'
import { GUIDE_BRUT, PRODUITS } from './test-utils'

const LOCATION = 'gid://shopify/Location/119350657366'

/** Réponse Storefront simulée pour la requête produits (alias p0, p1… dans l'ordre des variables). */
function reponseProduits(variables: Record<string, string>, absents: string[] = []) {
  return Object.fromEntries(
    Object.entries(variables).map(([k, handle]) => {
      const p = PRODUITS[handle]
      if (!p || absents.includes(handle)) return [`p${k.slice(1)}`, null]
      return [
        `p${k.slice(1)}`,
        {
          id: `gid://shopify/Product/${handle}`,
          handle,
          title: p.titre,
          featuredImage: p.image,
          variants: {
            nodes: p.variantes.map((v) => ({
              id: v.id,
              title: v.titre,
              availableForSale: !v.titre.includes('Orange'),
              price: { amount: (v.prixCents / 100).toFixed(2), currencyCode: 'EUR' },
              image: null,
            })),
          },
        },
      ]
    })
  )
}

function simulerShopify({ metafield = JSON.stringify(GUIDE_BRUT) as string | null, absents = [] as string[] } = {}) {
  shopifyFetch.mockImplementation(async (query: string, variables?: Record<string, string>) => {
    if (query.includes('guide_conseil')) return { shop: { metafield: metafield === null ? null : { value: metafield } } }
    return reponseProduits(variables ?? {}, absents)
  })
}

beforeEach(() => {
  shopifyFetch.mockReset()
  getInventoryForVariants.mockReset()
  getInventoryForVariants.mockImplementation(async (ids: string[]) =>
    Object.fromEntries(ids.map((id, i) => [id, i % 3 === 0 ? 0 : 4]))
  )
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('chargerGuideConseil', () => {
  it('lit le guide, les produits (une requête, handles en variables) et le stock de la boutique active', async () => {
    simulerShopify()
    const d = await chargerGuideConseil()
    expect(d.ok).toBe(true)
    if (!d.ok) return

    const [query, variables] = shopifyFetch.mock.calls[1]
    expect(Object.keys(variables)).toHaveLength(17) // 19 clés produit (v3, sans ZMA), 17 handles distincts
    expect(query).toContain('p16: product(handle: $h16)')
    expect(query).not.toContain('p17:')
    expect(query).not.toContain('whey-native-protimuscle')
    expect(getInventoryForVariants).toHaveBeenCalledTimes(1)
    expect(getInventoryForVariants.mock.calls[0][1]).toBe(LOCATION)

    expect(Object.keys(d.catalogue)).toHaveLength(19)
    expect(d.catalogue.protimuscle1.handle).toBe('whey-native-protimuscle')
    expect(d.catalogue.protimuscle225.variantes).toEqual(d.catalogue.protimuscle1.variantes)
    expect(d.catalogue.creatine.variantes[0]).toMatchObject({ prixCents: 3690 })
  })

  it('ne garde que les variantes vendables et en stock', async () => {
    simulerShopify()
    const d = await chargerGuideConseil()
    if (!d.ok) throw new Error('attendu ok')
    for (const p of Object.values(d.catalogue)) {
      for (const v of p.variantes) {
        expect(v.disponible).toBe(true)
        expect(v.stock).toBeGreaterThan(0)
      }
    }
    expect(d.catalogue.clearwhey.variantes.some((v) => v.titre === 'Orange')).toBe(false)
  })

  it('produit introuvable : clé absente du catalogue, le guide reste utilisable', async () => {
    simulerShopify({ absents: ['crunch-bar-barre-proteinee'] })
    const d = await chargerGuideConseil()
    expect(d.ok).toBe(true)
    if (d.ok) expect(d.catalogue.crunch).toBeUndefined()
  })

  it('repli (jamais d’exception) : metafield absent, JSON invalide, guide incohérent', async () => {
    simulerShopify({ metafield: null })
    expect(await chargerGuideConseil()).toEqual({ ok: false })

    simulerShopify({ metafield: '{"version":1' })
    expect(await chargerGuideConseil()).toEqual({ ok: false })

    const incoherent = structuredClone(GUIDE_BRUT) as unknown as { objectifs: { sante: { parcours: { standard: Record<string, unknown> } } } }
    delete incoherent.objectifs.sante.parcours.standard['40-90']
    simulerShopify({ metafield: JSON.stringify(incoherent) })
    expect(await chargerGuideConseil()).toEqual({ ok: false })
  })

  it('repli si Shopify ou le stock ne répondent pas', async () => {
    shopifyFetch.mockRejectedValue(new Error('Shopify GraphQL HTTP 503'))
    expect(await chargerGuideConseil()).toEqual({ ok: false })

    simulerShopify()
    getInventoryForVariants.mockRejectedValue(new Error('[Shopify Admin] SHOPIFY_ADMIN_API_ACCESS_TOKEN non configuré.'))
    expect(await chargerGuideConseil()).toEqual({ ok: false })
  })
})
