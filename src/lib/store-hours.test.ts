import { describe, it, expect } from 'vitest'
import { formatHeure, heureDeParis, resumeHoraires, statutOuverture, telInternational } from './store-hours'
import { BODY_START_STORES } from './shopify/types'

const hours = BODY_START_STORES.find((s) => s.isActive)!.hours
const nbsp = (s: string) => s.replace(/ /g, ' ')
const statut = (iso: string) => statutOuverture(hours, new Date(iso))

describe('statutOuverture (heure de Paris)', () => {
  it('ouvert en semaine entre 11 h et 19 h (heure d’été, UTC+2)', () => {
    // Jeudi 08/10/2026 14:00 à Paris.
    expect(statut('2026-10-08T12:00:00Z')).toEqual({ ouvert: true, libelle: 'Ouvert maintenant' })
  })

  it('avant l’ouverture : « ouvre à 11 h »', () => {
    expect(statut('2026-10-08T08:00:00Z')).toEqual({ ouvert: false, libelle: `Fermé, ouvre à ${nbsp('11 h')}` })
  })

  it('19 h pile : fermé, ouvre demain', () => {
    expect(statut('2026-10-08T17:00:00Z')).toEqual({ ouvert: false, libelle: `Fermé, ouvre demain à ${nbsp('11 h')}` })
  })

  it('samedi soir et dimanche : rouvre lundi / demain', () => {
    expect(statut('2026-10-10T18:30:00Z').libelle).toBe(`Fermé, ouvre lundi à ${nbsp('11 h')}`)
    expect(statut('2026-10-11T12:00:00Z').libelle).toBe(`Fermé, ouvre demain à ${nbsp('11 h')}`)
  })

  it('heure d’hiver (UTC+1)', () => {
    // Jeudi 05/11/2026 : 10:30 UTC = 11:30 à Paris, 18:30 UTC = 19:30.
    expect(statut('2026-11-05T10:30:00Z').ouvert).toBe(true)
    expect(statut('2026-11-05T18:30:00Z').ouvert).toBe(false)
    expect(heureDeParis(new Date('2026-11-05T10:30:00Z'))).toEqual({ jour: 4, minutes: 11 * 60 + 30 })
  })

  it('aucune plage ouverte : « Fermé »', () => {
    expect(statutOuverture([{ day: 'Lundi', open: 'Fermé', close: 'Fermé' }], new Date('2026-10-08T12:00:00Z'))).toEqual({
      ouvert: false,
      libelle: 'Fermé',
    })
  })
})

describe('résumé et formats', () => {
  it('résumé des horaires de la boutique', () => {
    expect(resumeHoraires(hours)).toEqual([`Du lundi au samedi, ${nbsp('11 h')} à ${nbsp('19 h')}`, 'Fermé le dimanche'])
  })

  it('jours aux horaires différents, jour isolé', () => {
    expect(
      resumeHoraires([
        { day: 'Lundi', open: '10:00', close: '18:30' },
        { day: 'Mardi', open: '11:00', close: '19:00' },
        { day: 'Samedi', open: 'Fermé', close: 'Fermé' },
        { day: 'Dimanche', open: 'Fermé', close: 'Fermé' },
      ])
    ).toEqual([
      `Le lundi, ${nbsp('10 h')} à ${nbsp('18 h 30')}`,
      `Le mardi, ${nbsp('11 h')} à ${nbsp('19 h')}`,
      'Fermé le samedi et le dimanche',
    ])
  })

  it('heures et téléphone', () => {
    expect(formatHeure('11:00')).toBe(nbsp('11 h'))
    expect(formatHeure('09:05')).toBe(nbsp('9 h 05'))
    expect(telInternational('07 61 84 75 80')).toBe('+33761847580')
  })
})
