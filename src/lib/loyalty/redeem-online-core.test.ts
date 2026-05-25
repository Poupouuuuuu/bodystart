import { describe, it, expect, vi, beforeEach } from 'vitest'
import { executeRedeem } from './redeem-online-core'

// Mock des helpers I/O
vi.mock('./redemption', () => ({
  expireOldRedemptions: vi.fn().mockResolvedValue(0),
  validateRedemptionRequest: vi.fn(),
  reserveRedemption: vi.fn(),
}))

import {
  expireOldRedemptions,
  validateRedemptionRequest,
  reserveRedemption,
} from './redemption'

describe('executeRedeem', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockSupabase: any = {}

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('happy path : validation OK + reserve OK', async () => {
    vi.mocked(validateRedemptionRequest).mockReturnValue({
      ok: true,
      appliedCents: 2000,
    })
    vi.mocked(reserveRedemption).mockResolvedValue({
      id: 'red-1',
      discountCode: 'BS-CAGNOTTE-XYZ12',
      shopifyDiscountNodeId: 'gid://shopify/DiscountAutomaticNode/1',
      amountCents: 2000,
      expiresAt: '2026-05-24T15:30:00Z',
    })

    const result = await executeRedeem({
      supabase: mockSupabase,
      customer: { id: 'c1', phone: '+33611111111', loyaltyBalanceCents: 5000 },
      cartSubtotalCents: 10000,
      requestedAmountCents: 2000,
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.redemption.discountCode).toBe('BS-CAGNOTTE-XYZ12')
      expect(result.redemption.amountCents).toBe(2000)
    }
    expect(expireOldRedemptions).toHaveBeenCalledWith(mockSupabase, 'c1')
  })

  it('validation KO : retourne {ok:false, kind:validation}', async () => {
    vi.mocked(validateRedemptionRequest).mockReturnValue({
      ok: false,
      reason: 'above_cap',
      maxAllowedCents: 3000,
    })

    const result = await executeRedeem({
      supabase: mockSupabase,
      customer: { id: 'c1', phone: '+33611111111', loyaltyBalanceCents: 5000 },
      cartSubtotalCents: 6000,
      requestedAmountCents: 9999,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.kind).toBe('validation')
      if (result.kind === 'validation') {
        expect(result.reason).toBe('above_cap')
        expect(result.maxAllowedCents).toBe(3000)
      }
    }
    expect(reserveRedemption).not.toHaveBeenCalled()
  })

  it('reserve throw : retourne {ok:false, kind:reserve}', async () => {
    vi.mocked(validateRedemptionRequest).mockReturnValue({
      ok: true,
      appliedCents: 2000,
    })
    vi.mocked(reserveRedemption).mockRejectedValue(new Error('Shopify API down'))

    const result = await executeRedeem({
      supabase: mockSupabase,
      customer: { id: 'c1', phone: '+33611111111', loyaltyBalanceCents: 5000 },
      cartSubtotalCents: 10000,
      requestedAmountCents: 2000,
    })

    expect(result.ok).toBe(false)
    if (!result.ok && result.kind === 'reserve') {
      expect(result.detail).toContain('Shopify API down')
    }
  })

  it('expireOldRedemptions throw : non-bloquant, on continue', async () => {
    vi.mocked(expireOldRedemptions).mockRejectedValue(new Error('DB hiccup'))
    vi.mocked(validateRedemptionRequest).mockReturnValue({
      ok: true,
      appliedCents: 2000,
    })
    vi.mocked(reserveRedemption).mockResolvedValue({
      id: 'red-1',
      discountCode: 'BS-CAGNOTTE-XYZ12',
      shopifyDiscountNodeId: 'gid://shopify/DiscountAutomaticNode/1',
      amountCents: 2000,
      expiresAt: '2026-05-24T15:30:00Z',
    })

    const result = await executeRedeem({
      supabase: mockSupabase,
      customer: { id: 'c1', phone: '+33611111111', loyaltyBalanceCents: 5000 },
      cartSubtotalCents: 10000,
      requestedAmountCents: 2000,
    })

    expect(result.ok).toBe(true)
  })
})
