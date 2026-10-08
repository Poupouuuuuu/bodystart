'use client'

import { useEffect, useState, useCallback } from 'react'

export type LoyaltyMeState =
  | { kind: 'loading' }
  | { kind: 'error'; error: string }
  | { kind: 'logged_out' }
  | { kind: 'not_enrolled'; shopify: { email: string; firstName: string } }
  | {
      kind: 'enrolled'
      customer: {
        id: string
        firstName: string
        referralCode: string
        loyaltyBalanceCents: number
        hasFirstPurchase: boolean
        referralCommissionUntil: string | null
      }
      recentTransactions: Array<{
        id: string
        type: 'referral_commission' | 'spend' | 'adjustment' | 'import_credit'
        amountCents: number
        balanceAfterCents: number
        channel: 'in_store' | 'online'
        shopifyOrderId: string | null
        relatedCustomerFirstName: string | null
        createdAt: string
      }>
      totals: { earnedCents: number; spentCents: number }
      referral: { filleulsCount: number; earnedNetCents: number }
    }

interface UseLoyaltyMeReturn {
  state: LoyaltyMeState
  refresh: () => void
}

/**
 * `auth` (facultatif) : état de connexion déjà connu de l'appelant. Invité →
 * « logged_out » sans requête (avant le 08/10/2026, chaque ouverture du panier
 * d'un invité produisait une 401 dans la console) ; « pending » → on attend.
 */
export function useLoyaltyMe(
  { auth }: { auth?: 'pending' | 'logged_in' | 'logged_out' } = {}
): UseLoyaltyMeReturn {
  const [state, setState] = useState<LoyaltyMeState>({ kind: 'loading' })
  const [refreshKey, setRefreshKey] = useState(0)

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  useEffect(() => {
    if (auth === 'pending') {
      setState({ kind: 'loading' })
      return
    }
    if (auth === 'logged_out') {
      setState({ kind: 'logged_out' })
      return
    }
    let cancelled = false
    setState({ kind: 'loading' })

    fetch('/api/loyalty/me', { cache: 'no-store', credentials: 'include' })
      .then(async (res) => {
        if (cancelled) return
        if (res.status === 401) {
          setState({ kind: 'logged_out' })
          return
        }
        const json = await res.json()
        if (!res.ok) {
          setState({ kind: 'error', error: json?.error ?? 'fetch_failed' })
          return
        }
        if (json.state === 'not_enrolled') {
          setState({ kind: 'not_enrolled', shopify: json.shopify })
        } else if (json.state === 'enrolled') {
          setState({
            kind: 'enrolled',
            customer: json.customer,
            recentTransactions: json.recentTransactions,
            totals: json.totals,
            referral: json.referral ?? { filleulsCount: 0, earnedNetCents: 0 },
          })
        } else {
          setState({ kind: 'error', error: 'unknown_state' })
        }
      })
      .catch((err) => {
        if (cancelled) return
        setState({ kind: 'error', error: err instanceof Error ? err.message : 'network' })
      })

    return () => {
      cancelled = true
    }
  }, [refreshKey, auth])

  return { state, refresh }
}
