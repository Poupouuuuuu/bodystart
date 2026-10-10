// Redirections des fiches retirées, tenues par Claude Gestion dans le
// métachamp boutique `bodystart.redirections_produits` (json, lecture
// Storefront) : { "ancien-handle": "/chemin/de/destination" }. Serveur
// uniquement. Complète la table en dur du middleware (RETIRED_PRODUCTS), qui
// reste prioritaire et sert les plus anciennes.
//
// Règle (10/10/2026) : arrêt définitif = redirection vers le remplaçant ou la
// catégorie ; rupture temporaire = la fiche reste en ligne.

import { unstable_cache } from 'next/cache'
import { shopifyFetch } from './client'

const GET_PRODUCT_REDIRECTS = /* GraphQL */ `
  query ProductRedirects {
    shop {
      metafield(namespace: "bodystart", key: "redirections_produits") { value }
    }
  }
`

/** Handle Shopify : minuscules, chiffres, tirets. */
const HANDLE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
/** Destination interne seulement : « /x… », jamais « //hôte » ni une URL complète. */
const DESTINATION = /^\/(?!\/)[A-Za-z0-9\-._~/?=&%]*$/

/**
 * Table lue dans le métachamp, entrées invalides écartées (une faute de
 * frappe ne doit ni casser la page ni ouvrir une redirection vers un autre site).
 */
export function parseProductRedirects(value: string | null | undefined): Record<string, string> {
  if (!value) return {}
  let raw: unknown
  try {
    raw = JSON.parse(value)
  } catch {
    return {}
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  const out: Record<string, string> = {}
  for (const [handle, to] of Object.entries(raw as Record<string, unknown>)) {
    const key = handle.trim().toLowerCase()
    if (!HANDLE.test(key) || typeof to !== 'string') continue
    const dest = to.trim()
    if (!DESTINATION.test(dest) || dest === `/products/${key}`) continue
    out[key] = dest
  }
  return out
}

// Cache d'une heure au plus : une ligne ajoutée par Claude Gestion est
// suivie dans l'heure, sans redéploiement. En échec : table vide (vrai 404),
// non mise en cache puisque la fonction lève.
const loadProductRedirects = unstable_cache(
  async () => {
    const data = await shopifyFetch<{ shop: { metafield: { value: string } | null } }>(GET_PRODUCT_REDIRECTS)
    return parseProductRedirects(data.shop.metafield?.value)
  },
  ['redirections-produits'],
  { revalidate: 3600 }
)

/** Destination d'une fiche retirée, ou null (la fiche répond alors 404). */
export async function getProductRedirect(handle: string): Promise<string | null> {
  try {
    return (await loadProductRedirects())[handle.toLowerCase()] ?? null
  } catch (err) {
    console.error('[product-redirects] lecture du métachamp en échec :', err)
    return null
  }
}
