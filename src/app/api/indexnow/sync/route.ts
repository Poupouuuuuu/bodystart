import { NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { synchroniser } from '@/lib/indexnow-serveur'

// ============================================================
// POST /api/indexnow/sync : soumet à IndexNow les URL nouvelles, modifiées
// ou retirées (lib/indexnow). Appelée par le workflow GitHub « IndexNow »
// après chaque mise en production (dès que /api/version sert le commit) et
// une fois par jour.
// ============================================================
// Sans authentification, volontairement : l'appel est idempotent (une URL
// inchangée n'est jamais renvoyée), un seul passage à la fois (verrou
// Upstash), et limité à 5 appels / 10 min par IP. Le pire qu'un tiers puisse
// faire est de déclencher un envoi qui aurait eu lieu au prochain passage.

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

const configure =
  !!process.env.UPSTASH_REDIS_REST_URL && !process.env.UPSTASH_REDIS_REST_URL.includes('xxx')
const limite = configure
  ? new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(5, '10 m'), prefix: 'ratelimit:indexnow' })
  : null

export async function POST(req: Request) {
  if (limite) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1'
    if (!(await limite.limit(ip)).success) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  }
  try {
    const resultat = await synchroniser()
    if (resultat.statut === 'refuse') console.error('[indexnow] envoi refusé', resultat)
    return NextResponse.json(resultat, { status: resultat.statut === 'refuse' ? 502 : 200 })
  } catch (err) {
    console.error('[indexnow] synchronisation en échec', err)
    return NextResponse.json({ error: 'sync_failed' }, { status: 500 })
  }
}
