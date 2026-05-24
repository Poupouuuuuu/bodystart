/**
 * Client Supabase browser-side (Client Components).
 *
 * Utilise pour :
 *   - Page /staff/login (signInWithPassword)
 *   - Page /staff/caisse (signOut, getSession)
 *
 * Les cookies sont synchronises via @supabase/ssr automatiquement.
 */
'use client'

import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let cached: ReturnType<typeof createBrowserClient> | null = null

export function getLoyaltyBrowserClient() {
  if (cached) return cached
  cached = createBrowserClient(
    SUPABASE_URL ?? 'https://placeholder.supabase.co',
    SUPABASE_ANON_KEY ?? 'placeholder'
  )
  return cached
}
