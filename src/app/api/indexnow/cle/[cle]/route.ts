import { cleValide } from '@/lib/indexnow'

// Fichier de clé IndexNow, servi à la racine : /{INDEXNOW_KEY}.txt est réécrit
// ici (next.config.js). La clé n'est pas un secret (elle est publique par
// construction), mais vit dans une variable d'environnement, sans fichier
// commité. Toute autre valeur : 404.

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: Promise<{ cle: string }> }) {
  const cle = process.env.INDEXNOW_KEY
  if (!cleValide(cle) || (await params).cle !== cle) return new Response('Not found', { status: 404 })
  return new Response(cle, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
