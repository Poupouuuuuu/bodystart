import { describe, it, expect } from 'vitest'
import {
  normalizeEmail,
  normalizeFrMobile,
  validateEntry,
  generateCode,
  pickLot,
  CODE_ALPHABET,
  noteLine,
} from './core'
import { LOTS, type LotId } from './lots'

const ALL = new Set<LotId>(LOTS.map((l) => l.id))

describe('normalizeFrMobile', () => {
  it('accepte les écritures courantes d’un portable français', () => {
    for (const raw of ['0612345678', '06 12 34 56 78', '06.12.34.56.78', '+33 6 12 34 56 78', '0033612345678', '07-12-34-56-78']) {
      expect(normalizeFrMobile(raw)).toMatch(/^\+33[67]\d{8}$/)
    }
    expect(normalizeFrMobile('06 12 34 56 78')).toBe('+33612345678')
  })

  it('refuse les fixes, les numéros incomplets et l’étranger', () => {
    for (const raw of ['0130123456', '061234567', '+32470123456', '', 'abc', null]) {
      expect(normalizeFrMobile(raw)).toBeNull()
    }
  })
})

describe('validateEntry', () => {
  const ok = { firstName: ' Léa ', lastName: 'Dupont-Martin', email: ' Lea@Exemple.FR ', phone: '07 61 84 75 80' }

  it('normalise prénom, e-mail et téléphone ; case décochée par défaut', () => {
    expect(validateEntry(ok)).toEqual({
      ok: true,
      entry: { firstName: 'Léa', lastName: 'Dupont-Martin', email: 'lea@exemple.fr', phone: '+33761847580', optIn: false },
    })
    const r = validateEntry({ ...ok, optIn: true })
    expect(r.ok && r.entry.optIn).toBe(true)
  })

  it('signale le premier champ invalide', () => {
    expect(validateEntry({ ...ok, firstName: '' })).toMatchObject({ ok: false, field: 'firstName' })
    expect(validateEntry({ ...ok, email: 'lea@' })).toMatchObject({ ok: false, field: 'email' })
    expect(validateEntry({ ...ok, phone: '01 30 12 34 56' })).toMatchObject({ ok: false, field: 'phone' })
    expect(validateEntry({ ...ok, optIn: 'true' })).toMatchObject({ ok: true, entry: { optIn: false } })
  })

  it('normalizeEmail met en minuscules', () => {
    expect(normalizeEmail('A@B.FR')).toBe('a@b.fr')
  })
})

describe('generateCode', () => {
  it('ROUE- suivi de 6 caractères sans O, I, 0 ni 1', () => {
    let i = 0
    const code = generateCode(() => i++ % CODE_ALPHABET.length)
    expect(code).toMatch(/^ROUE-[A-HJ-NP-Z2-9]{6}$/)
    expect(CODE_ALPHABET).not.toMatch(/[OI01]/)
  })
})

describe('pickLot', () => {
  it('respecte les poids : chaque tranche du tirage tombe sur le bon lot', () => {
    // Poids cumulés : canette 0-34, crunch 35-59, shaker 60-79, bon 80-94, créatine 95-98, whey 99
    const at = (n: number) => pickLot(LOTS, ALL, () => n).id
    expect([at(0), at(34), at(35), at(59), at(60), at(79), at(80), at(94), at(95), at(98), at(99)]).toEqual([
      'canette-abe', 'canette-abe', 'crunch-bar', 'crunch-bar', 'shaker', 'shaker', 'bon-5', 'bon-5', 'creatine', 'creatine', 'whey',
    ])
  })

  it('le total des poids fait 100', () => {
    expect(LOTS.reduce((s, l) => s + l.weight, 0)).toBe(100)
  })

  it('un lot sans stock est retiré du tirage', () => {
    const sansCanette = new Set<LotId>([...ALL].filter((id) => id !== 'canette-abe'))
    let max = 0
    const seen = new Set<string>()
    for (let n = 0; n < 65; n++) {
      seen.add(pickLot(LOTS, sansCanette, (m) => { max = m; return n }).id)
    }
    expect(max).toBe(65)
    expect(seen.has('canette-abe')).toBe(false)
    expect(pickLot(LOTS, new Set<LotId>(['bon-5']), () => 0).id).toBe('bon-5')
  })

  it('échoue explicitement si plus aucun lot n’est disponible', () => {
    expect(() => pickLot(LOTS, new Set(), () => 0)).toThrow()
  })
})

describe('noteLine', () => {
  it('format de la note client', () => {
    const lot = LOTS.find((l) => l.id === 'shaker')!
    expect(noteLine({ lotId: 'shaker', code: 'ROUE-ABC234', endsAt: '', playedAt: '2026-10-07T10:00:00Z' }, lot)).toBe(
      'Jeu roue 07/10/2026 : Un shaker, code ROUE-ABC234'
    )
  })
  it('lot à parfums : la note rappelle les parfums couverts (lue en caisse)', () => {
    const lot = LOTS.find((l) => l.id === 'crunch-bar')!
    expect(noteLine({ lotId: 'crunch-bar', code: 'ROUE-ABC234', endsAt: '', playedAt: '2026-10-09T10:00:00Z' }, lot)).toBe(
      'Jeu roue 09/10/2026 : Une barre Crunch Bar au choix : Dark Chocolate Peanut Butter, Peanut Butter Cup ou Chocolate Chip Cookie Dough, code ROUE-ABC234'
    )
  })
})
