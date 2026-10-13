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
import { noterErreur, type Etape } from '@/lib/jeu-roue/journal'

// ============================================================
// Jeu de la roue en boutique (/jeu) : deux étapes
//   register : valide, repère un joueur déjà passé, crée ou met à jour la
//              fiche client Shopify (sans étiquette du jeu à ce stade)
//   spin     : tirage côté serveur, code de remise unique, marquage client
//   signal   : la page signale un échec que le serveur n'a pas vu (réseau,
//              réponse illisible), pour le journal des erreurs
// Une participation par personne (e-mail ou téléphone). Le lot ne dépend
// jamais d'un avis Google. Toute erreur attrapée part au journal
// (lib/jeu-roue/journal, lisible par /api/jeu/erreurs).
// ============================================================

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
// Délai explicite : au-delà, la plateforme répond sans JSON et la page ne sait
// plus quoi afficher (inscription : 2 à 3 s en temps normal).
export const maxDuration = 30

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

/** Échec vu par la page : étape, type, statut HTTP et début du corps reçu. Rien de personnel. */
async function signal(body: Record<string, unknown>, ip: string) {
  const etape = body.etape === 'spin' ? 'spin' : body.etape === 'register' ? 'register' : null
  const type = body.type === 'reseau' || body.type === 'reponse' ? body.type : null
  const http = typeof body.http === 'number' && Number.isInteger(body.http) && body.http >= 0 && body.http < 600 ? body.http : null
  if (!etape || !type || http === null) return fail(400, 'Requête invalide.')
  if (!(await allowRequest(ip, 'signal').catch(() => true))) return new NextResponse(null, { status: 204 })
  const extrait = typeof body.extrait === 'string' ? body.extrait.slice(0, 120) : ''
  await noterErreur({
    etape,
    source: 'page',
    niveau: 'erreur',
    http,
    message: type === 'reseau' ? 'requête sans réponse (réseau)' : `réponse illisible${extrait ? ` : ${extrait}` : ''}`,
  })
  return new NextResponse(null, { status: 204 })
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
  if (body?.action === 'signal') return signal(body, ip)
  const step: Etape | null = body?.action === 'spin' ? 'spin' : body?.action === 'register' ? 'register' : null
  if (!body || !step) return fail(400, 'Requête invalide.')
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
    await noterErreur({ etape: step, source: 'serveur', niveau: 'erreur', http: 503, message: String(err instanceof Error ? err.message : err) })
    return fail(503, 'Petit souci de connexion avec la boutique. Réessaie dans un instant.', undefined, debugDetail(err))
  }
}
