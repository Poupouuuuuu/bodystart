import { describe, it, expect } from 'vitest'
import { validateRedemptionRequest, REDEMPTION_TTL_MS } from './redemption'

describe('validateRedemptionRequest', () => {
  it('OK : 20€ solde + panier 100€ + demande 20€', () => {
    const r = validateRedemptionRequest({
      balanceCents: 2000,
      cartSubtotalCents: 10000,
      requestedAmountCents: 2000,
    })
    expect(r).toEqual({ ok: true, appliedCents: 2000 })
  })

  it('OK : solde 80€, panier 100€, demande 30€ (sous le cap 50% = 50€)', () => {
    const r = validateRedemptionRequest({
      balanceCents: 8000,
      cartSubtotalCents: 10000,
      requestedAmountCents: 3000,
    })
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.appliedCents).toBe(3000)
  })

  it('KO : solde < 20€ → insufficient_balance', () => {
    const r = validateRedemptionRequest({
      balanceCents: 1999,
      cartSubtotalCents: 10000,
      requestedAmountCents: 1000,
    })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.reason).toBe('insufficient_balance')
      expect(r.maxAllowedCents).toBe(0)
    }
  })

  it('KO : demande > cap 50% panier → above_cap', () => {
    const r = validateRedemptionRequest({
      balanceCents: 10000,
      cartSubtotalCents: 10000, // cap 50% = 5000
      requestedAmountCents: 5001,
    })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.reason).toBe('above_cap')
      expect(r.maxAllowedCents).toBe(5000)
    }
  })

  it('KO : demande exactement cap +1 → above_cap', () => {
    const r = validateRedemptionRequest({
      balanceCents: 10000,
      cartSubtotalCents: 10000,
      requestedAmountCents: 5001,
    })
    expect(r.ok).toBe(false)
  })

  it('OK : demande exactement = cap', () => {
    const r = validateRedemptionRequest({
      balanceCents: 10000,
      cartSubtotalCents: 10000,
      requestedAmountCents: 5000,
    })
    expect(r.ok).toBe(true)
  })

  it('KO : panier 0 → invalid_cart', () => {
    const r = validateRedemptionRequest({
      balanceCents: 5000,
      cartSubtotalCents: 0,
      requestedAmountCents: 1000,
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('invalid_cart')
  })

  it('KO : panier négatif → invalid_cart', () => {
    const r = validateRedemptionRequest({
      balanceCents: 5000,
      cartSubtotalCents: -100,
      requestedAmountCents: 1000,
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('invalid_cart')
  })

  it('KO : demande 0 → invalid_request', () => {
    const r = validateRedemptionRequest({
      balanceCents: 5000,
      cartSubtotalCents: 10000,
      requestedAmountCents: 0,
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('invalid_request')
  })

  it('KO : demande négative → invalid_request', () => {
    const r = validateRedemptionRequest({
      balanceCents: 5000,
      cartSubtotalCents: 10000,
      requestedAmountCents: -100,
    })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toBe('invalid_request')
  })

  it('KO : floats interdits sur cents', () => {
    const r1 = validateRedemptionRequest({
      balanceCents: 5000.5,
      cartSubtotalCents: 10000,
      requestedAmountCents: 1000,
    })
    expect(r1.ok).toBe(false)
    const r2 = validateRedemptionRequest({
      balanceCents: 5000,
      cartSubtotalCents: 10000,
      requestedAmountCents: 1000.5,
    })
    expect(r2.ok).toBe(false)
  })

  it('renvoie le maxAllowed dans le cas above_cap', () => {
    const r = validateRedemptionRequest({
      balanceCents: 10000,
      cartSubtotalCents: 4000, // cap = 2000
      requestedAmountCents: 2500,
    })
    if (!r.ok) {
      expect(r.maxAllowedCents).toBe(2000)
    }
  })
})

describe('REDEMPTION_TTL_MS', () => {
  it('vaut 1h en millisecondes', () => {
    expect(REDEMPTION_TTL_MS).toBe(60 * 60 * 1000)
  })
})
