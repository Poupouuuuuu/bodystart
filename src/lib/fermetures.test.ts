import { describe, it, expect } from 'vitest'
import {
  FERMETURES_EXCEPTIONNELLES,
  dateDeParis,
  decalerDate,
  estJourFerme,
  fermeturesAVenir,
  horairesSpeciauxJsonLd,
  periodesAnnonce,
} from './fermetures'
import { periodeActive, prochainChangement, cssSaison, type PeriodeSaison } from './saison'
import { statutOuverture } from './store-hours'
import { BODY_START_STORES } from './shopify/types'

const HOURS = BODY_START_STORES[0].hours

describe('fermetures exceptionnelles', () => {
  it('11/11/2026 fermé, bandeau du 10/11 au 11/11 23 h 59 59 à Paris', () => {
    const f = FERMETURES_EXCEPTIONNELLES.find((x) => x.date === '2026-11-11')!
    expect(f.libelle).toBe('mercredi 11 novembre')
    expect(f.bandeau.au).toBe('2026-11-11T22:59:59.000Z')
    expect(f.bandeau.lien).toBe('/livraison')
    expect(f.bandeau.texte).toBe(
      'Boutique fermée exceptionnellement le mercredi 11 novembre · Commandes Click & Collect prêtes jeudi 12/11 dès 11 h'
    )
    expect(f.bandeau.texte).not.toMatch(/[–—]/)
  })

  it('dates de Paris et calendrier', () => {
    expect(dateDeParis(new Date('2026-11-10T23:30:00Z'))).toBe('2026-11-11')
    expect(dateDeParis(new Date('2026-11-11T22:59:59Z'))).toBe('2026-11-11')
    expect(dateDeParis(new Date('2026-11-11T23:00:00Z'))).toBe('2026-11-12')
    expect(decalerDate('2026-11-30', 1)).toBe('2026-12-01')
    expect(estJourFerme('2026-11-11')).toBe(true)
    expect(estJourFerme('2026-11-12')).toBe(false)
  })

  it('bandeau : thème annonce, prioritaire, puis plus rien après le 11/11 23 h 59 59 à Paris', () => {
    const bw: PeriodeSaison = {
      theme: 'black-week', du: '2026-11-01T00:00:00.000Z', au: '2026-11-30T22:59:59.000Z', texte: 'BW', lien: null,
      accent: '#111111', accent2: '#F2C200', texteSurAccent: '#FFFFFF', decor: null,
    }
    const periodes = [bw, ...periodesAnnonce()]
    expect(periodeActive(periodesAnnonce(), new Date('2026-11-10T10:45:00Z'))?.theme).toBe('annonce')
    expect(periodeActive(periodes, new Date('2026-11-11T12:00:00Z'))?.theme).toBe('annonce')
    expect(periodeActive(periodes, new Date('2026-11-11T23:00:00Z'))?.theme).toBe('black-week')
    expect(periodeActive(periodesAnnonce(), new Date('2026-11-11T23:00:00Z'))).toBeNull()
    // Le header rebascule seul à la fin du bandeau
    expect(prochainChangement(periodesAnnonce(), new Date('2026-11-11T12:00:00Z'))?.toISOString()).toBe('2026-11-11T23:00:00.000Z')
    const annonce = periodesAnnonce()[0]
    expect([annonce.accent, annonce.texteSurAccent, annonce.decor]).toEqual(['#2D5A2D', '#FFFFFF', null])
    // Ni badges ni soulignés recolorés
    expect(cssSaison(annonce)).toBe('')
  })

  it('statut : fermé le 11/11, ouvre jeudi à 11 h', () => {
    const nbsp = ' '
    // Mardi 10/11, 20 h à Paris : la réouverture saute le mercredi
    expect(statutOuverture(HOURS, new Date('2026-11-10T19:00:00Z')).libelle).toBe(`Fermé, ouvre jeudi à 11${nbsp}h`)
    // Mercredi 11/11, 14 h à Paris
    expect(statutOuverture(HOURS, new Date('2026-11-11T13:00:00Z'))).toEqual({ ouvert: false, libelle: `Fermé, ouvre demain à 11${nbsp}h` })
    // Jeudi 12/11, 14 h : ouvert
    expect(statutOuverture(HOURS, new Date('2026-11-12T13:00:00Z')).ouvert).toBe(true)
    // Mercredi suivant (18/11) : ouvert comme d'habitude
    expect(statutOuverture(HOURS, new Date('2026-11-18T13:00:00Z')).ouvert).toBe(true)
  })

  it('JSON-LD et /stores : seulement les fermetures du jour ou à venir', () => {
    expect(horairesSpeciauxJsonLd(new Date('2026-11-10T10:00:00Z'))).toEqual([
      { '@type': 'OpeningHoursSpecification', validFrom: '2026-11-11', validThrough: '2026-11-11', opens: '00:00', closes: '00:00' },
    ])
    expect(fermeturesAVenir(new Date('2026-11-11T22:00:00Z')).map((f) => f.date)).toEqual(['2026-11-11'])
    expect(horairesSpeciauxJsonLd(new Date('2026-11-11T23:30:00Z'))).toEqual([])
  })
})
