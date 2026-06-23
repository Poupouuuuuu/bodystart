/**
 * GET /api/loyalty/admin/me → { isAdmin }
 *
 * Sert UNIQUEMENT à l'UI pour afficher/masquer l'onglet admin. Ne révèle que
 * l'admin-ness de l'appelant (inoffensif). Toute action réelle est re-gatée
 * indépendamment dans ses propres routes (requireAdmin en tête).
 */
import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/loyalty/admin'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const gate = await requireAdmin()
  return NextResponse.json({ isAdmin: gate.ok })
}
