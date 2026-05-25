import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mocks
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))
vi.mock('@/lib/shopify/customer-server', () => ({
  getCustomer: vi.fn(),
}))
vi.mock('./supabase-admin', () => ({
  getLoyaltyAdminClient: vi.fn(),
}))

import { cookies } from 'next/headers'
import { getCustomer } from '@/lib/shopify/customer-server'
import { getLoyaltyAdminClient } from './supabase-admin'
import { resolveLoyaltyForSession } from './session'

const TOKEN_COOKIE = 'body-start-customer-token'

function mockCookies(value: string | undefined) {
  vi.mocked(cookies).mockReturnValue({
    get: (name: string) => (name === TOKEN_COOKIE && value ? { value } : undefined),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)
}

function mockSupabaseChain(returns: { data: unknown; error: unknown }) {
  const maybeSingle = vi.fn().mockResolvedValue(returns)
  const eq = vi.fn().mockReturnValue({ maybeSingle })
  const select = vi.fn().mockReturnValue({ eq })
  const update = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) })
  const from = vi.fn().mockReturnValue({ select, update })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(getLoyaltyAdminClient).mockReturnValue({ from } as any)
  return { from, select, eq, maybeSingle, update }
}

describe('resolveLoyaltyForSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('logged_out : pas de cookie', async () => {
    mockCookies(undefined)
    const result = await resolveLoyaltyForSession()
    expect(result.state).toBe('logged_out')
  })

  it('logged_out : token Shopify invalide (getCustomer renvoie null)', async () => {
    mockCookies('expired-token')
    vi.mocked(getCustomer).mockResolvedValue(null)
    const result = await resolveLoyaltyForSession()
    expect(result.state).toBe('logged_out')
  })

  it('enrolled : match par shopify_customer_id', async () => {
    mockCookies('valid-token')
    vi.mocked(getCustomer).mockResolvedValue({
      id: 'gid://shopify/Customer/123',
      email: 'a@b.fr',
      firstName: 'Adam',
      lastName: 'L',
      phone: null,
      createdAt: '2026-01-01',
      defaultAddress: null,
      addresses: { nodes: [] },
      orders: { nodes: [] },
    })
    mockSupabaseChain({
      data: {
        id: 'loy-1',
        phone: '+33611111111',
        email: 'a@b.fr',
        first_name: 'Adam',
        shopify_customer_id: 'gid://shopify/Customer/123',
        referral_code: 'BS-XXXX1',
        loyalty_balance_cents: 1500,
        has_first_purchase: true,
        referral_commission_until: '2027-01-01',
      },
      error: null,
    })

    const result = await resolveLoyaltyForSession()
    expect(result.state).toBe('enrolled')
    if (result.state === 'enrolled') {
      expect(result.customer.id).toBe('loy-1')
      expect(result.customer.loyaltyBalanceCents).toBe(1500)
    }
  })

  it('not_enrolled : pas trouve par shopify_id ni par email', async () => {
    mockCookies('valid-token')
    vi.mocked(getCustomer).mockResolvedValue({
      id: 'gid://shopify/Customer/999',
      email: 'new@user.fr',
      firstName: 'Nouvel',
      lastName: '',
      phone: null,
      createdAt: '2026-01-01',
      defaultAddress: null,
      addresses: { nodes: [] },
      orders: { nodes: [] },
    })
    // 2 lookups successifs renvoient null
    const maybeSingle = vi.fn()
      .mockResolvedValueOnce({ data: null, error: null }) // shopify_id
      .mockResolvedValueOnce({ data: null, error: null }) // email
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getLoyaltyAdminClient).mockReturnValue({ from } as any)

    const result = await resolveLoyaltyForSession()
    expect(result.state).toBe('not_enrolled')
    if (result.state === 'not_enrolled') {
      expect(result.shopify.email).toBe('new@user.fr')
    }
  })

  it('enrolled + auto-upgrade : trouve par email sans shopify_customer_id, on update', async () => {
    mockCookies('valid-token')
    vi.mocked(getCustomer).mockResolvedValue({
      id: 'gid://shopify/Customer/555',
      email: 'boutique@client.fr',
      firstName: 'Old',
      lastName: '',
      phone: null,
      createdAt: '2026-01-01',
      defaultAddress: null,
      addresses: { nodes: [] },
      orders: { nodes: [] },
    })
    const updateEq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq: updateEq })
    const maybeSingle = vi.fn()
      .mockResolvedValueOnce({ data: null, error: null }) // shopify_id null
      .mockResolvedValueOnce({
        data: {
          id: 'loy-2',
          phone: '+33622222222',
          email: 'boutique@client.fr',
          first_name: 'Old',
          shopify_customer_id: null,
          referral_code: 'BS-XXXX2',
          loyalty_balance_cents: 500,
          has_first_purchase: false,
          referral_commission_until: null,
        },
        error: null,
      })
    const eq = vi.fn().mockReturnValue({ maybeSingle })
    const select = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ select, update })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.mocked(getLoyaltyAdminClient).mockReturnValue({ from } as any)

    const result = await resolveLoyaltyForSession()
    expect(result.state).toBe('enrolled')
    if (result.state === 'enrolled') {
      expect(result.customer.id).toBe('loy-2')
    }
    expect(update).toHaveBeenCalledWith({ shopify_customer_id: 'gid://shopify/Customer/555' })
  })
})
