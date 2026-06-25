import { describe, it, expect } from 'vitest'
import {
  calcAmbassadorCommissionCents,
  computeAmbassadorEligibleCents,
  isAmbassadorCagnotteExpired,
  isAmbassadorSelfPurchase,
  isAmbassadorSelfMatch,
  computeCagnotteAdjustment,
  AMBASSADOR_MANUAL_ADJUST_MAX_CENTS,
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

describe('isAmbassadorSelfPurchase (anti auto-commission)', () => {
  it('même email (casse/espaces ignorés) → true', () => {
    expect(isAmbassadorSelfPurchase('Julie@Email.com', 'julie@email.com')).toBe(true)
    expect(isAmbassadorSelfPurchase('  julie@email.com ', 'julie@email.com')).toBe(true)
  })
  it('emails différents → false', () => {
    expect(isAmbassadorSelfPurchase('client@email.com', 'julie@email.com')).toBe(false)
  })
  it('email acheteur manquant → false (on ne bloque pas à l’aveugle)', () => {
    expect(isAmbassadorSelfPurchase(null, 'julie@email.com')).toBe(false)
    expect(isAmbassadorSelfPurchase(undefined, 'julie@email.com')).toBe(false)
    expect(isAmbassadorSelfPurchase('', 'julie@email.com')).toBe(false)
  })
  it('email ambassadeur manquant → false', () => {
    expect(isAmbassadorSelfPurchase('julie@email.com', null)).toBe(false)
  })
})

describe('isAmbassadorSelfMatch (anti-triche email OU téléphone)', () => {
  // CAS 1 — 2e compte, AUTRE email mais MÊME téléphone → BLOQUÉ.
  it('email différent mais même tél (formats FR/+33) → true (bloqué)', () => {
    expect(isAmbassadorSelfMatch('compte2@email.com', '06 12 34 56 78', 'julie@email.com', '+33612345678')).toBe(true)
    // normalisation : espaces/points/tirets + 0↔+33
    expect(isAmbassadorSelfMatch('x@y.fr', '0612345678', 'julie@email.com', '06.12.34.56.78')).toBe(true)
    expect(isAmbassadorSelfMatch('x@y.fr', '+33 6 12 34 56 78', 'julie@email.com', '06-12-34-56-78')).toBe(true)
  })
  // CAS 2 — vrai client : email ET tél différents → CRÉDITÉ (pas de match).
  it('email ET tél différents → false (vrai client, crédité)', () => {
    expect(isAmbassadorSelfMatch('client@email.com', '0699887766', 'julie@email.com', '0612345678')).toBe(false)
  })
  // CAS 3 — ambassadeur SANS tél → email-only, aucune régression.
  it('ambassadeur sans tél → email-only (pas de match sur le tél)', () => {
    // même email → bloqué (comme avant)
    expect(isAmbassadorSelfMatch('julie@email.com', '0612345678', 'julie@email.com', null)).toBe(true)
    // email différent + ambassadeur sans tél → crédité (pas de régression)
    expect(isAmbassadorSelfMatch('client@email.com', '0612345678', 'julie@email.com', null)).toBe(false)
    expect(isAmbassadorSelfMatch('client@email.com', '0612345678', 'julie@email.com', undefined)).toBe(false)
  })
  it('acheteur sans tél + ambassadeur avec tél → pas de match tél (email seul décide)', () => {
    expect(isAmbassadorSelfMatch('client@email.com', null, 'julie@email.com', '0612345678')).toBe(false)
    expect(isAmbassadorSelfMatch('client@email.com', '', 'julie@email.com', '0612345678')).toBe(false)
  })
  it('téléphones invalides des deux côtés → pas de faux positif', () => {
    expect(isAmbassadorSelfMatch('a@b.fr', 'abc', 'c@d.fr', 'xyz')).toBe(false)
  })
  it('priorité email : même email suffit même si tél absent partout', () => {
    expect(isAmbassadorSelfMatch('Julie@Email.com', null, 'julie@email.com', null)).toBe(true)
  })
})

describe('computeCagnotteAdjustment (ajustement manuel admin +/−)', () => {
  it('CRÉDIT (+) : solde 1500 + 1000 → 2500, appliqué +1000, non plafonné', () => {
    const r = computeCagnotteAdjustment(1500, 1000)
    expect(r).toMatchObject({ valid: true, reason: 'applied', appliedDeltaCents: 1000, newBalanceCents: 2500, capped: false })
  })
  it('DÉDUCTION (−) normale : solde 3500 − 2000 → 1500, appliqué −2000', () => {
    const r = computeCagnotteAdjustment(3500, -2000)
    expect(r).toMatchObject({ valid: true, reason: 'applied', appliedDeltaCents: -2000, newBalanceCents: 1500, capped: false })
  })
  it('PLANCHER 0 : déduire 5000 sur 3500 → solde 0, appliqué −3500, capped=true', () => {
    const r = computeCagnotteAdjustment(3500, -5000)
    expect(r).toMatchObject({ valid: true, reason: 'applied', appliedDeltaCents: -3500, newBalanceCents: 0, capped: true })
  })
  it('NO_CHANGE : déduire alors que solde = 0 → aucune écriture', () => {
    const r = computeCagnotteAdjustment(0, -2000)
    expect(r).toMatchObject({ valid: true, reason: 'no_change', appliedDeltaCents: 0, newBalanceCents: 0, capped: true })
  })
  it('DELTA = 0 → invalide (zero_delta)', () => {
    expect(computeCagnotteAdjustment(1000, 0).reason).toBe('zero_delta')
    expect(computeCagnotteAdjustment(1000, 0).valid).toBe(false)
  })
  it('CAP anti-fat-finger ±1 000 € : 100001c → exceeds_cap', () => {
    expect(AMBASSADOR_MANUAL_ADJUST_MAX_CENTS).toBe(100000)
    expect(computeCagnotteAdjustment(0, 100001).reason).toBe('exceeds_cap')
    expect(computeCagnotteAdjustment(500000, -100001).valid).toBe(false)
    // pile au cap → autorisé
    expect(computeCagnotteAdjustment(0, 100000)).toMatchObject({ valid: true, reason: 'applied', newBalanceCents: 100000 })
  })
  it('solde négatif/invalide traité comme 0', () => {
    expect(computeCagnotteAdjustment(-50, 1000)).toMatchObject({ newBalanceCents: 1000, appliedDeltaCents: 1000 })
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
