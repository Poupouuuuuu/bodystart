import { shopifyFetch } from './client'
import { GET_CUSTOMER, CUSTOMER_UPDATE } from './queries/customer'
import type { Customer } from './customer'

/**
 * Récupère un client Shopify côté serveur via son access token.
 * Utilisable dans les API routes et Server Components (pas de localStorage/document).
 */
export async function getCustomer(accessToken: string): Promise<Customer | null> {
  try {
    const data = await shopifyFetch<{ customer: Customer | null }>(
      GET_CUSTOMER,
      { customerAccessToken: accessToken }
    )
    return data.customer
  } catch {
    return null
  }
}

/**
 * Met à jour le téléphone du profil Shopify côté serveur (best-effort).
 * Utilisé pour synchroniser profil ← cagnotte/parrainage à l'enrôlement.
 * `phoneE164` doit déjà être en E.164 (+33…). Ne throw jamais.
 */
export async function updateCustomerPhoneServer(accessToken: string, phoneE164: string): Promise<void> {
  try {
    await shopifyFetch(CUSTOMER_UPDATE, {
      customerAccessToken: accessToken,
      customer: { phone: phoneE164 },
    })
  } catch (err) {
    console.warn('[updateCustomerPhoneServer] non-blocking failure:', err)
  }
}
