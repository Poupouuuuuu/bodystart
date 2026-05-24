/**
 * Supabase client — Admin (service_role).
 *
 * ⚠️ DANGER : ce client BYPASS la RLS. À utiliser UNIQUEMENT cote serveur,
 * dans les Route Handlers (/api/loyalty/*), les Server Actions, et les
 * appels RPC vers finalize_order_loyalty().
 *
 * NE JAMAIS importer depuis un Client Component ou un fichier exposé au browser.
 *
 * Pattern : lazy + cached. La cle service_role n'est lue qu'au 1er appel
 * et stockee en singleton process. Si la var d'env manque, on throw a
 * l'appel (pas au module-load, pour ne pas casser le build Vercel).
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

let cached: SupabaseClient | null = null

export function getLoyaltyAdminClient(): SupabaseClient {
  if (cached) return cached

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      '[Loyalty Supabase Admin] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquante. ' +
        'Verifie .env.local + les variables Vercel.'
    )
  }

  cached = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  })

  return cached
}
