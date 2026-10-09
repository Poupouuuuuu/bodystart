import { randomInt } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { validateEntry, pickLot, type JeuResult } from '@/lib/jeu-roue/core'
import { LOTS, lotById, lotParfums, type Lot } from '@/lib/jeu-roue/lots'
import {
  findParticipant,
  getCustomerByEmail,
  upsertCustomer,
  lotsAvailability,
  createLotDiscount,
  markParticipant,
  readResult,
  hasPlayed,
  claimSpin,
  releaseSpin,
} from '@/lib/jeu-roue/shopify'
import { getStoredResult, storeResult, allowRequest } from '@/lib/jeu-roue/store'

// ============================================================
// Jeu de la roue en boutique (/jeu) : deux étapes
//   register : valide, repère un joueur déjà passé, crée ou met à jour la
//              fiche client Shopify (sans étiquette du jeu à ce stade)
//   spin     : tirage côté serveur, code de remise unique, marquage client
// Une participation par personne (e-mail ou téléphone). Le lot ne dépend
// jamais d'un avis Google.
// ============================================================

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export interface PublicResult {
  lotId: string
  label: string
  /** Parfums couverts (« A, B ou C »), affichés sous le lot. */
  parfums?: string
  code: string
  endsAt: string
}

function toPublic(r: JeuResult | null): PublicResult | null {
  const lot = r && lotById(r.lotId)
  return r && lot
    ? { lotId: r.lotId, label: lot.label, parfums: lotParfums(lot) ?? undefined, code: r.code, endsAt: r.endsAt }
    : null
}

const played = (r: JeuResult | null) => NextResponse.json({ status: 'played', result: toPublic(r) })
const fail = (status: number, error: string, field?: string, detail?: string) =>
  NextResponse.json({ error, field, detail }, { status })

// Détail technique de l'erreur renvoyé seulement hors production (preview,
// dev) : diagnostic sans accès aux journaux Vercel. Jamais de secret dedans
// (messages d'erreur Shopify ou Redis).
const debugDetail = (err: unknown) =>
  process.env.VERCEL_ENV === 'production' || (!process.env.VERCEL_ENV && process.env.NODE_ENV === 'production')
    ? undefined
    : String(err instanceof Error ? err.message : err).slice(0, 500)

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const step = body?.action === 'spin' ? 'spin' : body?.action === 'register' ? 'register' : null
  if (!body || !step) return fail(400, 'Requête invalide.')

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  try {
    if (!(await allowRequest(ip, step))) return fail(429, 'Trop de tentatives. Réessaie dans quelques minutes.')
  } catch (err) {
    console.warn('[jeu-roue] limiteur indisponible :', err)
  }

  const v = validateEntry(body)
  if (!v.ok) return fail(400, v.error, v.field)
  const { entry } = v

  try {
    // Déjà joué ? Redis d'abord (immédiat), puis Shopify (étiquette jeu-roue).
    const stored = await getStoredResult(entry.email, entry.phone)
    if (stored) return played(stored)

    if (step === 'register') {
      const participant = await findParticipant(entry.email, entry.phone)
      if (participant) {
        const r = readResult(participant)
        if (r) await storeResult(entry.email, entry.phone, r)
        return played(r)
      }
      const customerId = await upsertCustomer(entry)
      return NextResponse.json({ status: 'ready', customerId })
    }

    // ─── spin ───
    // La fiche de cet e-mail doit être celle créée à l'étape register.
    const customerId = typeof body.customerId === 'string' ? body.customerId : ''
    const customer = customerId ? await getCustomerByEmail(entry.email) : null
    if (!customer || customer.id !== customerId) {
      return fail(400, 'Participation introuvable. Recommence depuis le début.')
    }
    if (hasPlayed(customer) || readResult(customer)) return played(readResult(customer))
    const samePhone = await findParticipant(entry.email, entry.phone)
    if (samePhone) return played(readResult(samePhone))

    // Réservation atomique sur la fiche : un double envoi ne crée pas deux codes.
    const claim = await claimSpin(customer.id)
    if (claim.status === 'played') return played(claim.result)
    if (claim.status === 'busy') return fail(409, 'Ta roue tourne déjà. Patiente quelques secondes.')

    let lot: Lot
    let code: string
    let endsAt: string
    try {
      const { available, prices } = await lotsAvailability()
      lot = pickLot(LOTS, available, randomInt)
      ;({ code, endsAt } = await createLotDiscount(lot, prices.get(lot.id) ?? lot.amount))
    } catch (err) {
      await releaseSpin(customer.id).catch((e) => console.error('[jeu-roue] libération :', e))
      throw err
    }
    const result: JeuResult = { lotId: lot.id, code, endsAt, playedAt: new Date().toISOString() }
    // Le code existe : la personne le voit quoi qu'il arrive ensuite.
    await storeResult(entry.email, entry.phone, result).catch((e) => console.error('[jeu-roue] redis :', e))
    await markParticipant(customer, lot, result, entry.optIn)
    return NextResponse.json({ status: 'won', result: toPublic(result) })
  } catch (err) {
    console.error(`[jeu-roue] ${step} :`, err)
    return fail(503, 'Petit souci de connexion avec la boutique. Réessaie dans un instant.', undefined, debugDetail(err))
  }
}
