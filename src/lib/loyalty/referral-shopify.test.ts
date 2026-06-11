/**
 * Tests de ensureReferralCodeShopify (création best-effort + idempotente du
 * code de réduction parrain dans Shopify — partagé caisse / enroll en ligne).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ensureReferralCodeShopify } from './referral-shopify'
import { createReferralDiscountCode } from '@/lib/shopify/loyalty-discounts'

vi.mock('@/lib/shopify/loyalty-discounts', () => ({
  createReferralDiscountCode: vi.fn(),
}))
const mockCreate = vi.mocked(createReferralDiscountCode)

/** Chaîne supabase minimale, thenable à chaque maillon. */
function fakeQuery(result: { data?: unknown; error?: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q: any = {}
  for (const m of ['select', 'update', 'eq', 'maybeSingle']) q[m] = vi.fn(() => q)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  q.then = (res: any, rej: any) =>
    Promise.resolve({ data: result.data ?? null, error: result.error ?? null }).then(res, rej)
  return q
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('ensureReferralCodeShopify', () => {
  it('skip si le customer a déjà un code Shopify (idempotence)', async () => {
    const selectQ = fakeQuery({ data: { shopify_referral_discount_id: 'gid://existing' } })
    const from = vi.fn(() => selectQ)
    await ensureReferralCodeShopify({ from }, 'cust-1', 'BS-AAAAA', 'a@b.fr')
    expect(mockCreate).not.toHaveBeenCalled()
    expect(from).toHaveBeenCalledTimes(1) // pas d'update
  })

  it('crée le code et persiste le gid quand absent', async () => {
    mockCreate.mockResolvedValue('gid://new-discount')
    const selectQ = fakeQuery({ data: { shopify_referral_discount_id: null } })
    const updateQ = fakeQuery({ data: null })
    const from = vi.fn().mockReturnValueOnce(selectQ).mockReturnValueOnce(updateQ)

    await ensureReferralCodeShopify({ from }, 'cust-2', 'BS-BBBBB', 'b@b.fr')

    expect(mockCreate).toHaveBeenCalledWith({ referralCode: 'BS-BBBBB', parrainEmail: 'b@b.fr' })
    expect(updateQ.update).toHaveBeenCalledWith(
      expect.objectContaining({
        shopify_referral_discount_id: 'gid://new-discount',
        shopify_referral_discount_last_error: null,
      })
    )
    expect(updateQ.eq).toHaveBeenCalledWith('id', 'cust-2')
  })

  it('échec Shopify → persiste l’erreur, NE THROW PAS (best-effort)', async () => {
    mockCreate.mockRejectedValue(new Error('Shopify is down'))
    const selectQ = fakeQuery({ data: null })
    const updateQ = fakeQuery({ data: null })
    const from = vi.fn().mockReturnValueOnce(selectQ).mockReturnValueOnce(updateQ)

    await expect(
      ensureReferralCodeShopify({ from }, 'cust-3', 'BS-CCCCC', null)
    ).resolves.toBeUndefined()

    expect(updateQ.update).toHaveBeenCalledWith(
      expect.objectContaining({
        shopify_referral_discount_last_error: 'Shopify is down',
      })
    )
  })

  it('échec Shopify PUIS échec DB de persistance → toujours pas de throw', async () => {
    mockCreate.mockRejectedValue(new Error('boom'))
    const selectQ = fakeQuery({ data: null })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateQ: any = fakeQuery({ data: null })
    updateQ.then = (_res: unknown, rej: (e: Error) => void) => Promise.reject(new Error('db down')).catch(rej)
    const from = vi.fn().mockReturnValueOnce(selectQ).mockReturnValueOnce(updateQ)

    await expect(
      ensureReferralCodeShopify({ from }, 'cust-4', 'BS-DDDDD', null)
    ).resolves.toBeUndefined()
  })
})
