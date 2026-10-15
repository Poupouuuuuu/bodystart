import { describe, it, expect } from 'vitest'
import { coffretsVisibles, dateCoffrets, estCoffret } from './coffrets'

describe('coffretsVisibles (heure de Paris)', () => {
  it('ouvre le 2 novembre à 00:00 heure de Paris (23:00 UTC la veille)', () => {
    expect(coffretsVisibles(new Date('2026-11-01T22:59:59Z'))).toBe(false)
    expect(coffretsVisibles(new Date('2026-11-01T23:00:00Z'))).toBe(true)
  })
  it('ferme après le 24 décembre 23:59 heure de Paris', () => {
    expect(coffretsVisibles(new Date('2026-12-24T22:59:59Z'))).toBe(true)
    expect(coffretsVisibles(new Date('2026-12-24T23:00:00Z'))).toBe(false)
  })
  it('revient chaque année, rien en dehors', () => {
    expect(coffretsVisibles(new Date('2027-11-15T12:00:00Z'))).toBe(true)
    expect(coffretsVisibles(new Date('2026-10-15T12:00:00Z'))).toBe(false)
    expect(coffretsVisibles(new Date('2027-01-05T12:00:00Z'))).toBe(false)
  })
})

describe('dateCoffrets', () => {
  const now = new Date('2026-10-15T12:00:00Z')
  it('date forcée prise hors production', () => {
    expect(dateCoffrets('2026-11-10', 'preview', now).toISOString()).toBe('2026-11-10T00:00:00.000Z')
  })
  it('ignorée en production, illisible ou absente', () => {
    expect(dateCoffrets('2026-11-10', 'production', now)).toBe(now)
    expect(dateCoffrets('pas une date', 'preview', now)).toBe(now)
    expect(dateCoffrets(undefined, 'preview', now)).toBe(now)
    expect(dateCoffrets(['2026-11-10'], 'preview', now)).toBe(now)
  })
})

describe('estCoffret', () => {
  it('reconnaît le tag, casse et espaces ignorés', () => {
    expect(estCoffret({ tags: ['coffret-noel'] })).toBe(true)
    expect(estCoffret({ tags: [' Coffret-Noel '] })).toBe(true)
    expect(estCoffret({ tags: ['pack'] })).toBe(false)
    expect(estCoffret({ tags: null })).toBe(false)
  })
})
