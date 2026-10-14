import { NextResponse } from 'next/server'
import { isAuthorizedCron } from '@/lib/stock-alerts/core'
import { JOURNAL_MAX, lireJournal } from '@/lib/jeu-roue/journal'

// ============================================================
// GET /api/jeu/erreurs : les 50 dernières erreurs du jeu de la roue
// ============================================================
// Journal tenu dans Upstash (lib/jeu-roue/journal) : erreurs attrapées par
// /api/jeu, avertissements Shopify qui ne bloquent pas, et échecs vus par la
// page (réseau, réponse illisible). Heure, étape, message, sans e-mail ni
// téléphone. Remplace les journaux Vercel, auxquels on n'a pas accès.
// Même contenu, sans secret, dans le métachamp boutique bodystart.jeu_erreurs
// (lecture par le connecteur Shopify), cf. lib/jeu-roue/journal.
//
// Auth : « Authorization: Bearer <CRON_SECRET> », comme le récap hebdo.
// Sans CRON_SECRET configuré, la route refuse tout (fail closed).

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: Request) {
  if (!isAuthorizedCron(req.headers.get('authorization'), process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  try {
    const erreurs = await lireJournal()
    return NextResponse.json({ max: JOURNAL_MAX, erreurs }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (err) {
    console.error('[jeu-roue/erreurs] redis :', err)
    return NextResponse.json({ error: 'redis' }, { status: 502 })
  }
}
