// @vitest-environment jsdom
/**
 * Attributs du panier : cartAttributesUpdate remplace TOUT. La bascule
 * Livraison / Retrait du tiroir effaçait donc source=guide-conseil, objectif
 * et budget (mesure des commandes du guide). setCartAttributes fusionne.
 */
import { createElement } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup, waitFor, act } from '@testing-library/react'

const { getCart, updateCartAttributes, createCart, addToCart, toastMock } = vi.hoisted(() => ({
  getCart: vi.fn(),
  updateCartAttributes: vi.fn(),
  createCart: vi.fn(),
  addToCart: vi.fn(),
  toastMock: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}))
vi.mock('@/lib/shopify', () => ({
  createCart: (...a: unknown[]) => createCart(...a),
  addToCart: (...a: unknown[]) => addToCart(...a),
  updateCartLine: vi.fn(),
  removeFromCart: vi.fn(),
  getCart: (...a: unknown[]) => getCart(...a),
  updateCartAttributes: (...a: unknown[]) => updateCartAttributes(...a),
  updateCartDiscountCodes: vi.fn(),
  updateCartBuyerIdentity: vi.fn(),
}))
vi.mock('@/context/CustomerContext', () => ({ useCustomer: () => ({ customer: null }) }))
vi.mock('@/lib/shopify/customer', () => ({ getStoredToken: () => null }))
vi.mock('@/lib/toast', () => ({ toast: toastMock }))
vi.mock('@/lib/analytics', () => ({ gaAddToCart: vi.fn() }))
vi.mock('@/lib/meta-pixel', () => ({ metaAddToCart: vi.fn() }))

import { CartProvider, useCartContext } from './CartContext'
import { RELAY_ATTRIBUTE_KEYS } from '@/lib/mondialRelay'

const cart = (attributes: { key: string; value: string | null }[]) => ({
  id: 'gid://shopify/Cart/1',
  attributes,
  lines: { nodes: [] },
  totalQuantity: 1,
  cost: { subtotalAmount: { amount: '10', currencyCode: 'EUR' } },
})

let ctx: ReturnType<typeof useCartContext> | null = null
function Probe() {
  ctx = useCartContext()
  return null
}

beforeEach(() => {
  localStorage.setItem('body-start-cart-id', 'gid://shopify/Cart/1')
  getCart.mockReset()
  createCart.mockReset()
  addToCart.mockReset()
  Object.values(toastMock).forEach((f) => f.mockReset())
  updateCartAttributes.mockReset().mockImplementation(async (_id: string, attrs: { key: string; value: string }[]) => cart(attrs))
})
afterEach(() => {
  cleanup()
  localStorage.clear()
  ctx = null
})

describe('setCartAttributes', () => {
  it('fusionne : garde la source du guide, remplace le mode de retrait, retire le point relais', async () => {
    getCart.mockResolvedValue(
      cart([
        { key: 'source', value: 'guide-conseil' },
        { key: 'objectif', value: 'muscle' },
        { key: '__click_and_collect', value: 'false' },
        { key: RELAY_ATTRIBUTE_KEYS[0], value: '12345' },
        { key: RELAY_ATTRIBUTE_KEYS[1], value: 'Relais, 1 rue X' },
      ])
    )
    render(createElement(CartProvider, null, createElement(Probe)))
    await waitFor(() => expect(ctx?.cart?.id).toBe('gid://shopify/Cart/1'))

    await act(() =>
      ctx!.setCartAttributes(
        [
          { key: '__click_and_collect', value: 'true' },
          { key: 'pickup_location_id', value: 'gid://shopify/Location/119350657366' },
        ],
        { remove: RELAY_ATTRIBUTE_KEYS }
      )
    )

    expect(updateCartAttributes).toHaveBeenCalledTimes(1)
    expect(updateCartAttributes.mock.calls[0][1]).toEqual([
      { key: 'source', value: 'guide-conseil' },
      { key: 'objectif', value: 'muscle' },
      { key: '__click_and_collect', value: 'true' },
      { key: 'pickup_location_id', value: 'gid://shopify/Location/119350657366' },
    ])
  })
})

const V = 'gid://shopify/ProductVariant/9'
const avecLignes = (id: string, lignes: [string, number][]) => ({
  ...cart([]),
  id,
  lines: {
    nodes: lignes.map(([m, quantity], i) => ({
      id: `gid://shopify/CartLine/${i}`,
      quantity,
      merchandise: { id: m, title: 'Default Title', product: { handle: 'p', title: 'P' }, price: { amount: '10', currencyCode: 'EUR' } },
    })),
  },
})

