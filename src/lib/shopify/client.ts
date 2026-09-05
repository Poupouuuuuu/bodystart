// Client GraphQL Shopify minimal, basé sur `fetch`.
//
// PERF (2026-09-05) : `graphql-request` embarquait le paquet `graphql`
// (analyseur, schéma, polyfills core-js) dans le bundle client — ~17 Ko gzip
// chargés sur TOUTES les pages via CartContext → lib/shopify. Une requête
// Storefront, c'est un POST JSON { query, variables } : pas besoin de plus.
// Même contrat qu'avant : renvoie `data`, lève une Error si HTTP non-OK ou si
// la réponse contient `errors` (comportement de graphql-request conservé).

const domain = process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
const storefrontAccessToken = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN
const adminAccessToken = process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN

if (!domain || !storefrontAccessToken) {
  console.warn(
    "[Shopify] Variables d'environnement manquantes. Copie .env.local.example en .env.local et remplis les valeurs."
  )
}

const STOREFRONT_URL = `https://${domain}/api/2024-04/graphql.json`
const ADMIN_URL = `https://${domain}/admin/api/2024-04/graphql.json`

interface GraphQLResponse<T> {
  data?: T
  errors?: Array<{ message: string; extensions?: Record<string, unknown> }>
}

async function graphqlRequest<T>(
  url: string,
  headers: Record<string, string>,
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
    body: JSON.stringify(variables ? { query, variables } : { query }),
  })

  let payload: GraphQLResponse<T> | null = null
  try {
    payload = (await res.json()) as GraphQLResponse<T>
  } catch {
    payload = null
  }

  if (!res.ok) {
    throw new Error(`Shopify GraphQL HTTP ${res.status}${payload?.errors ? ': ' + payload.errors.map((e) => e.message).join(' | ') : ''}`)
  }
  if (payload?.errors?.length) {
    throw new Error(`Shopify GraphQL: ${payload.errors.map((e) => e.message).join(' | ')}`)
  }
  if (!payload || payload.data === undefined) {
    throw new Error('Shopify GraphQL: réponse sans données')
  }
  return payload.data
}

// ─── Storefront API (client-safe, produits/panier/clients) ───
export async function shopifyFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  try {
    return await graphqlRequest<T>(
      STOREFRONT_URL,
      { 'X-Shopify-Storefront-Access-Token': storefrontAccessToken ?? '' },
      query,
      variables
    )
  } catch (error) {
    console.error('[Shopify] Erreur API:', error)
    throw error
  }
}

// ─── Admin API (server-only, inventory/locations) ────────────
export async function shopifyAdminFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!adminAccessToken || !domain) {
    throw new Error('[Shopify Admin] SHOPIFY_ADMIN_API_ACCESS_TOKEN non configuré.')
  }
  try {
    return await graphqlRequest<T>(ADMIN_URL, { 'X-Shopify-Access-Token': adminAccessToken }, query, variables)
  } catch (error) {
    console.error('[Shopify Admin] Erreur API:', error)
    throw error
  }
}
