/**
 * Supabase client — Browser (Client Components, hooks)
 *
 * Utilise @supabase/ssr pour synchroniser la session via cookies (lus côté serveur).
 * La session est alimentée par le bridge auth Shopify→Supabase (cf. /api/coaching/auth/shopify-bridge),
 * via supabase.auth.setSession({ access_token, refresh_token }) après login Shopify.
 *
 * ⚠️ N'expose JAMAIS la service_role key ici — uniquement l'anon key (publique).
 */
import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Ne pas throw au module-load (cf. fix Stripe précédent) — log warning et laisse le runtime gérer
  if (typeof window !== 'undefined') {
    console.warn('[Supabase Browser] NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY manquante.')
  }
}

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    SUPABASE_URL ?? 'https://placeholder.supabase.co',
    SUPABASE_ANON_KEY ?? 'placeholder'
  )
}
