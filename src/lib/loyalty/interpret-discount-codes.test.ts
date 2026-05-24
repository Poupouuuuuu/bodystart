import { describe, it, expect } from 'vitest'
import { interpretDiscountCodes } from './interpret-discount-codes'

describe('interpretDiscountCodes', () => {
  it('aucun code → résultat vide', () => {
    const r = interpretDiscountCodes({
      discountCodes: [],
      buyerCustomerId: 'buyer-1',
      referralLookups: [],
      redemptionLookups: [],
    })
    expect(r.referredByCodeUsed).toBe(null)
    expect(r.spentLoyaltyCents).toBe(0)
    expect(r.appliedRedemptionId).toBe(null)
    expect(r.diagnostics).toEqual([])
  })

  it('code parrain valide d\'un autre customer → referredByCodeUsed renseigne', () => {
    const r = interpretDiscountCodes({
      discountCodes: ['BS-ABCDE'],
      buyerCustomerId: 'buyer-1',
      referralLookups: [{ code: 'BS-ABCDE', ownerId: 'parrain-1' }],
      redemptionLookups: [],
    })
    expect(r.referredByCodeUsed).toBe('BS-ABCDE')
    expect(r.spentLoyaltyCents).toBe(0)
    expect(r.appliedRedemptionId).toBe(null)
    expect(r.diagnostics).toEqual([])
  })

  it('code redemption valide pour ce customer → spent + appliedId renseignes', () => {
    const r = interpretDiscountCodes({
      discountCodes: ['LY-12345678'],
      buyerCustomerId: 'buyer-1',
      referralLookups: [],
      redemptionLookups: [
        { code: 'LY-12345678', id: 'red-1', amountCents: 2000, status: 'reserved', customerId: 'buyer-1' },
      ],
    })
    expect(r.referredByCodeUsed).toBe(null)
    expect(r.spentLoyaltyCents).toBe(2000)
    expect(r.appliedRedemptionId).toBe('red-1')
  })

  it('code redemption d\'un AUTRE customer → ignoré + diagnostic', () => {
    const r = interpretDiscountCodes({
      discountCodes: ['LY-OTHER123'],
      buyerCustomerId: 'buyer-1',
      referralLookups: [],
      redemptionLookups: [
        { code: 'LY-OTHER123', id: 'red-2', amountCents: 5000, status: 'reserved', customerId: 'OTHER-buyer' },
      ],
    })
    expect(r.spentLoyaltyCents).toBe(0)
    expect(r.appliedRedemptionId).toBe(null)
    expect(r.diagnostics.some((d) => d.includes('autre customer'))).toBe(true)
  })

  it('code redemption avec status != reserved → ignoré + diagnostic', () => {
    const r = interpretDiscountCodes({
      discountCodes: ['LY-EXPIRED1'],
      buyerCustomerId: 'buyer-1',
      referralLookups: [],
      redemptionLookups: [
        { code: 'LY-EXPIRED1', id: 'red-3', amountCents: 3000, status: 'expired', customerId: 'buyer-1' },
      ],
    })
    expect(r.spentLoyaltyCents).toBe(0)
    expect(r.appliedRedemptionId).toBe(null)
    expect(r.diagnostics.some((d) => d.includes('expired'))).toBe(true)
  })

  it('anti auto-parrainage : code parrain qui appartient au buyer → ignoré', () => {
    const r = interpretDiscountCodes({
      discountCodes: ['BS-SAME2'],
      buyerCustomerId: 'buyer-1',
      referralLookups: [{ code: 'BS-SAME2', ownerId: 'buyer-1' }],
      redemptionLookups: [],
    })
    expect(r.referredByCodeUsed).toBe(null)
    expect(r.diagnostics.some((d) => d.includes('Auto-parrainage'))).toBe(true)
  })

  it('code parrain au format valide mais non trouvé en base → ignoré + diagnostic', () => {
    const r = interpretDiscountCodes({
      discountCodes: ['BS-XX2YZ'],
      buyerCustomerId: 'buyer-1',
      referralLookups: [],
      redemptionLookups: [],
    })
    expect(r.referredByCodeUsed).toBe(null)
    expect(r.diagnostics.some((d) => d.includes('non trouve'))).toBe(true)
  })

  it('code totalement inconnu (ni BS- ni redemption) → ignoré + diagnostic', () => {
    const r = interpretDiscountCodes({
      discountCodes: ['BLACKFRIDAY30'],
      buyerCustomerId: 'buyer-1',
      referralLookups: [],
      redemptionLookups: [],
    })
    expect(r.referredByCodeUsed).toBe(null)
    expect(r.spentLoyaltyCents).toBe(0)
    expect(r.diagnostics.some((d) => d.includes('inconnu'))).toBe(true)
  })

  it('combinaison : parrain + redemption simultanés (cas théorique) → les 2 captés', () => {
    const r = interpretDiscountCodes({
      discountCodes: ['BS-PARNT', 'LY-CAGNOT1'],
      buyerCustomerId: 'buyer-1',
      referralLookups: [{ code: 'BS-PARNT', ownerId: 'parrain-1' }],
      redemptionLookups: [
        { code: 'LY-CAGNOT1', id: 'red-X', amountCents: 1500, status: 'reserved', customerId: 'buyer-1' },
      ],
    })
    expect(r.referredByCodeUsed).toBe('BS-PARNT')
    expect(r.spentLoyaltyCents).toBe(1500)
    expect(r.appliedRedemptionId).toBe('red-X')
  })

  it('plusieurs codes parrain (ne devrait pas arriver) → 1er pris, autres ignorés', () => {
    const r = interpretDiscountCodes({
      discountCodes: ['BS-FRST2', 'BS-SCND3'],
      buyerCustomerId: 'buyer-1',
      referralLookups: [
        { code: 'BS-FRST2', ownerId: 'p1' },
        { code: 'BS-SCND3', ownerId: 'p2' },
      ],
      redemptionLookups: [],
    })
    expect(r.referredByCodeUsed).toBe('BS-FRST2')
    expect(r.diagnostics.some((d) => d.includes('deja un autre code applique'))).toBe(true)
  })

  it('plusieurs redemptions (ne devrait pas arriver) → 1ère prise, autres ignorées', () => {
    const r = interpretDiscountCodes({
      discountCodes: ['LY-FIRST123', 'LY-SECON456'],
      buyerCustomerId: 'buyer-1',
      referralLookups: [],
      redemptionLookups: [
        { code: 'LY-FIRST123', id: 'red-A', amountCents: 1000, status: 'reserved', customerId: 'buyer-1' },
        { code: 'LY-SECON456', id: 'red-B', amountCents: 2000, status: 'reserved', customerId: 'buyer-1' },
      ],
    })
    expect(r.spentLoyaltyCents).toBe(1000)
    expect(r.appliedRedemptionId).toBe('red-A')
    expect(r.diagnostics.some((d) => d.includes('deja un autre code applique'))).toBe(true)
  })

  it('codes vides ou whitespace → ignorés silencieusement', () => {
    const r = interpretDiscountCodes({
      discountCodes: ['', '   ', '\t'],
      buyerCustomerId: 'buyer-1',
      referralLookups: [],
      redemptionLookups: [],
    })
    expect(r.referredByCodeUsed).toBe(null)
    expect(r.diagnostics).toEqual([])
  })

  it('trim les codes avant lookup', () => {
    const r = interpretDiscountCodes({
      discountCodes: ['  BS-TRMP2  '],
      buyerCustomerId: 'buyer-1',
      referralLookups: [{ code: 'BS-TRMP2', ownerId: 'p1' }],
      redemptionLookups: [],
    })
    expect(r.referredByCodeUsed).toBe('BS-TRMP2')
  })
})
