/**
 * Synchronisation Shopify Customer → Supabase profile.
 *
 * Idempotent : si le profil existe déjà (même shopify_customer_id), on update.
 * Sinon, on insère.
 *
 * Détermine le rôle (client | admin) à partir de la liste blanche
 * COACHING_ADMIN_EMAILS (string CSV).
 */
import { getSupabaseAdminClient } from '../supabase/admin'

export interface ShopifyCustomerInput {
  id: string                  // gid://shopify/Customer/...
  email: string
  firstName: string | null
  lastName: string | null
}

export interface SyncedProfile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  role: 'client' | 'admin'
  rgpd_consent_at: string | null
  shopify_customer_id: string
}

function isAdminEmail(email: string): boolean {
  const csv = process.env.COACHING_ADMIN_EMAILS ?? ''
  const list = csv
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  return list.includes(email.toLowerCase())
}

export async function syncShopifyCustomerToSupabase(
  shopify: ShopifyCustomerInput
): Promise<SyncedProfile> {
  const admin = getSupabaseAdminClient()
  const role: 'client' | 'admin' = isAdminEmail(shopify.email) ? 'admin' : 'client'

  // 1. Tenter un select existant (par shopify_customer_id, lien fort)
  const { data: existing, error: selectErr } = await admin
    .from('profiles')
    .select('id, email, first_name, last_name, role, rgpd_consent_at, shopify_customer_id, deleted_at')
    .eq('shopify_customer_id', shopify.id)
    .maybeSingle()

  if (selectErr) {
    throw new Error(`[sync-profile] Erreur select: ${selectErr.message}`)
  }

  // 2. Si existe et soft-deleted → refuser (conformité RGPD post-anonymisation)
  if (existing?.deleted_at) {
    throw new Error('[sync-profile] Ce profil a été supprimé. Contactez le support.')
  }

  // 3. Si existe → update minimal (email peut changer côté Shopify, role aussi si admin liste évolue)
  if (existing) {
    const needsUpdate =
      existing.email !== shopify.email ||
      existing.first_name !== (shopify.firstName ?? null) ||
      existing.last_name !== (shopify.lastName ?? null) ||
      existing.role !== role

    if (needsUpdate) {
      const { data: updated, error: updateErr } = await admin
        .from('profiles')
        .update({
          email: shopify.email,
          first_name: shopify.firstName,
          last_name: shopify.lastName,
          role, // ré-évalue à chaque login → permet de promouvoir/rétrograder via env var
        })
        .eq('id', existing.id)
        .select('id, email, first_name, last_name, role, rgpd_consent_at, shopify_customer_id')
        .single()

      if (updateErr || !updated) {
        throw new Error(`[sync-profile] Erreur update: ${updateErr?.message}`)
      }
      return updated as SyncedProfile
    }

    return existing as SyncedProfile
  }

  // 4. Sinon → insert
  const { data: inserted, error: insertErr } = await admin
    .from('profiles')
    .insert({
      shopify_customer_id: shopify.id,
      email: shopify.email,
      first_name: shopify.firstName,
      last_name: shopify.lastName,
      role,
    })
    .select('id, email, first_name, last_name, role, rgpd_consent_at, shopify_customer_id')
    .single()

  if (insertErr || !inserted) {
    throw new Error(`[sync-profile] Erreur insert: ${insertErr?.message}`)
  }

  return inserted as SyncedProfile
}
