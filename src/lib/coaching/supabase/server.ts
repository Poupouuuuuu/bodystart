/**
 * Supabase client — Server (Server Components, Route Handlers, Server Actions)
 *
 * Lit/écrit la session via les cookies Next.js (gérés par @supabase/ssr).
 * La session est posée par le bridge auth Shopify→Supabase, puis transportée
 * automatiquement entre le browser et le serveur via les cookies.
 *
 * Utilise l'anon key + la JWT signée du user → RLS appliquée correctement.
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function createSupabaseServerClient() {
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
          // Try/catch nécessaire : `cookies().set()` ne marche que dans Server Actions
          // ou Route Handlers, pas dans les Server Components purs.
          // En cas d'erreur on no-op (la session sera relue au prochain render).
          try {
            cookieStore.set({ name, value, ...options })
          } catch {
            // No-op — appelé depuis un Server Component read-only
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch {
            // No-op
          }
        },
      },
    }
  )
}
