import { describe, it, expect, afterEach } from 'vitest'
import {
  isAdminEmail,
  normalizeAmbassadorCode,
  ambassadorCodeFromName,
  withUniquenessSuffix,
} from './admin'

describe('isAdminEmail', () => {
  const prev = process.env.ADMIN_EMAILS
  afterEach(() => {
    if (prev === undefined) delete process.env.ADMIN_EMAILS
    else process.env.ADMIN_EMAILS = prev
  })

  it('admin par défaut (codé en dur), insensible casse/espaces', () => {
    expect(isAdminEmail('bodystartnutrition@gmail.com')).toBe(true)
    expect(isAdminEmail('  BodyStartNutrition@Gmail.com ')).toBe(true)
  })
  it('email non-admin → false', () => {
    expect(isAdminEmail('client@example.com')).toBe(false)
    expect(isAdminEmail('')).toBe(false)
    expect(isAdminEmail(null)).toBe(false)
    expect(isAdminEmail(undefined)).toBe(false)
  })
  it('allowlist env ADMIN_EMAILS étend les admins', () => {
    process.env.ADMIN_EMAILS = 'boss@bodystart.fr, ops@bodystart.fr'
    expect(isAdminEmail('boss@bodystart.fr')).toBe(true)
    expect(isAdminEmail('OPS@BODYSTART.FR')).toBe(true)
    expect(isAdminEmail('bodystartnutrition@gmail.com')).toBe(true) // défaut toujours admin
    expect(isAdminEmail('intrus@example.com')).toBe(false)
  })
})

describe('normalizeAmbassadorCode', () => {
  it('MAJUSCULES, sans espaces, sans accents, A-Z0-9', () => {
    expect(normalizeAmbassadorCode('coach julie')).toBe('COACHJULIE')
    expect(normalizeAmbassadorCode('Léa-Fit 2024')).toBe('LEAFIT2024')
    expect(normalizeAmbassadorCode('  bs-123  ')).toBe('BS123')
    expect(normalizeAmbassadorCode('')).toBe('')
  })
})

describe('ambassadorCodeFromName', () => {
  it('prénom (1er mot) en MAJUSCULES', () => {
    expect(ambassadorCodeFromName('Julie Coaching')).toBe('JULIE')
    expect(ambassadorCodeFromName('Léa')).toBe('LEA')
    expect(ambassadorCodeFromName('Jo Dupont')).toBe('JO')
  })
  it('replis si vide/non exploitable', () => {
    expect(ambassadorCodeFromName('')).toBe('AMBASSADEUR')
    expect(ambassadorCodeFromName('   ')).toBe('AMBASSADEUR')
    expect(ambassadorCodeFromName('!!!')).toBe('AMBASSADEUR')
  })
})

describe('withUniquenessSuffix', () => {
  it('libre → base', () => {
    expect(withUniquenessSuffix('JULIE', new Set())).toBe('JULIE')
  })
  it('pris → base2, base3…', () => {
    expect(withUniquenessSuffix('JULIE', new Set(['JULIE']))).toBe('JULIE2')
    expect(withUniquenessSuffix('JULIE', new Set(['JULIE', 'JULIE2']))).toBe('JULIE3')
  })
})
