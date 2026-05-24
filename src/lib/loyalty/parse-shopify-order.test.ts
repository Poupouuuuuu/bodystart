import { describe, it, expect } from 'vitest'
import {
  parseShopifyOrder,
  extractPhoneE164,
  moneyStringToCents,
  type ShopifyOrderPayload,
} from './parse-shopify-order'

describe('moneyStringToCents', () => {
  it('convertit une string Shopify en cents', () => {
    expect(moneyStringToCents('49.90')).toBe(4990)
    expect(moneyStringToCents('100.00')).toBe(10000)
    expect(moneyStringToCents('0.50')).toBe(50)
  })

  it('accepte des nombres directement', () => {
    expect(moneyStringToCents(49.9)).toBe(4990)
    expect(moneyStringToCents(0)).toBe(0)
  })

  it('arrondit a l\'entier le plus proche', () => {
    expect(moneyStringToCents('49.999')).toBe(5000) // round to nearest
    expect(moneyStringToCents('49.991')).toBe(4999)
  })

  it('retourne 0 pour null/undefined/invalid', () => {
    expect(moneyStringToCents(null)).toBe(0)
    expect(moneyStringToCents(undefined)).toBe(0)
    expect(moneyStringToCents('abc')).toBe(0)
    expect(moneyStringToCents('')).toBe(0)
    expect(moneyStringToCents(-10)).toBe(0)
    expect(moneyStringToCents('-10.00')).toBe(0)
  })
})

describe('extractPhoneE164', () => {
  it('prend customer.phone en priorite', () => {
    const payload: ShopifyOrderPayload = {
      customer: { phone: '0612345678', email: 'a@b.fr' },
      shipping_address: { phone: '0699999999' },
    }
    expect(extractPhoneE164(payload)).toBe('+33612345678')
  })

  it('fallback sur shipping_address.phone si customer.phone absent', () => {
    const payload: ShopifyOrderPayload = {
      customer: { email: 'a@b.fr' },
      shipping_address: { phone: '0612345678' },
    }
    expect(extractPhoneE164(payload)).toBe('+33612345678')
  })

  it('fallback sur billing_address.phone en dernier', () => {
    const payload: ShopifyOrderPayload = {
      billing_address: { phone: '0612345678' },
    }
    expect(extractPhoneE164(payload)).toBe('+33612345678')
  })

  it('retourne null si aucun telephone valide', () => {
    const payload: ShopifyOrderPayload = {
      customer: { email: 'a@b.fr' },
    }
    expect(extractPhoneE164(payload)).toBe(null)
  })

  it('retourne null si phones invalides', () => {
    const payload: ShopifyOrderPayload = {
      customer: { phone: 'abc' },
      shipping_address: { phone: '123' },
    }
    expect(extractPhoneE164(payload)).toBe(null)
  })
})

describe('parseShopifyOrder', () => {
  it('parse un payload minimal', () => {
    const payload: ShopifyOrderPayload = {
      id: 12345,
      subtotal_price: '49.90',
      customer: { phone: '+33612345678', email: 'client@bs.fr', first_name: 'Adam', last_name: 'Doe' },
    }
    const result = parseShopifyOrder(payload)
    expect(result.shopifyOrderId).toBe('12345')
    expect(result.phoneE164).toBe('+33612345678')
    expect(result.email).toBe('client@bs.fr')
    expect(result.firstName).toBe('Adam')
    expect(result.lastName).toBe('Doe')
    expect(result.paidItemsCents).toBe(4990)
    expect(result.discountCodes).toEqual([])
  })

  it('parse un payload realiste avec discount codes', () => {
    const payload: ShopifyOrderPayload = {
      id: 'gid://shopify/Order/9999',
      email: 'fallback@bs.fr',
      phone: '0612345678',
      subtotal_price: '79.95',
      discount_codes: [
        { code: 'BS-ABCDE', amount: '5.00', type: 'fixed_amount' },
        { code: 'LOYALTY-XYZ', amount: '20.00', type: 'fixed_amount' },
      ],
    }
    const result = parseShopifyOrder(payload)
    expect(result.shopifyOrderId).toBe('gid://shopify/Order/9999')
    expect(result.phoneE164).toBe('+33612345678')
    expect(result.email).toBe('fallback@bs.fr')
    expect(result.paidItemsCents).toBe(7995)
    expect(result.discountCodes).toEqual(['BS-ABCDE', 'LOYALTY-XYZ'])
  })

  it('fallback sur current_subtotal_price si subtotal_price absent', () => {
    const payload: ShopifyOrderPayload = {
      id: 1,
      current_subtotal_price: '30.00',
      customer: { phone: '+33612345678' },
    }
    expect(parseShopifyOrder(payload).paidItemsCents).toBe(3000)
  })

  it('throw si payload sans id', () => {
    expect(() => parseShopifyOrder({ subtotal_price: '10' } as ShopifyOrderPayload)).toThrow(/missing order id/)
  })

  it('filtre les discount codes vides ou null', () => {
    const payload: ShopifyOrderPayload = {
      id: 1,
      subtotal_price: '10',
      customer: { phone: '+33612345678' },
      discount_codes: [
        { code: 'VALID', amount: '5' },
        { code: '', amount: '0' },
        { code: '   ', amount: '0' },
        { code: null, amount: '0' },
      ],
    }
    expect(parseShopifyOrder(payload).discountCodes).toEqual(['VALID'])
  })

  it('phoneE164 = null si aucun telephone parsable', () => {
    const payload: ShopifyOrderPayload = {
      id: 1,
      subtotal_price: '10',
      customer: { email: 'orphan@bs.fr' },
    }
    expect(parseShopifyOrder(payload).phoneE164).toBe(null)
  })

  it('extrait les noms via shipping_address en fallback', () => {
    const payload: ShopifyOrderPayload = {
      id: 1,
      subtotal_price: '10',
      customer: { phone: '+33612345678' },
      shipping_address: { first_name: 'Marie', last_name: 'Lambert' },
    }
    const result = parseShopifyOrder(payload)
    expect(result.firstName).toBe('Marie')
    expect(result.lastName).toBe('Lambert')
  })
})
