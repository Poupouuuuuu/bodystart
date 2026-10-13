import { NextResponse } from 'next/server'
import { chargerPaliers } from '@/lib/paliers/serveur'

// Paliers cadeaux du panier (métachamp bodystart.paliers_cadeaux + base de
// chaque palier + stock des cadeaux). Lecture seule, sans donnée personnelle :
// mise en cache 5 min sur le CDN. En échec, { ok: false } : le tiroir masque
// la barre et le panier fonctionne normalement.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const data = await chargerPaliers()
    if (!data) {
      return NextResponse.json({ ok: false }, { headers: { 'Cache-Control': 'public, s-maxage=60' } })
    }
    return NextResponse.json(
      { ok: true, ...data },
      { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
    )
  } catch (err) {
    console.error('[api/paliers] lecture en échec :', err)
    // Cause affichée sur la preview seulement (droit Admin manquant, etc.).
    const detail = process.env.VERCEL_ENV !== 'production' ? { erreur: String(err).slice(0, 300) } : {}
    return NextResponse.json({ ok: false, ...detail }, { headers: { 'Cache-Control': 'no-store' } })
  }
}
