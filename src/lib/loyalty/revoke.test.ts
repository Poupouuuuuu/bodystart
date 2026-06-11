/**
 * Tests du wrapper revoke_referral_reward (flux d'argent : remboursement
 * total d'une commande filleul → débit cagnotte parrain).
 */
import { describe, it, expect, vi } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { revokeReferralReward } from './revoke'

function fakeSupabase(rpcResult: { data?: unknown; error?: { message: string } | null }) {
  const rpc = vi.fn().mockResolvedValue({ data: rpcResult.data ?? null, error: rpcResult.error ?? null })
  return { client: { rpc } as unknown as SupabaseClient, rpc }
}

describe('revokeReferralReward', () => {
  it('appelle la RPC avec le bon nom et le bon paramètre', async () => {
    const { client, rpc } = fakeSupabase({ data: { revoked: false, reason: 'no_reward' } })
    await revokeReferralReward(client, 'gid-123')
    expect(rpc).toHaveBeenCalledWith('revoke_referral_reward', { p_shopify_order_id: 'gid-123' })
  })

  it('mappe le résultat snake_case → camelCase (révocation réussie)', async () => {
    const { client } = fakeSupabase({
      data: {
        revoked: true,
        order_ref: 'gid-456',
        debited_cents: 500,
        parrain_id: 'uuid-parrain',
        parrain_new_balance_cents: 1500,
      },
    })
    const res = await revokeReferralReward(client, 'gid-456')
    expect(res).toEqual({
      revoked: true,
      reason: undefined,
      orderRef: 'gid-456',
      debitedCents: 500,
      parrainId: 'uuid-parrain',
      parrainNewBalanceCents: 1500,
    })
  })

  it('idempotent : already_revoked remonte revoked=false + reason', async () => {
    const { client } = fakeSupabase({
      data: { revoked: false, reason: 'already_revoked', order_ref: 'gid-789' },
    })
    const res = await revokeReferralReward(client, 'gid-789')
    expect(res.revoked).toBe(false)
    expect(res.reason).toBe('already_revoked')
    expect(res.debitedCents).toBeUndefined()
  })

  it('data null → defaults sûrs (orderRef = id passé, revoked false)', async () => {
    const { client } = fakeSupabase({ data: null })
    const res = await revokeReferralReward(client, 'gid-000')
    expect(res.revoked).toBe(false)
    expect(res.orderRef).toBe('gid-000')
    expect(res.parrainId).toBeNull()
  })

  it('erreur RPC → throw avec le message', async () => {
    const { client } = fakeSupabase({ error: { message: 'connection lost' } })
    await expect(revokeReferralReward(client, 'gid-err')).rejects.toThrow(
      '[revokeReferralReward] RPC error: connection lost'
    )
  })
})
