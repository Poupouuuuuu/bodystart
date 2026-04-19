/**
 * Supabase client — Admin (service_role)
 *
 * ⚠️ DANGER : ce client BYPASS la RLS. À utiliser UNIQUEMENT dans :
 *   - les Route Handlers (/api/*)
 *   - les Server Actions / fonctions appelées côté serveur
 *   - les webhooks (Stripe, etc.)
 *
 * NE JAMAIS importer ce module depuis un Client Component ou un fichier
 * exposé au browser, sous peine de fuite de la service_role key.
 *
 * Cas d'usage typiques :
 *   - Upsert d'un profile à la connexion Shopify (le user n'a pas encore de session JWT)
 *   - Webhooks Stripe (pas d'auth user contexte)
 *   - Appel forcé de fonctions RGPD (export, anonymisation déclenchée par un admin sur un autre user)
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

let cached: SupabaseClient | null = null

export function getSupabaseAdminClient(): SupabaseClient {
  if (cached) return cached

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      '[Supabase Admin] NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY manquante. ' +
        'Ce client ne peut pas être utilisé sans configuration complète.'
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
