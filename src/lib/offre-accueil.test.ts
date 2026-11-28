import { describe, it, expect } from 'vitest'
import { lireSaison, indexPeriode, periodeDeRang } from './saison'
import {
  dernierJour,
  echeance,
  heureFin,
  offreDe,
  periodeOffre,
  periodeOffreServeur,
  resteAvantFin,
} from './offre-accueil'

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

  it('heure de fin et texte initial sans dépendre de l’heure', () => {
    expect(heureFin(BW)).toBe('23\u00a0h\u00a059')
    expect(echeance(BW, true)).toBe('Jusqu\'à ce soir 23\u00a0h\u00a059')
    expect(echeance(NOEL, false)).toBe('Jusqu\'au 24/12')
  })
})

describe('resteAvantFin', () => {
  it('vrai compte à rebours dans les dernières 24 h', () => {
    expect(resteAvantFin(BW, new Date('2026-11-28T17:48:00Z'))).toBe('Plus que 5\u00a0h\u00a012\u00a0min')
    expect(resteAvantFin(BW, new Date('2026-11-28T22:18:00Z'))).toBe('Plus que 42\u00a0min')
    expect(resteAvantFin(BW, new Date('2026-11-28T20:00:00Z'))).toBe('Plus que 3\u00a0h')
    // Minutes arrondies au-dessus : 30 s avant la fin, il reste « 1 min ».
    expect(resteAvantFin(BW, new Date('2026-11-28T22:59:30Z'))).toBe('Plus que 1\u00a0min')
  })

  it('rien hors des dernières 24 h ni après la fin', () => {
    expect(resteAvantFin(BW, new Date('2026-11-27T20:00:00Z'))).toBeNull()
    expect(resteAvantFin(BW, new Date('2026-11-28T23:00:00Z'))).toBeNull()
    expect(resteAvantFin(NOEL, new Date('2026-11-29T10:00:00Z'))).toBeNull()
  })
})

describe('offreDe', () => {
  it('Black Week : préfixe « Dernier jour » le jour même seulement', () => {
    expect(offreDe(BW, true).titre).toBe('Dernier jour\u00a0: ta créatine 500\u00a0g offerte dès 100\u00a0€ de compléments')
    expect(offreDe(BW, false).titre).toBe('Ta créatine 500\u00a0g offerte dès 100\u00a0€ de compléments')
    expect(offreDe(BW, true).lien).toBe('/products')
    // Même si le bandeau de la période vise un seul produit.
    expect(offreDe({ ...BW, lien: '/products/pack-gamer-serie-limitee' }, true).lien).toBe('/products')
  })

  it('Noël : les coffrets', () => {
    const o = offreDe(NOEL, false)
    expect(o.cle).toBe('noel')
    expect(o.lien).toBe('/coffrets-noel')
  })

  it('hors période : offre permanente vers les meilleures ventes', () => {
    const o = offreDe(null, false)
    expect(o.cle).toBe('permanente')
    expect(o.titre).toContain('85\u00a0€')
    expect(o.lien).toBe('#meilleures-ventes')
  })

  it('les mots en couleur sont dans le titre', () => {
    for (const o of [offreDe(BW, true), offreDe(BW, false), offreDe(NOEL, false), offreDe(null, false)]) {
      expect(o.titre).toContain(o.accent)
    }
  })

  it('aucun tiret long dans les textes', () => {
    for (const o of [offreDe(BW, true), offreDe(NOEL, false), offreDe(null, false)]) {
      expect(`${o.etiquette} ${o.titre} ${o.phrase} ${o.bouton}`).not.toMatch(/[–—]/)
    }
  })
})
