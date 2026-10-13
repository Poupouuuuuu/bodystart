// Journal des erreurs du jeu de la roue (Upstash Redis) : les 50 dernières,
// lisibles par /api/jeu/erreurs (route protégée). On n'a pas accès aux
// journaux Vercel : sans ce journal, un échec vu par une cliente en boutique
// ne laisse aucune trace (constaté le 13/10/2026).
//
// Aucune donnée personnelle : e-mails, numéros et identifiants longs sont
// masqués avant l'écriture. Une liste par environnement (la preview partage
// la base Upstash de la prod). Sans Upstash, tout devient sans effet.

import { Redis } from '@upstash/redis'

const configured =
  !!process.env.UPSTASH_REDIS_REST_URL && !process.env.UPSTASH_REDIS_REST_URL.includes('xxx')
const redis = configured ? Redis.fromEnv() : null

export const JOURNAL_MAX = 50
const cle = () => `jeu-roue:erreurs:${process.env.VERCEL_ENV ?? 'local'}`

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

/** Ajoute une entrée en tête du journal. Ne lève jamais : le jeu passe avant le journal. */
export async function noterErreur(e: Omit<EntreeJournal, 't'>): Promise<void> {
  if (!redis) return
  try {
    const entree: EntreeJournal = { ...e, message: nettoyer(e.message), t: new Date().toISOString() }
    await redis.lpush(cle(), JSON.stringify(entree))
    await redis.ltrim(cle(), 0, JOURNAL_MAX - 1)
  } catch (err) {
    console.warn('[jeu-roue] journal indisponible :', err)
  }
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
