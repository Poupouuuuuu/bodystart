'use client'

/**
 * CoachingAuthProvider — Bridge automatique Shopify → Supabase.
 *
 * - Détecte la session Shopify via `useCustomer()` (CustomerContext existant)
 * - Appelle `/api/coaching/auth/shopify-bridge` pour obtenir une session Supabase
 * - Pose la session via `supabase.auth.setSession()` côté browser
 * - Refresh proactif toutes les 50 minutes (TTL 1h, marge sécurité 10min)
 * - Expose { user, isAdmin, hasConsented, isLoading, supabase, refresh }
 *
 * Doit être monté APRÈS `CustomerProvider` dans le tree React.
 *
 * Si le user n'est pas connecté à Shopify → ne fait rien (pas d'erreur).
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react'
import { useCustomer } from '@/context/CustomerContext'
import { createSupabaseBrowserClient } from '@/lib/coaching/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

interface CoachingUser {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  app_role: 'client' | 'admin'
  rgpd_consented: boolean
}

interface CoachingAuthContextType {
  user: CoachingUser | null
  isAdmin: boolean
  hasConsented: boolean
  isLoading: boolean
  /** Client Supabase configuré avec la session JWT du user. */
  supabase: SupabaseClient
  /** Force un refresh du JWT (rappelle le bridge). */
  refresh: () => Promise<void>
}

const CoachingAuthContext = createContext<CoachingAuthContextType | null>(null)

const REFRESH_INTERVAL_MS = 50 * 60 * 1000 // 50 minutes

export function CoachingAuthProvider({ children }: { children: ReactNode }) {
  const { customer, isLoggedIn, isLoading: customerLoading } = useCustomer()
  const [user, setUser] = useState<CoachingUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabaseRef = useRef<SupabaseClient | null>(null)
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Lazy init du client Supabase (un seul par session browser)
  if (!supabaseRef.current) {
    supabaseRef.current = createSupabaseBrowserClient()
  }
  const supabase = supabaseRef.current

  /**
   * Appelle le bridge serveur, récupère access_token + refresh_token,
   * pose la session sur le client Supabase, met à jour l'état React.
   */
  const fetchAndApplySession = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/coaching/auth/shopify-bridge', {
        method: 'POST',
        credentials: 'include', // important : on envoie le cookie Shopify
      })

      if (!res.ok) {
        // 401 = pas de session Shopify → état "non connecté"
        // Autre erreur = log mais ne bloque pas l'app
        if (res.status !== 401) {
          console.warn('[CoachingAuth] Bridge failed:', res.status)
        }
        setUser(null)
        await supabase.auth.signOut().catch(() => {})
        return
      }

      const data = await res.json()
      // Pose la session sur le client Supabase → toutes les requêtes suivantes
      // partiront avec ce JWT, RLS appliquée correctement.
      const { error: setSessionErr } = await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      })

      if (setSessionErr) {
        console.warn('[CoachingAuth] setSession failed:', setSessionErr.message)
        // On continue quand même, l'app peut fonctionner sans la session côté client
        // (les server components passent par leur propre client).
      }

      setUser(data.user)
    } catch (err) {
      console.error('[CoachingAuth] Network error:', err)
      setUser(null)
    }
  }, [supabase])

  // ─── Effet : sync session quand l'état Shopify change ───
  useEffect(() => {
    let cancelled = false

    async function sync() {
      // Tant que CustomerContext charge encore → on attend
      if (customerLoading) return

      setIsLoading(true)

      if (!isLoggedIn || !customer) {
        // Pas connecté Shopify → clean Supabase aussi
        await supabase.auth.signOut().catch(() => {})
        if (!cancelled) {
          setUser(null)
          setIsLoading(false)
        }
        return
      }

      await fetchAndApplySession()
      if (!cancelled) setIsLoading(false)
    }

    sync()

    return () => {
      cancelled = true
    }
  }, [isLoggedIn, customer, customerLoading, fetchAndApplySession, supabase])

  // ─── Effet : refresh proactif toutes les 50 minutes ───
  useEffect(() => {
    if (!user) {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
      return
    }

    refreshTimerRef.current = setInterval(() => {
      fetchAndApplySession()
    }, REFRESH_INTERVAL_MS)

    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current)
        refreshTimerRef.current = null
      }
    }
  }, [user, fetchAndApplySession])

  const value: CoachingAuthContextType = {
    user,
    isAdmin: user?.app_role === 'admin',
    hasConsented: user?.rgpd_consented ?? false,
    isLoading,
    supabase,
    refresh: fetchAndApplySession,
  }

  return (
    <CoachingAuthContext.Provider value={value}>
      {children}
    </CoachingAuthContext.Provider>
  )
}

/**
 * Hook React pour accéder à la session coaching.
 * Doit être appelé depuis un composant descendant de <CoachingAuthProvider>.
 */
export function useCoachingAuth(): CoachingAuthContextType {
  const ctx = useContext(CoachingAuthContext)
  if (!ctx) {
    throw new Error('useCoachingAuth must be used within <CoachingAuthProvider>')
  }
  return ctx
}
