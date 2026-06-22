import { describe, it, expect } from 'vitest'
import {
  calcAmbassadorCommissionCents,
  computeAmbassadorEligibleCents,
  isAmbassadorCagnotteExpired,
  usableAmbassadorBalanceCents,
  AMBASSADOR_RATE_DEFAULT,
  AMBASSADOR_REDEEM_MIN_BALANCE_CENTS,
  type OrderLine,
} from './ambassador'

describe('calcAmbassadorCommissionCents', () => {
  it('10 % de 10000 = 1000 (arrondi inférieur comme le parrainage)', () => {
    expect(calcAmbassadorCommissionCents(10000, 0.1)).toBe(1000)
    expect(calcAmbassadorCommissionCents(2999, 0.1)).toBe(299) // floor(299.9)
  })
  it('taux par défaut = 0.10', () => {
    expect(AMBASSADOR_RATE_DEFAULT).toBe(0.1)
  })
  it('rejette les entrées invalides → 0', () => {
    expect(calcAmbassadorCommissionCents(-5, 0.1)).toBe(0)
    expect(calcAmbassadorCommissionCents(1000.5, 0.1)).toBe(0)
    expect(calcAmbassadorCommissionCents(1000, 0)).toBe(0)
    expect(calcAmbassadorCommissionCents(1000, 1.5)).toBe(0)
  })
})

describe('computeAmbassadorEligibleCents (exclusion par tag)', () => {
  const lines: OrderLine[] = [
    { productId: '111', linePostDiscountCents: 4000 }, // whey
    { productId: '222', linePostDiscountCents: 6000 }, // pack (exclu en test)
    { productId: null, linePostDiscountCents: 500 }, // ligne sans produit
  ]
  it('liste vide → somme complète (fast path)', () => {
    expect(computeAmbassadorEligibleCents(lines, new Set())).toBe(10500)
  })
  it('produit exclu retiré de l’assiette', () => {
    expect(computeAmbassadorEligibleCents(lines, new Set(['222']))).toBe(4500)
  })
  it('tous exclus → 0', () => {
    expect(computeAmbassadorEligibleCents(lines, new Set(['111', '222']))).toBe(4500 - 4000) // 500 (ligne sans id reste)
  })
})

describe('expiration 12 mois inactivité', () => {
  const now = new Date('2026-06-12T12:00:00Z')
  it('activité récente → non expiré', () => {
    expect(isAmbassadorCagnotteExpired('2026-01-01T00:00:00Z', now)).toBe(false)
  })
  it('> 12 mois sans activité → expiré', () => {
    expect(isAmbassadorCagnotteExpired('2025-05-01T00:00:00Z', now)).toBe(true)
  })
})

describe('usableAmbassadorBalanceCents (min 10€ + expiration)', () => {
  const now = new Date('2026-06-12T12:00:00Z')
  const fresh = '2026-06-01T00:00:00Z'
  it('seuil mini = 10 € (1000c)', () => {
    expect(AMBASSADOR_REDEEM_MIN_BALANCE_CENTS).toBe(1000)
  })
  it('sous 10 € → 0', () => {
    expect(usableAmbassadorBalanceCents(900, fresh, now)).toBe(0)
  })
  it('≥ 10 € et actif → solde', () => {
    expect(usableAmbassadorBalanceCents(1500, fresh, now)).toBe(1500)
  })
  it('expiré → 0 même si solde élevé', () => {
    expect(usableAmbassadorBalanceCents(5000, '2025-01-01T00:00:00Z', now)).toBe(0)
  })
})
