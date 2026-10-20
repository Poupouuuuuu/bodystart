import { describe, it, expect } from 'vitest'
import { BLANC, NOIR, contraste, cssSaison, dateSaison, lireApercu, lireSaison, periodeActive, periodeServeur, prochainChangement } from './saison'

// Metafield `bodystart.saison` tel que créé le 19/10/2026 (copie).
const METAFIELD = JSON.stringify({
  version: 1,
  maj: '2026-10-19',
  fuseau: 'Europe/Paris',
  periodes: [
    {
      theme: 'halloween',
      du: '2026-10-23T22:00:00Z',
      au: '2026-10-31T22:59:59Z',
      bandeau: { texte: '🎃 Halloween chez BodyStart · Retrait immédiat en boutique à Coignières', lien: '/conseil' },
      couleurs: { accent: '#E8711A', accent_2: '#4B2A6B' },
      decor: 'halloween',
    },
    {
      theme: 'black-week',
      du: '2026-11-22T23:00:00Z',
      au: '2026-11-28T22:59:59Z',
      bandeau: { texte: 'Black Week du 23 au 28/11 · Créatine Dedicated 500 g offerte dès 100 € de compléments', lien: '/' },
      couleurs: { accent: '#111111', accent_2: '#F2C200' },
      decor: 'black-week',
    },
    {
      theme: 'noel',
      du: '2026-11-28T23:00:00Z',
      au: '2026-12-24T22:59:59Z',
      bandeau: { texte: '🎁 Coffrets de Noël prêts à offrir · Retrait immédiat en boutique', lien: '/coffrets-noel' },
      couleurs: { accent: '#C62828', accent_2: '#1B5E20' },
      decor: 'noel',
    },
  ],
})

const P = lireSaison(METAFIELD)
const actif = (iso: string) => periodeActive(P, new Date(iso))?.theme ?? null

describe('lecture du metafield', () => {
  it('les 3 périodes réelles, triées, avec décor et texte lisible', () => {
    expect(P.map((p) => [p.theme, p.decor, p.lien])).toEqual([
      ['halloween', 'halloween', '/conseil'],
      ['black-week', null, '/'],
      ['noel', 'noel', '/coffrets-noel'],
    ])
    expect(P[0].texte).toBe('🎃 Halloween chez BodyStart · Retrait immédiat en boutique à Coignières')
  })

  it('contraste AA du texte sur chaque accent (bandeau et badges)', () => {
    expect(P.map((p) => p.texteSurAccent)).toEqual([NOIR, BLANC, BLANC])
    for (const p of P) expect(contraste(p.accent, p.texteSurAccent), p.theme).toBeGreaterThanOrEqual(4.5)
  })

  it('écarte ce qui est invalide sans faire tomber le reste', () => {
    const brut = {
      periodes: [
        { theme: 'paques', du: '2026-04-01', au: '2026-04-10', bandeau: { texte: 'x' }, couleurs: { accent: '#000000' } },
        { theme: 'noel', du: 'demain', au: '2026-12-24', bandeau: { texte: 'x' }, couleurs: { accent: '#000000' } },
        { theme: 'noel', du: '2026-12-01', au: '2026-12-24', bandeau: { texte: 'x' }, couleurs: { accent: 'red;}body{display:none' } },
        { theme: 'noel', du: '2026-12-01', au: '2026-12-24', bandeau: { texte: '  ' }, couleurs: { accent: '#000000' } },
        { theme: 'noel', du: '2026-12-24', au: '2026-12-01', bandeau: { texte: 'x' }, couleurs: { accent: '#000000' } },
        { theme: 'halloween', du: '2026-10-24', au: '2026-10-31', bandeau: { texte: 'ok', lien: 'https://ailleurs.example' }, couleurs: { accent: '#e8711a' } },
      ],
    }
    const r = lireSaison(brut)
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({ theme: 'halloween', lien: null, accent: '#E8711A', accent2: '#E8711A' })
  })

  it('liens internes seulement', () => {
    const avec = (lien: string) =>
      lireSaison({ periodes: [{ theme: 'noel', du: '2026-12-01', au: '2026-12-24', bandeau: { texte: 'x', lien }, couleurs: { accent: '#C62828' } }] })[0].lien
    expect(avec('/coffrets-noel')).toBe('/coffrets-noel')
    expect(avec('//evil.example')).toBeNull()
    expect(avec('javascript:alert(1)')).toBeNull()
    expect(avec('/a"onmouseover="x')).toBeNull()
  })

  it('metafield absent ou illisible : aucune période', () => {
    expect(lireSaison(null)).toEqual([])
    expect(lireSaison('{pas du json')).toEqual([])
    expect(lireSaison({ version: 1 })).toEqual([])
  })
})

