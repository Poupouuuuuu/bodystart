// Journal des erreurs du jeu de la roue (Upstash Redis) : les 50 dernières,
// lisibles par /api/jeu/erreurs (route protégée). On n'a pas accès aux
// journaux Vercel : sans ce journal, un échec vu par une cliente en boutique
// ne laisse aucune trace (constaté le 13/10/2026).
//
// Copie dans le métachamp boutique `bodystart.jeu_erreurs` (json, sans
// définition donc invisible de l'API Storefront), lisible avec le connecteur
// Shopify sans CRON_SECRET. Une lecture puis une écriture par erreur, après
// la réponse (`after`) pour ne pas la retarder. Indépendante de Redis : elle
// garde une trace même quand Upstash est en panne. La preview écrit dans
// `bodystart.jeu_erreurs_preview`, le développement local nulle part.
//
// Aucune donnée personnelle : e-mails, numéros et identifiants longs sont
// masqués avant l'écriture. Une liste par environnement (la preview partage
// la base Upstash de la prod). Sans Upstash, rien côté Redis.

import { after } from 'next/server'
import { Redis } from '@upstash/redis'
import { shopifyAdminFetch } from '@/lib/shopify/client'

const configured =
  !!process.env.UPSTASH_REDIS_REST_URL && !process.env.UPSTASH_REDIS_REST_URL.includes('xxx')
const redis = configured ? Redis.fromEnv() : null

export const JOURNAL_MAX = 50
const cle = () => `jeu-roue:erreurs:${process.env.VERCEL_ENV ?? 'local'}`

const API = { apiVersion: '2026-04' }
const MF_NAMESPACE = 'bodystart'

/** Clé du métachamp boutique, ou null hors Vercel (dev local, tests). */
export function cleMetachamp(env = process.env.VERCEL_ENV): string | null {
  if (!env) return null
  return env === 'production' ? 'jeu_erreurs' : `jeu_erreurs_${env}`
}

export type Etape = 'register' | 'spin'

export interface EntreeJournal {
  /** Date ISO. */
  t: string
  etape: Etape
  /** serveur : erreur attrapée par /api/jeu ; page : échec vu par le navigateur (réseau, réponse illisible). */
  source: 'serveur' | 'page'
  niveau: 'erreur' | 'avertissement'
  message: string
  /** Statut HTTP vu par la page (0 = la requête n'a pas abouti). */
  http?: number
}

/** Masque e-mails, numéros de téléphone et identifiants longs, tronque à 300 caractères. */
export function nettoyer(message: string): string {
  return message
    .replace(/[^\s@"'<>(),;:]+@[^\s@"'<>(),;:]+/g, '[e-mail]')
    .replace(/\+?\d[\d .-]{7,}\d/g, '[numéro]')
    .slice(0, 300)
}

/** Ajoute l'entrée en tête du métachamp boutique (50 au plus). Ne lève jamais. */
export async function copierDansShopify(entree: EntreeJournal): Promise<void> {
  const key = cleMetachamp()
  if (!key) return
  try {
    const data = await shopifyAdminFetch<{ shop: { id: string; metafield: { value: string } | null } }>(
      `query JournalJeu($key: String!) { shop { id metafield(namespace: "${MF_NAMESPACE}", key: $key) { value } } }`,
      { key },
      API
    )
    let avant: unknown = []
    try {
      avant = JSON.parse(data.shop.metafield?.value ?? '[]')
    } catch {
      avant = []
    }
    const liste = [entree, ...(Array.isArray(avant) ? avant : [])].slice(0, JOURNAL_MAX)
    const res = await shopifyAdminFetch<{ metafieldsSet: { userErrors: { field?: string[] | null; message: string }[] } }>(
      `mutation JournalJeuSet($metafields: [MetafieldsSetInput!]!) { metafieldsSet(metafields: $metafields) { userErrors { field message } } }`,
      { metafields: [{ ownerId: data.shop.id, namespace: MF_NAMESPACE, key, type: 'json', value: JSON.stringify(liste) }] },
      API
    )
    if (res.metafieldsSet.userErrors.length) {
      console.warn('[jeu-roue] copie Shopify du journal refusée :', res.metafieldsSet.userErrors)
    }
  } catch (err) {
    // Jamais noterErreur ici : une panne Shopify bouclerait sur elle-même.
    console.warn('[jeu-roue] copie Shopify du journal impossible :', err)
  }
}

/** Après la réponse quand on est dans une requête, tout de suite sinon (tests). */
function apresReponse(tache: () => Promise<void>): Promise<void> {
  try {
    after(tache)
    return Promise.resolve()
  } catch {
    return tache()
  }
}

/** Ajoute une entrée en tête du journal. Ne lève jamais : le jeu passe avant le journal. */
export async function noterErreur(e: Omit<EntreeJournal, 't'>): Promise<void> {
  const entree: EntreeJournal = { ...e, message: nettoyer(e.message), t: new Date().toISOString() }
  const copie = apresReponse(() => copierDansShopify(entree))
  if (redis) {
    try {
      await redis.lpush(cle(), JSON.stringify(entree))
      await redis.ltrim(cle(), 0, JOURNAL_MAX - 1)
    } catch (err) {
      console.warn('[jeu-roue] journal indisponible :', err)
    }
  }
  await copie
}

export async function lireJournal(): Promise<EntreeJournal[]> {
  if (!redis) return []
  const brut = await redis.lrange<unknown>(cle(), 0, JOURNAL_MAX - 1)
  return brut
    .map((x) => {
      if (x && typeof x === 'object') return x as EntreeJournal
      try {
        return JSON.parse(String(x)) as EntreeJournal
      } catch {
        return null
      }
    })
    .filter((x): x is EntreeJournal => !!x)
}
