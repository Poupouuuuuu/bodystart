// Jeu de la roue : Upstash Redis (déjà utilisé pour les limites de requêtes).
// - Résultat gardé par e-mail ET par téléphone : une 2e tentative réaffiche le
//   même lot tout de suite, sans attendre l'index de recherche Shopify (qui
//   peut mettre quelques secondes à voir la nouvelle étiquette).
// - Limite par adresse IP.
// Sans Upstash (variables absentes : dev local, et la prod au 07/10/2026), tout
// devient sans effet : Shopify reste la source de vérité et la réservation du
// tirage (shopify.ts, claimSpin) empêche les doubles codes.

import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'
import type { JeuResult } from './core'

const configured =
  !!process.env.UPSTASH_REDIS_REST_URL && !process.env.UPSTASH_REDIS_REST_URL.includes('xxx')
const redis = configured ? Redis.fromEnv() : null

const PREFIX = 'jeu-roue'
const RESULT_TTL_S = 400 * 24 * 3600 // une participation par personne, conservée ~13 mois

// 10 requêtes / 10 min / IP et par étape : en boutique, plusieurs clients
// peuvent partager la même adresse IP (Wi-Fi, opérateur mobile).
const limiters = redis
  ? {
      register: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '10 m'), prefix: `ratelimit:${PREFIX}:register` }),
      spin: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '10 m'), prefix: `ratelimit:${PREFIX}:spin` }),
    }
  : null

const resultKeys = (email: string, phone: string) => [`${PREFIX}:email:${email}`, `${PREFIX}:tel:${phone}`]

export async function getStoredResult(email: string, phone: string): Promise<JeuResult | null> {
  if (!redis) return null
  const [byEmail, byPhone] = await redis.mget<(JeuResult | null)[]>(...resultKeys(email, phone))
  return byEmail ?? byPhone ?? null
}

export async function storeResult(email: string, phone: string, result: JeuResult): Promise<void> {
  if (!redis) return
  await Promise.all(resultKeys(email, phone).map((k) => redis.set(k, result, { ex: RESULT_TTL_S })))
}

export async function allowRequest(ip: string, step: 'register' | 'spin'): Promise<boolean> {
  if (!limiters) return true
  return (await limiters[step].limit(ip)).success
}
