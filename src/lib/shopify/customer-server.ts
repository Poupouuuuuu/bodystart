import { shopifyFetch } from './client'
import { GET_CUSTOMER } from './queries/customer'
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
