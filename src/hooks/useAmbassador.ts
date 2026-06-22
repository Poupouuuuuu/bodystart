'use client'

import { useEffect, useState } from 'react'

export interface AmbassadorTx {
  id: string
  type: 'commission' | 'revoke' | 'spend' | 'adjustment'
  amountCents: number
  balanceAfterCents: number
  shopifyOrderId: string | null
  notes: string | null
  createdAt: string
}

export interface AmbassadorData {
  ambassador: {
    name: string
    code: string
    ratePct: number
    active: boolean
    balanceCents: number
    usableCents: number
    expired: boolean
    minToUseCents: number
    lastActivityAt: string
  }
  stats: { ordersCount: number; revenueCents: number; newCustomers: number; newCustomerRate: number }
  transactions: AmbassadorTx[]
}

export type AmbassadorState =
  | { kind: 'loading' }
  | { kind: 'not_ambassador' } // inclut logged_out / erreur : l'onglet reste simplement caché
  | { kind: 'ambassador'; data: AmbassadorData }

/** Charge le dashboard ambassadeur. État non-ambassadeur silencieux (onglet masqué). */
export function useAmbassador(): AmbassadorState {
  const [state, setState] = useState<AmbassadorState>({ kind: 'loading' })

  useEffect(() => {
    let cancelled = false
    fetch('/api/loyalty/me/ambassador', { cache: 'no-store', credentials: 'include' })
      .then(async (res) => {
        if (cancelled) return
        if (!res.ok) {
          setState({ kind: 'not_ambassador' })
          return
        }
        const json = await res.json()
        if (json.isAmbassador) {
          setState({ kind: 'ambassador', data: json })
        } else {
          setState({ kind: 'not_ambassador' })
        }
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'not_ambassador' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
