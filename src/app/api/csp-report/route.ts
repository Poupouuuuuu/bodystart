import { NextRequest } from 'next/server'
import { summarizeCspReport } from '@/lib/csp-report'

// Reçoit les violations de la Content-Security-Policy (directive report-uri,
// cf. next.config.js) et les écrit dans les journaux Vercel, une ligne
// « [csp] … » par violation. Rien n'est stocké.

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_BODY = 20_000

// 30 rapports / 1 min / IP : une page qui boucle sur une violation ne doit pas
// noyer les journaux. Sans Upstash : pas de limite.
let ratelimit: { limit: (key: string) => Promise<{ success: boolean }> } | null = null
if (process.env.UPSTASH_REDIS_REST_URL && !process.env.UPSTASH_REDIS_REST_URL.includes('xxx')) {
  const { Ratelimit } = require('@upstash/ratelimit')
  const { Redis } = require('@upstash/redis')
  ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    prefix: 'ratelimit:csp-report',
  })
}

export async function POST(req: NextRequest) {
  try {
    if (ratelimit) {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
      if (!(await ratelimit.limit(ip)).success) return new Response(null, { status: 204 })
    }
    const raw = (await req.text()).slice(0, MAX_BODY)
    for (const l of summarizeCspReport(raw)) console.warn(`[csp] ${l}`)
  } catch (err) {
    console.warn('[csp] rapport illisible :', err instanceof Error ? err.message : err)
  }
  return new Response(null, { status: 204 })
}
