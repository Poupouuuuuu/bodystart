/**
 * POST /api/coaching/auth/shopify-bridge
 *
 * Pont Shopify Customer Auth → Supabase (JWT custom).
 *
 * Flow :
 *   1. Lire le cookie `body-start-customer-token` (token Shopify Storefront customer)
 *   2. Valider le token via Shopify API : `getCustomer(token)` retourne customer ou null
 *   3. Upsert dans `profiles` (Supabase) — détermine role admin via COACHING_ADMIN_EMAILS
 *   4. Signer un JWT compatible Supabase (HS256 + SUPABASE_JWT_SECRET)
 *   5. Renvoyer { access_token, refresh_token, user } au format attendu par
 *      `supabase.auth.setSession()`
 *
 * Sécurité :
 *   - Service role utilisé UNIQUEMENT côté serveur (jamais de client component)
 *   - Token Shopify validé en amont — si invalide, 401
 *   - Pas de PII renvoyée au browser hormis email + id
 *
 * Refresh :
 *   - Le client peut rappeler ce endpoint à tout moment pour renouveler
 *   - Tant que le cookie Shopify est valide, on ré-émet un access_token
 */
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCustomer } from '@/lib/shopify/customer-server'
import { syncShopifyCustomerToSupabase } from '@/lib/coaching/auth/sync-profile'
import {
  signAccessToken,
  signRefreshToken,
  ACCESS_TOKEN_TTL_SECONDS,
} from '@/lib/coaching/auth/jwt'

export const dynamic = 'force-dynamic'

const SHOPIFY_TOKEN_COOKIE = 'body-start-customer-token'

export async function POST() {
  try {
    // ─── 1. Récupérer le token Shopify côté serveur ───
    const cookieStore = cookies()
    const shopifyToken = cookieStore.get(SHOPIFY_TOKEN_COOKIE)?.value

    if (!shopifyToken) {
      return NextResponse.json(
        { error: 'No Shopify session cookie found.' },
        { status: 401 }
      )
    }

    // ─── 2. Valider le token via Shopify Storefront API ───
    const shopifyCustomer = await getCustomer(shopifyToken)

    if (!shopifyCustomer) {
      return NextResponse.json(
        { error: 'Invalid or expired Shopify session.' },
        { status: 401 }
      )
    }

    // ─── 3. Upsert profile Supabase ───
    const profile = await syncShopifyCustomerToSupabase({
      id: shopifyCustomer.id,
      email: shopifyCustomer.email,
      firstName: shopifyCustomer.firstName ?? null,
      lastName: shopifyCustomer.lastName ?? null,
    })

    // ─── 4. Signer les JWT ───
    const accessToken = await signAccessToken({
      sub: profile.id,
      email: profile.email,
      role: 'authenticated',
      aud: 'authenticated',
      app_role: profile.role,
    })

    const refreshToken = await signRefreshToken({
      sub: profile.id,
      email: profile.email,
    })

    // ─── 5. Réponse format Supabase setSession ───
    return NextResponse.json({
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: ACCESS_TOKEN_TTL_SECONDS,
      token_type: 'bearer',
      user: {
        id: profile.id,
        email: profile.email,
        first_name: profile.first_name,
        last_name: profile.last_name,
        app_role: profile.role,
        rgpd_consented: profile.rgpd_consent_at !== null,
      },
    })
  } catch (err) {
    console.error('[shopify-bridge] Error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Bridge auth failed.', detail: message },
      { status: 500 }
    )
  }
}
