// IndexNow côté serveur : URL actuelles, état dans Upstash, soumission.
// Logique pure et règles de soumission : lib/indexnow.ts.
//
// Ne soumet qu'en production, avec une clé valide (INDEXNOW_KEY) et Upstash.
// Ailleurs (preview, local) : essai à blanc, la liste est calculée et renvoyée
// mais rien n'est envoyé ni enregistré.

import { createHash } from 'node:crypto'
import { Redis } from '@upstash/redis'
import sitemap from '@/app/sitemap'
import { shopifyFetch } from '@/lib/shopify/client'
import { aSoumettre, cleValide, contenuFiche, soumettre, versionDeDate, type EntreeIndexNow } from '@/lib/indexnow'

const configure =
  !!process.env.UPSTASH_REDIS_REST_URL && !process.env.UPSTASH_REDIS_REST_URL.includes('xxx')
const redis = configure ? Redis.fromEnv() : null

const CLE_ETAT = 'indexnow:etat'
const CLE_VERROU = 'indexnow:verrou'
const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bodystart-nutrition.fr').replace(/\/+$/, '')

const CHAMPS_FICHE = `handle title description availableForSale priceRange { minVariantPrice { amount } maxVariantPrice { amount } }`
const FICHES = `query IndexNowFiches($first: Int!, $after: String) {
  products(first: $first, after: $after) { pageInfo { hasNextPage endCursor } nodes { ${CHAMPS_FICHE} } }
}`
const FICHE = `query IndexNowFiche($handle: String!) { product(handle: $handle) { ${CHAMPS_FICHE} } }`

type Fiche = Parameters<typeof contenuFiche>[0] & { handle: string }

/** Préfixe « h » : une empreinte toute en chiffres ne doit pas être relue comme un nombre par Upstash. */
const versionFiche = (f: Fiche) => `h${createHash('sha256').update(contenuFiche(f)).digest('hex').slice(0, 16)}`

async function versionsFiches(): Promise<Map<string, string>> {
  const out = new Map<string, string>()
  let after: string | null = null
  for (let page = 0; page < 4; page++) {
    const data: { products: { pageInfo: { hasNextPage: boolean; endCursor: string | null }; nodes: Fiche[] } } =
      await shopifyFetch(FICHES, { first: 250, after })
    for (const f of data.products.nodes) out.set(f.handle, versionFiche(f))
    if (!data.products.pageInfo.hasNextPage) break
    after = data.products.pageInfo.endCursor
  }
  return out
}

/** URL du sitemap avec leur version (empreinte pour une fiche, date pour un guide). */
async function entreesActuelles(): Promise<EntreeIndexNow[]> {
  const [plan, fiches] = await Promise.all([sitemap(), versionsFiches()])
  return plan.map((e) => {
    const handle = e.url.match(/\/products\/([^/?#]+)$/)?.[1]
    return { url: e.url, version: (handle && fiches.get(handle)) || versionDeDate(e.lastModified) }
  })
}

async function lireEtat(): Promise<Record<string, string>> {
  const brut = (await redis!.hgetall<Record<string, unknown>>(CLE_ETAT)) ?? {}
  return Object.fromEntries(Object.entries(brut).map(([url, v]) => [url, String(v)]))
}

export type ResultatIndexNow =
  | { statut: 'indisponible'; raison: string }
  | { statut: 'occupe' }
  | { statut: 'rien' }
  | { statut: 'essai'; urls: number; exemple: string[] }
  | { statut: 'soumis' | 'refuse'; urls: number; http: number }

const enProduction = () => process.env.VERCEL_ENV === 'production'

/** Tout le site : URL nouvelles, modifiées ou retirées depuis le dernier envoi. */
export async function synchroniser(): Promise<ResultatIndexNow> {
  if (!redis) return { statut: 'indisponible', raison: 'upstash' }
  const cle = process.env.INDEXNOW_KEY
  const reel = enProduction() && cleValide(cle)
  // Un seul passage à la fois (déploiement et passage quotidien simultanés).
  if (reel && !(await redis.set(CLE_VERROU, '1', { nx: true, ex: 120 }))) return { statut: 'occupe' }
  try {
    const { urls, etat } = aSoumettre(await entreesActuelles(), await lireEtat())
    if (!reel) return { statut: 'essai', urls: urls.length, exemple: urls.slice(0, 10) }
    if (urls.length === 0) return { statut: 'rien' }
    const r = await soumettre(SITE, cle, urls)
    if (!r.ok) return { statut: 'refuse', urls: urls.length, http: r.status }
    const tx = redis.multi()
    tx.del(CLE_ETAT)
    if (Object.keys(etat).length > 0) tx.hset(CLE_ETAT, etat)
    await tx.exec()
    return { statut: 'soumis', urls: urls.length, http: r.status }
  } finally {
    if (reel) await redis.del(CLE_VERROU)
  }
}

/**
 * Une fiche (webhook Shopify products/update) : soumise seulement si son
 * contenu utile a changé ou si elle a disparu du site. Un simple mouvement de
 * stock (le webhook part à chaque vente) ne déclenche rien.
 */
export async function synchroniserFiche(handle: string): Promise<ResultatIndexNow> {
  if (!redis) return { statut: 'indisponible', raison: 'upstash' }
  const cle = process.env.INDEXNOW_KEY
  const url = `${SITE}/products/${handle}`
  const data = await shopifyFetch<{ product: Fiche | null }>(FICHE, { handle })
  const version = data.product ? versionFiche(data.product) : null
  const avant = await redis.hget<unknown>(CLE_ETAT, url)
  if (avant == null ? version === null : String(avant) === version) return { statut: 'rien' }
  if (!(enProduction() && cleValide(cle))) return { statut: 'essai', urls: 1, exemple: [url] }
  const r = await soumettre(SITE, cle, [url])
  if (!r.ok) return { statut: 'refuse', urls: 1, http: r.status }
  if (version) await redis.hset(CLE_ETAT, { [url]: version })
  else await redis.hdel(CLE_ETAT, url)
  return { statut: 'soumis', urls: 1, http: r.status }
}
