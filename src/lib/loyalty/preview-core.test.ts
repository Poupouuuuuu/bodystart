import { describe, it, expect } from 'vitest'
import { buildPreview } from './preview-core'

describe('buildPreview', () => {
  it('balance < 20 € : eligible=false, reason=balance_below_minimum', () => {
    const out = buildPreview({
      customer: { id: 'c1', loyaltyBalanceCents: 1500 },
      cartSubtotalCents: 5000,
    })
    expect(out.eligible).toBe(false)
    expect(out.reason).toBe('balance_below_minimum')
    expect(out.maxRedeemableCents).toBe(0)
    expect(out.balanceCents).toBe(1500)
  })

  it('balance >= 20 €, cart > 0 : eligible=true', () => {
    const out = buildPreview({
      customer: { id: 'c1', loyaltyBalanceCents: 5000 },
      cartSubtotalCents: 10000,
    })
    expect(out.eligible).toBe(true)
    expect(out.reason).toBeUndefined()
    expect(out.maxRedeemableCents).toBe(5000) // min(balance, 50% cart) = min(5000, 5000)
    expect(out.balanceCents).toBe(5000)
  })

  it('cap 50 % du panier applique', () => {
    const out = buildPreview({
      customer: { id: 'c1', loyaltyBalanceCents: 10000 },
      cartSubtotalCents: 6000,
    })
    expect(out.eligible).toBe(true)
    expect(out.maxRedeemableCents).toBe(3000) // 50% de 6000
  })

  it('cart <= 0 : eligible=false, reason=invalid_cart', () => {
    const out = buildPreview({
      customer: { id: 'c1', loyaltyBalanceCents: 5000 },
      cartSubtotalCents: 0,
    })
    expect(out.eligible).toBe(false)
    expect(out.reason).toBe('invalid_cart')
  })

  it('config exposee dans la reponse', () => {
    const out = buildPreview({
      customer: { id: 'c1', loyaltyBalanceCents: 5000 },
      cartSubtotalCents: 10000,
    })
    expect(out.config.minBalanceCents).toBe(2000)
    expect(out.config.cartCapRatio).toBe(0.5)
  })
})
