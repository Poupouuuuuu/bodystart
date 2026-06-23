import { describe, it, expect } from 'vitest'
import { validateAmbassadorRedemption } from './ambassador-redemption'

describe('validateAmbassadorRedemption (dépense cagnotte ambassadeur)', () => {
  it('montant valide dans [10 €, solde] → ok', () => {
    expect(validateAmbassadorRedemption({ usableBalanceCents: 5000, requestedAmountCents: 2000 })).toEqual({
      ok: true,
      appliedCents: 2000,
    })
  })

  it('pile au minimum 10 € → ok', () => {
    expect(validateAmbassadorRedemption({ usableBalanceCents: 1000, requestedAmountCents: 1000 })).toEqual({
      ok: true,
      appliedCents: 1000,
    })
  })

  it('tout le solde → ok', () => {
    expect(validateAmbassadorRedemption({ usableBalanceCents: 3300, requestedAmountCents: 3300 })).toEqual({
      ok: true,
      appliedCents: 3300,
    })
  })

  it('solde utilisable < 10 € (ou expiré → 0) → insufficient_balance', () => {
    expect(validateAmbassadorRedemption({ usableBalanceCents: 900, requestedAmountCents: 900 })).toEqual({
      ok: false,
      reason: 'insufficient_balance',
      maxAllowedCents: 0,
    })
    expect(validateAmbassadorRedemption({ usableBalanceCents: 0, requestedAmountCents: 1000 })).toEqual({
      ok: false,
      reason: 'insufficient_balance',
      maxAllowedCents: 0,
    })
  })

  it('montant demandé < 10 € (solde suffisant) → below_min', () => {
    const r = validateAmbassadorRedemption({ usableBalanceCents: 5000, requestedAmountCents: 500 })
    expect(r).toEqual({ ok: false, reason: 'below_min', maxAllowedCents: 5000 })
  })

  it('montant > solde utilisable → above_balance', () => {
    const r = validateAmbassadorRedemption({ usableBalanceCents: 1500, requestedAmountCents: 2000 })
    expect(r).toEqual({ ok: false, reason: 'above_balance', maxAllowedCents: 1500 })
  })

  it('montant <= 0 ou non entier → invalid_request', () => {
    expect(validateAmbassadorRedemption({ usableBalanceCents: 5000, requestedAmountCents: 0 }).ok).toBe(false)
    expect(validateAmbassadorRedemption({ usableBalanceCents: 5000, requestedAmountCents: -100 }).ok).toBe(false)
    expect(validateAmbassadorRedemption({ usableBalanceCents: 5000, requestedAmountCents: 10.5 }).ok).toBe(false)
  })
})
