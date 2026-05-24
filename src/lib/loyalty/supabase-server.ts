/**
 * Client Supabase server-side avec session via cookies.
 *
 * Utilisé dans :
 *   - Server Components (pages /staff/*)
 *   - Route Handlers (/api/loyalty/staff/*, /api/loyalty/finalize)
 *   - Middleware (vérification session)
 *
 * Lit/écrit les cookies Supabase auth-token via next/headers (cookies()).
 * La session est posée par Supabase Auth (createBrowserClient.signInWithPassword)
 * côté client, puis le serveur la lit via les cookies à chaque requête.
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function createLoyaltyServerClient() {
  const cookieStore = cookies()
  return createServerClient(
    SUPABASE_URL ?? 'https://placeholder.supabase.co',
    SUPABASE_ANON_KEY ?? 'placeholder',
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          // cookies().set() only works in Server Actions or Route Handlers.
          // Server Components silently fail — pattern recommandé @supabase/ssr.
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            /* no-op : appelé depuis un Server Component read-only */
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            /* no-op */
          }
        },
      },
    }
  )
}
