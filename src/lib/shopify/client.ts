import { GraphQLClient } from 'graphql-request'

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN

if (!domain || !storefrontAccessToken) {
  console.warn(
    '[Shopify] Variables d\'environnement manquantes. Copie .env.local.example en .env.local et remplis les valeurs.'
  )
}

export const shopifyClient = new GraphQLClient(
  `https://${domain}/api/2024-04/graphql.json`,
  {
    headers: {
      'X-Shopify-Storefront-Access-Token': storefrontAccessToken ?? '',
      'Content-Type': 'application/json',
    },
  }
)

export async function shopifyFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  try {
    return await shopifyClient.request<T>(query, variables)
  } catch (error) {
    console.error('[Shopify] Erreur API:', error)
    throw error
  }
}
