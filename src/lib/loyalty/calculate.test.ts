/**
 * Tests unitaires des fonctions pures loyalty (Sprint L1).
 * Spec : tech-specs/loyalty-system-spec-v2.md §3, §10.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  calcReferrerCommissionCents,
  maxRedeemableCents,
  generateReferralCode,
  calcReferralCommissionUntil,
  isWithinReferralWindow,
  isFilleulDiscountEligible,
  isValidReferralCode,
  REFERRAL_COMMISSION_RATE,
  REFERRAL_WINDOW_MONTHS,
  FILLEUL_MIN_ORDER_CENTS,
  REDEEM_MIN_BALANCE_CENTS,
  REDEEM_CART_CAP_RATIO,
  REFERRAL_CODE_ALPHABET,
  REFERRAL_CODE_PREFIX,
  REFERRAL_CODE_LENGTH,
} from './calculate'

// ============================================================
// calcReferrerCommissionCents
// ============================================================
describe('calcReferrerCommissionCents', () => {
  it('retourne 0 pour un montant zero', () => {
    expect(calcReferrerCommissionCents(0)).toBe(0)
  })

  it('retourne 0 pour un montant negatif', () => {
    expect(calcReferrerCommissionCents(-100)).toBe(0)
    expect(calcReferrerCommissionCents(-1)).toBe(0)
  })

  it('retourne 0 pour un input non entier', () => {
    expect(calcReferrerCommissionCents(10.5)).toBe(0)
    expect(calcReferrerCommissionCents(NaN)).toBe(0)
    expect(calcReferrerCommissionCents(Infinity)).toBe(0)
  })

  it('calcule 5% d\'un montant entier', () => {
    // 40€ → 2€ (200 centimes)
    expect(calcReferrerCommissionCents(4000)).toBe(200)
    // 100€ → 5€
    expect(calcReferrerCommissionCents(10000)).toBe(500)
    // 1000€ → 50€
    expect(calcReferrerCommissionCents(100000)).toBe(5000)
  })

  it('arrondit a l\'entier inferieur (pas de fractions de centime)', () => {
    // 1€ → 5 centimes exactement
    expect(calcReferrerCommissionCents(100)).toBe(5)
    // 1,01€ (101c) → 5,05c → 5c
    expect(calcReferrerCommissionCents(101)).toBe(5)
    // 19€ (1900c) → 95c
    expect(calcReferrerCommissionCents(1900)).toBe(95)
    // 19,99€ (1999c) → 99,95c → 99c
    expect(calcReferrerCommissionCents(1999)).toBe(99)
  })

  it('respecte le taux configure', () => {
    expect(REFERRAL_COMMISSION_RATE).toBe(0.05)
  })
})

// ============================================================
// maxRedeemableCents
// ============================================================
describe('maxRedeemableCents', () => {
  it('retourne 0 si le solde est sous le seuil minimum (20€)', () => {
    expect(maxRedeemableCents(10000, 0)).toBe(0)
    expect(maxRedeemableCents(10000, 1)).toBe(0)
    expect(maxRedeemableCents(10000, 1999)).toBe(0)
  })

  it('autorise des le seuil minimum atteint (≥ 20€)', () => {
    // panier 100€, solde 20€ pile → 20€ utilisables (cap 50% = 50€, solde = 20€)
    expect(maxRedeemableCents(10000, 2000)).toBe(2000)
  })

  it('plafonne a 50% du panier quand le solde depasse', () => {
    // panier 100€ (10000c), solde 80€ (8000c) → cap 50% = 5000c, retourne 5000
    expect(maxRedeemableCents(10000, 8000)).toBe(5000)
    // panier 50€, solde 100€ → cap 25€
    expect(maxRedeemableCents(5000, 10000)).toBe(2500)
  })

  it('retourne le solde si inferieur au cap 50%', () => {
    // panier 200€, solde 30€ → cap 100€, solde 30€ → retourne 30€
    expect(maxRedeemableCents(20000, 3000)).toBe(3000)
  })

  it('retourne 0 pour un panier nul ou negatif', () => {
    expect(maxRedeemableCents(0, 10000)).toBe(0)
    expect(maxRedeemableCents(-100, 10000)).toBe(0)
  })

  it('retourne 0 pour des entrees non entieres', () => {
    expect(maxRedeemableCents(10.5, 2000)).toBe(0)
    expect(maxRedeemableCents(10000, 20.5)).toBe(0)
    expect(maxRedeemableCents(NaN, 2000)).toBe(0)
  })

  it('arrondit le cap a l\'entier inferieur', () => {
    // panier 41c (cap 50% = 20.5c → 20c), solde 2000c → cap 20c gagne
    // (cas absurde mais teste le Math.floor)
    expect(maxRedeemableCents(41, 2000)).toBe(20)
  })

  it('respecte les seuils configures', () => {
    expect(REDEEM_MIN_BALANCE_CENTS).toBe(2000)
    expect(REDEEM_CART_CAP_RATIO).toBe(0.5)
  })
})

// ============================================================
// generateReferralCode
// ============================================================
describe('generateReferralCode', () => {
  it('genere un code au format BS-XXXXX', () => {
    const code = generateReferralCode()
    expect(code).toMatch(/^BS-[A-Z2-9]{5}$/)
  })

  it('utilise uniquement l\'alphabet autorise (sans 0/O/1/I/L)', () => {
    for (let i = 0; i < 100; i++) {
      const code = generateReferralCode()
      const tail = code.slice(REFERRAL_CODE_PREFIX.length)
      for (const ch of tail) {
        expect(REFERRAL_CODE_ALPHABET).toContain(ch)
        // Anti-confusion : aucun 0, O, 1, I, L
        expect(ch).not.toBe('0')
        expect(ch).not.toBe('O')
        expect(ch).not.toBe('1')
        expect(ch).not.toBe('I')
        expect(ch).not.toBe('L')
      }
    }
  })

  it('produit des codes de longueur fixe (prefixe + 5 chars)', () => {
    for (let i = 0; i < 50; i++) {
      const code = generateReferralCode()
      expect(code.length).toBe(REFERRAL_CODE_PREFIX.length + REFERRAL_CODE_LENGTH)
    }
  })

  it('a une diversite acceptable sur 100 generations (anti-collision statistique)', () => {
    // 100 codes uniques attendus dans 31^5 = ~28M combinaisons.
    // Probabilite de collision sur 100 tirages est minime (~5e-5 par paire).
    const codes = new Set<string>()
    for (let i = 0; i < 100; i++) {
      codes.add(generateReferralCode())
    }
    expect(codes.size).toBe(100)
  })
})

// ============================================================
// calcReferralCommissionUntil
// ============================================================
describe('calcReferralCommissionUntil', () => {
  it('ajoute 12 mois a une date fournie', () => {
    const start = new Date('2026-05-23T10:00:00Z')
    const until = calcReferralCommissionUntil(start)
    expect(until.getUTCFullYear()).toBe(2027)
    expect(until.getUTCMonth()).toBe(4) // mai (0-indexed)
    expect(until.getUTCDate()).toBe(23)
  })

  it('ne mute pas la date d\'entree', () => {
    const start = new Date('2026-05-23T10:00:00Z')
    const startCopy = new Date(start.getTime())
    calcReferralCommissionUntil(start)
    expect(start.getTime()).toBe(startCopy.getTime())
  })

  it('gere le passage d\'annee', () => {
    const start = new Date('2026-12-15T00:00:00Z')
    const until = calcReferralCommissionUntil(start)
    expect(until.getUTCFullYear()).toBe(2027)
    expect(until.getUTCMonth()).toBe(11) // decembre
    expect(until.getUTCDate()).toBe(15)
  })

  it('respecte la fenetre configuree', () => {
    expect(REFERRAL_WINDOW_MONTHS).toBe(12)
  })
})

// ============================================================
// isWithinReferralWindow
// ============================================================
describe('isWithinReferralWindow', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('retourne false si firstPurchaseAt est null', () => {
    expect(isWithinReferralWindow(null)).toBe(false)
    expect(isWithinReferralWindow(undefined)).toBe(false)
  })

  it('retourne true si on est dans la fenetre 12 mois', () => {
    const firstPurchase = new Date('2026-05-23T10:00:00Z')
    // 6 mois plus tard
    const sixMonthsLater = new Date('2026-11-23T10:00:00Z')
    expect(isWithinReferralWindow(firstPurchase, sixMonthsLater)).toBe(true)
  })

  it('retourne true le jour pile de la fenetre + 12 mois', () => {
    const firstPurchase = new Date('2026-05-23T10:00:00Z')
    const exactlyTwelveMonths = new Date('2027-05-23T10:00:00Z')
    expect(isWithinReferralWindow(firstPurchase, exactlyTwelveMonths)).toBe(true)
  })

  it('retourne false si on depasse la fenetre 12 mois (>1 jour)', () => {
    const firstPurchase = new Date('2026-05-23T10:00:00Z')
    const oneDayAfterWindow = new Date('2027-05-24T10:00:01Z')
    expect(isWithinReferralWindow(firstPurchase, oneDayAfterWindow)).toBe(false)
  })

  it('retourne false 2 ans plus tard', () => {
    const firstPurchase = new Date('2024-01-01T00:00:00Z')
    const twoYearsLater = new Date('2026-01-01T00:00:00Z')
    expect(isWithinReferralWindow(firstPurchase, twoYearsLater)).toBe(false)
  })

  it('utilise Date.now() par defaut si pas de now fourni', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-01T00:00:00Z'))
    const firstPurchase = new Date('2026-01-01T00:00:00Z')
    expect(isWithinReferralWindow(firstPurchase)).toBe(true)

    vi.setSystemTime(new Date('2027-06-01T00:00:00Z'))
    expect(isWithinReferralWindow(firstPurchase)).toBe(false)
  })
})

// ============================================================
// isFilleulDiscountEligible
// ============================================================
describe('isFilleulDiscountEligible', () => {
  it('retourne false si le filleul a deja fait un achat', () => {
    expect(isFilleulDiscountEligible(5000, true)).toBe(false)
    expect(isFilleulDiscountEligible(100000, true)).toBe(false)
  })

  it('retourne false si la commande est sous le minimum (40€)', () => {
    expect(isFilleulDiscountEligible(0, false)).toBe(false)
    expect(isFilleulDiscountEligible(3999, false)).toBe(false)
  })

  it('retourne true si 1ere commande + montant ≥ 40€', () => {
    expect(isFilleulDiscountEligible(4000, false)).toBe(true)
    expect(isFilleulDiscountEligible(10000, false)).toBe(true)
  })

  it('retourne false pour des entrees non entieres', () => {
    expect(isFilleulDiscountEligible(4000.5, false)).toBe(false)
    expect(isFilleulDiscountEligible(NaN, false)).toBe(false)
  })

  it('respecte le seuil configure', () => {
    expect(FILLEUL_MIN_ORDER_CENTS).toBe(4000)
  })
})

// ============================================================
// isValidReferralCode
// ============================================================
describe('isValidReferralCode', () => {
  it('accepte un code valide genere par generateReferralCode', () => {
    for (let i = 0; i < 20; i++) {
      const code = generateReferralCode()
      expect(isValidReferralCode(code)).toBe(true)
    }
  })

  it('accepte un code fixe valide', () => {
    expect(isValidReferralCode('BS-ABCDE')).toBe(true)
    expect(isValidReferralCode('BS-23456')).toBe(true)
  })

  it('refuse une chaine vide ou nulle', () => {
    expect(isValidReferralCode('')).toBe(false)
    expect(isValidReferralCode('BS-')).toBe(false)
  })

  it('refuse une mauvaise longueur', () => {
    expect(isValidReferralCode('BS-ABCD')).toBe(false) // 4 chars
    expect(isValidReferralCode('BS-ABCDEF')).toBe(false) // 6 chars
    expect(isValidReferralCode('BS-ABCDE ')).toBe(false) // 5 chars + espace
  })

  it('refuse un mauvais prefixe', () => {
    expect(isValidReferralCode('BX-ABCDE')).toBe(false)
    expect(isValidReferralCode('ABCDE')).toBe(false)
    expect(isValidReferralCode('bs-ABCDE')).toBe(false) // case-sensitive
  })

  it('refuse les caracteres interdits (0/O/1/I/L)', () => {
    expect(isValidReferralCode('BS-0BCDE')).toBe(false)
    expect(isValidReferralCode('BS-OBCDE')).toBe(false)
    expect(isValidReferralCode('BS-1BCDE')).toBe(false)
    expect(isValidReferralCode('BS-IBCDE')).toBe(false)
    expect(isValidReferralCode('BS-LBCDE')).toBe(false)
  })

  it('refuse les lowercase', () => {
    expect(isValidReferralCode('BS-abcde')).toBe(false)
  })

  it('refuse les inputs non-string', () => {
    // @ts-expect-error : on teste explicitement le runtime guard
    expect(isValidReferralCode(null)).toBe(false)
    // @ts-expect-error
    expect(isValidReferralCode(undefined)).toBe(false)
    // @ts-expect-error
    expect(isValidReferralCode(12345)).toBe(false)
  })
})
