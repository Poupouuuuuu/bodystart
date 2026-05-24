import { describe, it, expect, vi } from 'vitest'
import { finalizeOrderLoyalty } from './finalize'

interface RpcResponse {
  data: Record<string, unknown> | null
  error: { message: string } | null
}

function mockSupabaseRpc(response: RpcResponse) {
  const rpc = vi.fn().mockResolvedValue(response)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { rpc } as any
}

describe('finalizeOrderLoyalty (wrapper)', () => {
  it('appelle supabase.rpc avec les bons parametres snake_case', async () => {
    const supabase = mockSupabaseRpc({
      data: {
        customer_id: 'cust-1',
        order_ref: 'order-123',
        channel: 'online',
        spent_cents: 0,
        commission_to_referrer_cents: 250,
        referrer_id: 'parrain-1',
        is_first_purchase: false,
        new_balance_cents: 1000,
        first_purchase_at: '2026-01-01T00:00:00Z',
        referral_commission_until: '2027-01-01T00:00:00Z',
        idempotent_skip: false,
      },
      error: null,
    })

    const result = await finalizeOrderLoyalty(supabase, {
      customerId: 'cust-1',
      orderRef: 'order-123',
      paidItemsCents: 5000,
      spentLoyaltyCents: 0,
      channel: 'online',
    })

    expect(supabase.rpc).toHaveBeenCalledWith('finalize_order_loyalty', {
      p_customer_id: 'cust-1',
      p_order_ref: 'order-123',
      p_paid_items_cents: 5000,
      p_spent_loyalty_cents: 0,
      p_referred_by_code_used: null,
      p_channel: 'online',
      p_staff_user_id: null,
    })

    expect(result.customerId).toBe('cust-1')
    expect(result.commissionToReferrerCents).toBe(250)
    expect(result.referrerId).toBe('parrain-1')
    expect(result.idempotentSkip).toBe(false)
  })

  it('passe les optionnels (referredByCodeUsed, staffUserId)', async () => {
    const supabase = mockSupabaseRpc({
      data: {
        customer_id: 'cust-2',
        order_ref: 'caisse-001',
        channel: 'in_store',
        spent_cents: 500,
        commission_to_referrer_cents: 0,
        referrer_id: null,
        is_first_purchase: true,
        new_balance_cents: 0,
        first_purchase_at: '2026-05-23T00:00:00Z',
        referral_commission_until: '2027-05-23T00:00:00Z',
        idempotent_skip: false,
      },
      error: null,
    })

    await finalizeOrderLoyalty(supabase, {
      customerId: 'cust-2',
      orderRef: 'caisse-001',
      paidItemsCents: 5000,
      spentLoyaltyCents: 500,
      referredByCodeUsed: 'BS-ABCDE',
      channel: 'in_store',
      staffUserId: 'staff-uuid-1',
    })

    expect(supabase.rpc).toHaveBeenCalledWith('finalize_order_loyalty', {
      p_customer_id: 'cust-2',
      p_order_ref: 'caisse-001',
      p_paid_items_cents: 5000,
      p_spent_loyalty_cents: 500,
      p_referred_by_code_used: 'BS-ABCDE',
      p_channel: 'in_store',
      p_staff_user_id: 'staff-uuid-1',
    })
  })

  it('parse correctement une reponse idempotent_skip', async () => {
    const supabase = mockSupabaseRpc({
      data: { idempotent_skip: true, order_ref: 'order-X', customer_id: 'cust-X' },
      error: null,
    })
    const result = await finalizeOrderLoyalty(supabase, {
      customerId: 'cust-X',
      orderRef: 'order-X',
      paidItemsCents: 1000,
      channel: 'online',
    })
    expect(result.idempotentSkip).toBe(true)
    expect(result.orderRef).toBe('order-X')
  })

  it('throw si rpc retourne une erreur (ex: insufficient_balance)', async () => {
    const supabase = mockSupabaseRpc({
      data: null,
      error: { message: 'insufficient_balance: balance=500 requested=1000' },
    })

    await expect(
      finalizeOrderLoyalty(supabase, {
        customerId: 'cust-3',
        orderRef: null,
        paidItemsCents: 0,
        spentLoyaltyCents: 1000,
        channel: 'in_store',
      })
    ).rejects.toThrow(/insufficient_balance/)
  })

  it('throw si reponse vide', async () => {
    const supabase = mockSupabaseRpc({ data: null, error: null })
    await expect(
      finalizeOrderLoyalty(supabase, {
        customerId: 'cust-4',
        orderRef: null,
        paidItemsCents: 100,
        channel: 'in_store',
      })
    ).rejects.toThrow(/Empty or invalid/)
  })

  it('utilise spentLoyaltyCents=0 par defaut si non fourni', async () => {
    const supabase = mockSupabaseRpc({
      data: {
        customer_id: 'c',
        order_ref: null,
        channel: 'in_store',
        spent_cents: 0,
        commission_to_referrer_cents: 0,
        referrer_id: null,
        is_first_purchase: false,
        new_balance_cents: 0,
        first_purchase_at: null,
        referral_commission_until: null,
        idempotent_skip: false,
      },
      error: null,
    })
    await finalizeOrderLoyalty(supabase, {
      customerId: 'c',
      orderRef: null,
      paidItemsCents: 0,
      channel: 'in_store',
    })
    expect(supabase.rpc).toHaveBeenCalledWith(
      'finalize_order_loyalty',
      expect.objectContaining({ p_spent_loyalty_cents: 0 })
    )
  })
})
