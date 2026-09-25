import { NextResponse } from 'next/server'

// GET /api/version — quel commit sert la prod ?
// Utilisé par le skill « verif-prod » (scripts/wait-deploy.mjs) pour attendre que
// Vercel serve bien le commit qu'on vient de pousser avant de lancer la sonde mobile.
// SHA tronqué : suffisant pour comparer, pas besoin d'exposer plus.

export const dynamic = 'force-dynamic'

export function GET() {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA
  return NextResponse.json(
    {
      sha: sha ? sha.slice(0, 12) : null,
      ref: process.env.VERCEL_GIT_COMMIT_REF ?? null,
      env: process.env.VERCEL_ENV ?? 'local',
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