describe('addItem : on ne perd jamais le panier du client', () => {
  it('erreur réseau sur cartLinesAdd : panier et identifiant intacts, aucun « ajouté », message clair', async () => {
    getCart.mockResolvedValue(avecLignes('gid://shopify/Cart/1', [['gid://shopify/ProductVariant/1', 1]]))
    addToCart.mockRejectedValue(new TypeError('Failed to fetch'))
    render(createElement(CartProvider, null, createElement(Probe)))
    await waitFor(() => expect(ctx?.cart?.id).toBe('gid://shopify/Cart/1'))

    let ok: boolean | undefined
    await act(async () => {
      ok = await ctx!.addItem(V, 1)
    })
    expect(ok).toBe(false)
    expect(createCart).not.toHaveBeenCalled()
    expect(localStorage.getItem('body-start-cart-id')).toBe('gid://shopify/Cart/1')
    expect(ctx!.cart?.lines.nodes).toHaveLength(1)
    expect(toastMock.success).not.toHaveBeenCalled()
    expect(toastMock.error).toHaveBeenCalledWith("L'ajout n'a pas marché. Ton panier est intact, réessaie.", expect.anything())
  })

  it('chargement initial en échec : l\'identifiant est gardé et réutilisé au clic suivant', async () => {
    getCart.mockRejectedValue(new Error('Shopify GraphQL HTTP 503'))
    addToCart.mockResolvedValue({
      cart: avecLignes('gid://shopify/Cart/1', [['gid://shopify/ProductVariant/1', 1], [V, 1]]),
      userErrors: [],
      warnings: [],
    })
    render(createElement(CartProvider, null, createElement(Probe)))
    await waitFor(() => expect(getCart).toHaveBeenCalled())
    expect(localStorage.getItem('body-start-cart-id')).toBe('gid://shopify/Cart/1')
    await act(async () => {
      await ctx!.addItem(V, 1)
    })
    expect(addToCart).toHaveBeenCalledWith('gid://shopify/Cart/1', [{ merchandiseId: V, quantity: 1 }])
    expect(createCart).not.toHaveBeenCalled()
    expect(ctx!.cart?.lines.nodes).toHaveLength(2)
  })

  it('Shopify dit que le panier n\'existe plus : nouveau panier, et on le dit', async () => {
    getCart.mockResolvedValue(avecLignes('gid://shopify/Cart/1', [['gid://shopify/ProductVariant/1', 1]]))
    addToCart.mockResolvedValue({
      cart: null,
      userErrors: [{ code: 'INVALID', field: ['cartId'], message: "Le panier spécifié n'existe pas." }],
      warnings: [],
    })
    createCart.mockResolvedValue({ cart: avecLignes('gid://shopify/Cart/2', [[V, 1]]), userErrors: [], warnings: [] })
    render(createElement(CartProvider, null, createElement(Probe)))
    await waitFor(() => expect(ctx?.cart?.id).toBe('gid://shopify/Cart/1'))
    let ok: boolean | undefined
    await act(async () => {
      ok = await ctx!.addItem(V, 1)
    })
    expect(ok).toBe(true)
    expect(localStorage.getItem('body-start-cart-id')).toBe('gid://shopify/Cart/2')
    expect(toastMock.success).toHaveBeenCalledWith(
      'Ton ancien panier avait expiré. On en a ouvert un nouveau avec cet article.',
      expect.anything()
    )
  })

  it('userErrors (article refusé) : false, pas de « ajouté », panier inchangé', async () => {
    getCart.mockResolvedValue(avecLignes('gid://shopify/Cart/1', [['gid://shopify/ProductVariant/1', 1]]))
    addToCart.mockResolvedValue({
      cart: avecLignes('gid://shopify/Cart/1', [['gid://shopify/ProductVariant/1', 1]]),
      userErrors: [{ code: 'MERCHANDISE_NOT_APPLICABLE', field: ['lines', '0', 'merchandiseId'], message: 'x' }],
      warnings: [],
    })
    render(createElement(CartProvider, null, createElement(Probe)))
    await waitFor(() => expect(ctx?.cart?.id).toBe('gid://shopify/Cart/1'))
    let ok: boolean | undefined
    await act(async () => {
      ok = await ctx!.addItem(V, 1)
    })
    expect(ok).toBe(false)
    expect(createCart).not.toHaveBeenCalled()
    expect(toastMock.success).not.toHaveBeenCalled()
    expect(toastMock.error).toHaveBeenCalledWith("Cet article n'est plus disponible à la vente.", expect.anything())
  })
})
