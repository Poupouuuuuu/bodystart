'use client'

import { useEffect, useState } from 'react'

/**
 * Indique si le client connecté est admin (gestion ambassadeurs). Confort UI
 * uniquement : l'autorité reste 100 % serveur (chaque route admin re-vérifie).
 */
export function useIsAdmin(): { loading: boolean; isAdmin: boolean } {
  const [state, setState] = useState<{ loading: boolean; isAdmin: boolean }>({ loading: true, isAdmin: false })

  useEffect(() => {
    let cancelled = false
    fetch('/api/loyalty/admin/me', { cache: 'no-store', credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { isAdmin: false }))
      .then((j) => {
        if (!cancelled) setState({ loading: false, isAdmin: !!j.isAdmin })
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, isAdmin: false })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
