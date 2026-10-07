// Fonctions pures du jeu de la roue : validation, code, tirage. Sans réseau,
// testées dans core.test.ts.

import type { Lot, LotId } from './lots'

export interface Entry {
  firstName: string
  lastName: string
  email: string
  /** Portable français normalisé : +33 suivi de 9 chiffres (6 ou 7 en tête). */
  phone: string
  optIn: boolean
}

/** Résultat d'une participation, conservé (Shopify + Redis) et réaffiché. */
export interface JeuResult {
  lotId: LotId
  code: string
  /** ISO, fin de validité du code. */
  endsAt: string
  /** ISO, date du tirage. */
  playedAt: string
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const NAME_RE = /^[\p{L}][\p{L}\p{M} '’.-]{0,59}$/u

export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const email = raw.trim().toLowerCase()
  return email.length <= 254 && EMAIL_RE.test(email) ? email : null
}

/** 06 12 34 56 78, 06.12.34.56.78, +33 6 12…, 0033 6 12… → +33612345678. */
export function normalizeFrMobile(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const digits = raw.replace(/[\s.\-()]/g, '')
  const m = digits.match(/^(?:\+33|0033|33|0)([67]\d{8})$/)
  return m ? `+33${m[1]}` : null
}

function normalizeName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const name = raw.trim().replace(/\s+/g, ' ')
  return NAME_RE.test(name) ? name : null
}

export type EntryField = 'firstName' | 'lastName' | 'email' | 'phone'

export function validateEntry(
  body: Record<string, unknown>
): { ok: true; entry: Entry } | { ok: false; field: EntryField; error: string } {
  const firstName = normalizeName(body.firstName)
  if (!firstName) return { ok: false, field: 'firstName', error: 'Indique ton prénom.' }
  const lastName = normalizeName(body.lastName)
  if (!lastName) return { ok: false, field: 'lastName', error: 'Indique ton nom.' }
  const email = normalizeEmail(body.email)
  if (!email) return { ok: false, field: 'email', error: 'Cet e-mail ne semble pas valide.' }
  const phone = normalizeFrMobile(body.phone)
  if (!phone) {
    return { ok: false, field: 'phone', error: 'Indique un portable français (06 ou 07).' }
  }
  return { ok: true, entry: { firstName, lastName, email, phone, optIn: body.optIn === true } }
}

// Sans O, I, 0 ni 1 (confusions à la lecture en caisse).
export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/** randInt(n) renvoie un entier dans [0, n[ (crypto.randomInt en prod). */
export type RandInt = (max: number) => number

export function generateCode(randInt: RandInt): string {
  let s = ''
  for (let i = 0; i < 6; i++) s += CODE_ALPHABET[randInt(CODE_ALPHABET.length)]
  return `ROUE-${s}`
}

/**
 * Tirage pondéré parmi les lots disponibles. Les lots absents de `available`
 * (plus de stock) sont retirés et le tirage se fait parmi les autres.
 */
export function pickLot(lots: Lot[], available: ReadonlySet<LotId>, randInt: RandInt): Lot {
  const pool = lots.filter((l) => available.has(l.id) && l.weight > 0)
  if (pool.length === 0) throw new Error('[jeu-roue] aucun lot disponible')
  const total = pool.reduce((sum, l) => sum + l.weight, 0)
  let r = randInt(total)
  for (const lot of pool) {
    if (r < lot.weight) return lot
    r -= lot.weight
  }
  return pool[pool.length - 1]
}

export function formatDateFr(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })
}

/** Ligne ajoutée à la note client Shopify. */
export function noteLine(result: JeuResult, lot: Lot): string {
  return `Jeu roue ${formatDateFr(result.playedAt)} : ${lot.label}, code ${result.code}`
}