describe('période active (dates UTC, heure de Paris en commentaire)', () => {
  it('Halloween du 24/10 0 h au 31/10 23 h 59, Paris', () => {
    expect(actif('2026-10-23T21:59:59Z')).toBeNull() // 23/10 23:59:59
    expect(actif('2026-10-23T22:00:00Z')).toBe('halloween') // 24/10 00:00
    expect(actif('2026-10-31T22:59:59Z')).toBe('halloween') // 31/10 23:59:59
    expect(actif('2026-10-31T23:00:00Z')).toBeNull() // 01/11 00:00
  })
  it('entre deux saisons : site normal ; Black Week puis Noël sans trou', () => {
    expect(actif('2026-11-10T12:00:00Z')).toBeNull()
    expect(actif('2026-11-25T12:00:00Z')).toBe('black-week')
    expect(actif('2026-11-28T22:59:59Z')).toBe('black-week')
    expect(actif('2026-11-28T23:00:00Z')).toBe('noel')
    expect(actif('2026-12-24T22:59:59Z')).toBe('noel')
    expect(actif('2026-12-24T23:00:00Z')).toBeNull()
  })
  it('prochain changement : pour basculer à l’heure pile sans recharger', () => {
    expect(prochainChangement(P, new Date('2026-10-19T12:00:00Z'))?.toISOString()).toBe('2026-10-23T22:00:00.000Z')
    expect(prochainChangement(P, new Date('2026-10-25T12:00:00Z'))?.toISOString()).toBe('2026-10-31T23:00:00.000Z')
    expect(prochainChangement(P, new Date('2026-12-30T12:00:00Z'))).toBeNull()
  })
})

describe('prévisualisation', () => {
  const now = new Date('2026-10-19T12:00:00Z')
  it('?saison_date= hors production seulement', () => {
    expect(dateSaison('2026-12-10', true, now).toISOString()).toBe('2026-12-10T00:00:00.000Z')
    expect(dateSaison('2026-12-10', false, now)).toBe(now)
    expect(dateSaison('n importe quoi', true, now)).toBe(now)
    expect(dateSaison(null, true, now)).toBe(now)
  })
  it('?saison= : un thème, « aucun », sinon rien (« auto » compris)', () => {
    expect(lireApercu('black-week')).toBe('black-week')
    expect(lireApercu('noel')).toBe('noel')
    expect(lireApercu('aucun')).toBe('aucun')
    expect(lireApercu('auto')).toBeNull()
    expect(lireApercu('Black-Week')).toBeNull()
    expect(lireApercu(undefined)).toBeNull()
  })
  it('thème forcé : sa période du metafield, avant ses dates', () => {
    expect(periodeServeur(P, now, 'black-week')?.theme).toBe('black-week')
    expect(periodeServeur(P, now, 'noel')?.texte).toBe(P.find((p) => p.theme === 'noel')?.texte)
    expect(periodeServeur(P, now, 'aucun')).toBeNull()
    expect(periodeServeur(P, now, null)).toEqual(periodeActive(P, now))
    expect(periodeServeur([], now, 'black-week')).toBeNull()
  })
})

describe('CSS de la période', () => {
  it('variables, badges et soulignés, couleurs validées seulement', () => {
    const css = cssSaison(P[0])
    expect(css).toContain('--saison-accent:#E8711A')
    expect(css).toContain('--saison-accent-texte:#111111')
    expect(css).toContain('.badge-saison{')
    expect(css).toContain('.souligne-saison{')
    expect(css).not.toMatch(/[<>]/)
  })
  it('Halloween : toile sur les badges, soulignés orange (guirlande dans le CSS du décor)', () => {
    const css = cssSaison(P[0])
    expect(css).toContain('.badge-saison::after{')
    expect(css).toContain('text-decoration-color:var(--saison-accent)')
    expect(css).not.toContain('.saison-entete{')
  })
  it('Noël : soulignés rouges, halo doré des cartes (guirlande dans le CSS du décor)', () => {
    const noel = P.find((p) => p.theme === 'noel')!
    const css = cssSaison(noel)
    expect(css).toContain('--saison-accent:#C62828')
    expect(css).toContain('text-decoration-color:var(--saison-accent)')
    expect(css).toContain('rgba(201,162,74,.45)')
    expect(css).not.toContain('.saison-entete{')
    expect(css).not.toMatch(/[<>]/)
  })
  it('Black Week : liseré et soulignés jaunes (accent_2), pas d’ombre noire', () => {
    const bw = P.find((p) => p.theme === 'black-week')!
    const css = cssSaison(bw)
    expect(css).toContain('--saison-accent:#111111')
    expect(css).toContain('--saison-accent-2:#F2C200')
    expect(css).toContain('.saison-entete{box-shadow:inset 0 -3px 0 var(--saison-accent-2)}')
    expect(css).not.toMatch(/[<>]/)
  })
})
