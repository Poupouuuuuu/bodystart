// Mode saison, côté serveur : metafield boutique `bodystart.saison` (Storefront),
// relu toutes les 15 minutes au plus (règle de Claude Gestion du 19/10/2026).
// La période active est recalculée dans le navigateur à l'heure pile
// (components/layout/Header), le cache ne retarde donc pas les bascules.

import { unstable_cache } from 'next/cache'
import { cookies } from 'next/headers'
import { periodesAnnonce } from '@/lib/fermetures'
import { COOKIE_APERCU_SAISON, lireApercu, lireSaison, type ApercuSaison, type PeriodeSaison } from '@/lib/saison'
import { shopifyFetch } from './client'

const GET_SAISON = `query Saison { shop { metafield(namespace: "bodystart", key: "saison") { value } } }`

/** Une erreur n'est pas mise en cache (elle remonte) : la saison revient au prochain essai. */
const saisonEnCache = unstable_cache(
  async (): Promise<PeriodeSaison[]> => {
    const data = await shopifyFetch<{ shop: { metafield: { value: string } | null } }>(GET_SAISON)
    return lireSaison(data.shop.metafield?.value ?? null)
  },
  ['saison-v1'],
  { revalidate: 900 }
)

/**
 * Périodes du mode saison (metafield) et bandeaux des fermetures
 * exceptionnelles (lib/fermetures, prioritaires). Sans Shopify : les
 * fermetures seules.
 */
export async function getSaison(): Promise<PeriodeSaison[]> {
  const annonces = periodesAnnonce()
  try {
    return [...annonces, ...(await saisonEnCache())].sort((a, b) => a.du.localeCompare(b.du))
  } catch {
    return annonces
  }
}

/**
 * Thème forcé sur la preview (`?saison=black-week`, cookie posé par le
 * header) : vérifier une saison avant ses dates. En production, les cookies ne
 * sont jamais lus : les pages restent en ISR. Hors production, les lire rend
 * la page dynamique (sans conséquence sur une preview). Pas de try/catch :
 * Next signale ainsi le rendu dynamique.
 */
export async function apercuSaison(): Promise<ApercuSaison | null> {
  if (process.env.VERCEL_ENV === 'production') return null
  return lireApercu((await cookies()).get(COOKIE_APERCU_SAISON)?.value)
}
