import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { gaEvent, gaViewItem, gaAddToCart, gaBeginCheckout } from './analytics'

/* eslint-disable @typescript-eslint/no-explicit-any */

describe('analytics — sans consentement (gtag absent)', () => {
  it('gaEvent est un no-op silencieux (ne jette pas)', () => {
    // window non défini en environnement node → typeof window === "undefined"
    expect(() => gaEvent('view_item', { a: 1 })).not.toThrow()
    expect(() => gaViewItem({ item_id: 'x', item_name: 'X' })).not.toThrow()
  })
})

describe('analytics — avec consentement (gtag présent)', () => {
  let calls: unknown[][]
  beforeEach(() => {
    calls = []
    ;(globalThis as any).window = {
      gtag: (...args: unknown[]) => calls.push(args),
      location: { href: 'http://localhost/' },
    }
  })
  afterEach(() => {
    delete (globalThis as any).window
  })

  it('view_item : currency EUR + items + value=prix', () => {
    gaViewItem({ item_id: 'whey-native', item_name: 'Whey Native', price: 29.9, item_brand: 'BodyStart' })
    expect(calls).toHaveLength(1)
    const [type, name, params] = calls[0] as [string, string, any]
    expect(type).toBe('event')
    expect(name).toBe('view_item')
    expect(params.currency).toBe('EUR')
    expect(params.value).toBe(29.9)
    expect(params.items).toHaveLength(1)
    expect(params.items[0].item_id).toBe('whey-native')
  })

  it('add_to_cart : value = prix * quantité', () => {
    gaAddToCart({ item_id: 'creatine', item_name: 'Créatine', price: 20, quantity: 2 })
    const params = (calls[0] as any[])[2]
    expect(params.value).toBe(40)
    expect(params.items[0].quantity).toBe(2)
  })

  it('begin_checkout : items + value transmis', () => {
    gaBeginCheckout(
      [
        { item_id: 'a', item_name: 'A', price: 10, quantity: 1 },
        { item_id: 'b', item_name: 'B', price: 5, quantity: 3 },
      ],
      25
    )
    const [, name, params] = calls[0] as [string, string, any]
    expect(name).toBe('begin_checkout')
    expect(params.currency).toBe('EUR')
    expect(params.value).toBe(25)
    expect(params.items).toHaveLength(2)
  })
})
