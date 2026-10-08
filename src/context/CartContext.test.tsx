// @vitest-environment jsdom
/**
 * Attributs du panier : cartAttributesUpdate remplace TOUT. La bascule
 * Livraison / Retrait du tiroir effaçait donc source=guide-conseil, objectif
 * et budget (mesure des commandes du guide). setCartAttributes fusionne.
 */
import { createElement } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup, waitFor, act } from '@testing-library/react'

const { getCart, updateCartAttributes } = vi.hoisted(() => ({ getCart: vi.fn(), updateCartAttributes: vi.fn() }))
vi.mock('@/lib/shopify', () => ({
  createCart: vi.fn(),
  addToCart: vi.fn(),
  updateCartLine: vi.fn(),
  removeFromCart: vi.fn(),
  getCart: (...a: unknown[]) => getCart(...a),
  updateCartAttributes: (...a: unknown[]) => updateCartAttributes(...a),
  updateCartDiscountCodes: vi.fn(),
  updateCartBuyerIdentity: vi.fn(),
}))
vi.mock('@/context/CustomerContext', () => ({ useCustomer: () => ({ customer: null }) }))
vi.mock('@/lib/shopify/customer', () => ({ getStoredToken: () => null }))
vi.mock('@/lib/toast', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

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
