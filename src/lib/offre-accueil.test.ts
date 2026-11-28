import { describe, it, expect } from 'vitest'
import { lireSaison, indexPeriode, periodeDeRang } from './saison'
import { dernierJour, offreDe, periodeOffre, periodeOffreServeur } from './offre-accueil'

// Périodes du metafield bodystart.saison au 28/11/2026 (Black Week puis Noël),
// plus une annonce qui chevauche la Black Week.
const PERIODES = lireSaison({
  periodes: [
    {
      theme: 'black-week',
      du: '2026-11-22T23:00:00Z',
      au: '2026-11-28T22:59:59Z',
      bandeau: { texte: 'Black Week', lien: '/products' },
      couleurs: { accent: '#111111', accent_2: '#F2C200' },
    },
    {
      theme: 'noel',
      du: '2026-11-28T23:00:00Z',
      au: '2026-12-24T22:59:59Z',
      bandeau: { texte: 'Noël', lien: '/coffrets-noel' },
      couleurs: { accent: '#B3261E', accent_2: '#F2D28A' },
    },
    {
      theme: 'annonce',
      du: '2026-11-27T00:00:00Z',
      au: '2026-11-27T22:59:59Z',
      bandeau: { texte: 'Fermeture exceptionnelle' },
      couleurs: { accent: '#2D5A2D' },
    },
  ],
})
const BW = PERIODES.find((p) => p.theme === 'black-week')!
const NOEL = PERIODES.find((p) => p.theme === 'noel')!

describe('periodeOffre', () => {
  it('Black Week jusqu’au 28/11 22:59:59 UTC, Noël dès 23:00:00', () => {
    expect(periodeOffre(PERIODES, new Date('2026-11-28T22:59:59Z'))).toBe(BW)
    expect(periodeOffre(PERIODES, new Date('2026-11-28T23:00:00Z'))).toBe(NOEL)
    expect(periodeOffre(PERIODES, new Date('2026-12-24T22:59:59Z'))).toBe(NOEL)
    expect(periodeOffre(PERIODES, new Date('2026-12-24T23:00:00Z'))).toBeNull()
  })

  it('une annonce ne masque pas l’offre de la période', () => {
    expect(periodeOffre(PERIODES, new Date('2026-11-27T12:00:00Z'))).toBe(BW)
  })

  it('aperçu forcé : thème, « aucun », thème sans offre', () => {
    const now = new Date('2026-11-28T10:00:00Z')
    expect(periodeOffreServeur(PERIODES, now, 'noel')).toBe(NOEL)
    expect(periodeOffreServeur(PERIODES, now, 'aucun')).toBeNull()
    expect(periodeOffreServeur(PERIODES, now, 'halloween')).toBeNull()
    expect(periodeOffreServeur(PERIODES, now, null)).toBe(BW)
  })

  it('le rang rendu par le serveur redonne la même période au navigateur', () => {
    const rang = indexPeriode(PERIODES, BW)
    expect(periodeDeRang(PERIODES, rang)).toBe(BW)
    expect(periodeDeRang(PERIODES, indexPeriode(PERIODES, null))).toBeNull()
  })
})

describe('dernier jour et échéance', () => {
  it('« Dernier jour » seulement le 28/11, heure de Paris', () => {
    // 27/11 23:30 UTC = 28/11 00:30 à Paris.
    expect(dernierJour(BW, new Date('2026-11-27T23:30:00Z'))).toBe(true)
    // 27/11 22:30 UTC = 27/11 23:30 à Paris.
    expect(dernierJour(BW, new Date('2026-11-27T22:30:00Z'))).toBe(false)
    expect(dernierJour(BW, new Date('2026-11-28T22:59:00Z'))).toBe(true)
    expect(dernierJour(NOEL, new Date('2026-11-28T23:30:00Z'))).toBe(false)
    expect(dernierJour(null, new Date())).toBe(false)
  })
})

describe('offreDe', () => {
  it('Black Week : « Dernier jour » le jour même seulement, textes de Gestion', () => {
    expect(offreDe(BW, true).surTitre).toBe('Dernier jour')
    expect(offreDe(BW, false).surTitre).toBe('Black Week')
    const o = offreDe(BW, true)
    expect(o.titre).toBe('Ta créatine 500\u00a0g offerte')
    expect(o.phrase).toContain('(36,90\u00a0€)')
    expect(o.lien).toBe('/products')
    expect(o.second).toEqual({ texte: 'Voir les packs', lien: '/packs' })
    // Même si le bandeau de la période vise un seul produit.
    expect(offreDe({ ...BW, lien: '/products/pack-gamer-serie-limitee' }, true).lien).toBe('/products')
  })

  it('Noël : les coffrets', () => {
    const o = offreDe(NOEL, false)
    expect(o.cle).toBe('noel')
    expect(o.surTitre).toBe('Noël chez BodyStart')
    expect(o.titre).toBe('Les coffrets sont prêts')
    expect(o.lien).toBe('/coffrets-noel')
    expect(o.second.lien).toBe('/products')
  })

  it('hors période : offre permanente vers les meilleures ventes', () => {
    const o = offreDe(null, false)
    expect(o.cle).toBe('permanente')
    expect(o.titre).toContain('85\u00a0€')
    expect(o.lien).toBe('/products')
  })

  it('les mots en couleur sont dans le titre', () => {
    for (const o of [offreDe(BW, true), offreDe(BW, false), offreDe(NOEL, false), offreDe(null, false)]) {
      expect(o.titre).toContain(o.accent)
    }
  })

  it('aucun tiret long dans les textes', () => {
    for (const o of [offreDe(BW, true), offreDe(NOEL, false), offreDe(null, false)]) {
      expect(`${o.surTitre} ${o.titre} ${o.phrase} ${o.bouton} ${o.second.texte}`).not.toMatch(/[\u2013\u2014]/)
    }
  })
})
