/**
 * Tests I/O de redemption.ts (la logique pure validateRedemptionRequest est
 * déjà couverte ailleurs) : sweep lazy + réservation Shopify-d'abord.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { expireOldRedemptions, reserveRedemption, REDEMPTION_TTL_MS } from './redemption'
import { createRedemptionDiscountCode } from '@/lib/shopify/loyalty-discounts'

vi.mock('@/lib/shopify/loyalty-discounts', () => ({
  createRedemptionDiscountCode: vi.fn(),
}))
const mockCreate = vi.mocked(createRedemptionDiscountCode)

/** Chaîne supabase minimale, thenable à chaque maillon. */
function fakeQuery(result: { data?: unknown; error?: { message: string } | null }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q: any = {}
  for (const m of ['update', 'eq', 'lt', 'select', 'insert', 'single']) q[m] = vi.fn(() => q)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  q.then = (res: any, rej: any) =>
    Promise.resolve({ data: result.data ?? null, error: result.error ?? null }).then(res, rej)
  return q
}

function asClient(q: unknown): SupabaseClient {
  return { from: vi.fn(() => q) } as unknown as SupabaseClient
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('expireOldRedemptions', () => {
  it('passe les reserved expirées en expired et retourne le compte', async () => {
    const q = fakeQuery({ data: [{ id: 'r1' }, { id: 'r2' }] })
    const n = await expireOldRedemptions(asClient(q), 'cust-1')
    expect(n).toBe(2)
    expect(q.update).toHaveBeenCalledWith({ status: 'expired' })
    expect(q.eq).toHaveBeenCalledWith('customer_id', 'cust-1')
    expect(q.eq).toHaveBeenCalledWith('status', 'reserved')
    expect(q.lt).toHaveBeenCalledWith('expires_at', expect.any(String))
  })

  it('aucune ligne → 0', async () => {
    expect(await expireOldRedemptions(asClient(fakeQuery({ data: null })), 'cust-1')).toBe(0)
  })

  it('erreur DB → throw', async () => {
    const q = fakeQuery({ error: { message: 'boom' } })
    await expect(expireOldRedemptions(asClient(q), 'cust-1')).rejects.toThrow('[expireOldRedemptions] boom')
  })
})

describe('reserveRedemption', () => {
  const INPUT = {
    customerId: 'cust-1',
    customerHint: '+33612345678',
    amountCents: 2000,
    cartSubtotalCents: 8000,
  }

  it('crée le code Shopify PUIS insère en DB (ordre anti-fuite) et mappe le retour', async () => {
    mockCreate.mockResolvedValue({ shopifyDiscountNodeId: 'gid://d1', discountCode: 'LY-ABCD1234' })
    const q = fakeQuery({
      data: {
        id: 'red-1',
        discount_code: 'LY-ABCD1234',
        shopify_discount_node_id: 'gid://d1',
        amount_cents: 2000,
        expires_at: '2026-06-11T20:00:00Z',
      },
    })
    const client = asClient(q)

    const res = await reserveRedemption(client, INPUT)

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customerHint: '+33612345678',
        amountCents: 2000,
        cartSubtotalCents: 8000,
        expiresAt: expect.any(Date),
      })
    )
    // TTL ≈ 1h
    const expiresAt = mockCreate.mock.calls[0][0].expiresAt as Date
    expect(Math.abs(expiresAt.getTime() - Date.now() - REDEMPTION_TTL_MS)).toBeLessThan(5000)

    expect(q.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        customer_id: 'cust-1',
        amount_cents: 2000,
        discount_code: 'LY-ABCD1234',
        shopify_discount_node_id: 'gid://d1',
        status: 'reserved',
      })
    )
    expect(res).toEqual({
      id: 'red-1',
      discountCode: 'LY-ABCD1234',
      shopifyDiscountNodeId: 'gid://d1',
      amountCents: 2000,
      expiresAt: '2026-06-11T20:00:00Z',
    })
  })

  it('échec Shopify → throw AVANT tout insert DB (aucune fuite)', async () => {
    mockCreate.mockRejectedValue(new Error('shopify down'))
    const q = fakeQuery({ data: null })
    const client = asClient(q)
    await expect(reserveRedemption(client, INPUT)).rejects.toThrow('shopify down')
    expect(q.insert).not.toHaveBeenCalled()
  })

  it('échec DB après Shopify → throw explicite (code orphelin auto-expirant)', async () => {
    mockCreate.mockResolvedValue({ shopifyDiscountNodeId: 'gid://d2', discountCode: 'LY-ZZZZ9999' })
    const q = fakeQuery({ error: { message: 'insert failed' } })
    await expect(reserveRedemption(asClient(q), INPUT)).rejects.toThrow(
      '[reserveRedemption] DB insert failed: insert failed'
    )
  })
})
