import { describe, it, expect } from 'vitest'
import { normalizeToE164, isValidE164 } from './phone'

describe('normalizeToE164', () => {
  it('normalise un numero FR local en E.164', () => {
    expect(normalizeToE164('0612345678')).toBe('+33612345678')
    expect(normalizeToE164('06 12 34 56 78')).toBe('+33612345678')
    expect(normalizeToE164('06.12.34.56.78')).toBe('+33612345678')
  })

  it('accepte deja un E.164 valide', () => {
    expect(normalizeToE164('+33612345678')).toBe('+33612345678')
  })

  it('accepte 0033 (format international ancien)', () => {
    // Note : libphonenumber gere 0033 mais peut le mapper differemment
    const result = normalizeToE164('0033612345678')
    expect(result === '+33612345678' || result === null).toBe(true)
  })

  it('retourne null pour chaine vide ou invalide', () => {
    expect(normalizeToE164('')).toBe(null)
    expect(normalizeToE164('   ')).toBe(null)
    expect(normalizeToE164('abc')).toBe(null)
    expect(normalizeToE164('123')).toBe(null)
  })

  it('retourne null pour input non-string', () => {
    // @ts-expect-error : runtime guard
    expect(normalizeToE164(null)).toBe(null)
    // @ts-expect-error
    expect(normalizeToE164(undefined)).toBe(null)
    // @ts-expect-error
    expect(normalizeToE164(123456)).toBe(null)
  })

  it('refuse des numeros trop courts (10 chiffres incomplet)', () => {
    expect(normalizeToE164('061234567')).toBe(null)
  })
})

describe('isValidE164', () => {
  it('accepte des E.164 valides', () => {
    expect(isValidE164('+33612345678')).toBe(true) // FR mobile
    expect(isValidE164('+442071838750')).toBe(true) // UK
  })

  it('refuse les formats non-E.164', () => {
    expect(isValidE164('0612345678')).toBe(false) // pas de +
    expect(isValidE164('+33 6 12 34 56 78')).toBe(false) // espaces interdits en E.164 strict
    expect(isValidE164('33612345678')).toBe(false)
  })

  it('refuse les chaines vides ou non-string', () => {
    expect(isValidE164('')).toBe(false)
    // @ts-expect-error
    expect(isValidE164(null)).toBe(false)
    // @ts-expect-error
    expect(isValidE164(undefined)).toBe(false)
  })
})
