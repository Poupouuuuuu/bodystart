import { describe, it, expect } from 'vitest'
import {
  REPONSES_VIDES,
  basculerContrainte,
  choisirObjectif,
  etapeAccessible,
  etapePrecedente,
  etapeSuivante,
  etapesQuestions,
  lireEtape,
  lireReponses,
  premiereEtapeIncomplete,
  progression,
  reponsesCompletes,
  trouverObjectif,
  type ReponsesPartielles,
} from './etapes'
import { guide } from './test-utils'

const r = (p: Partial<ReponsesPartielles>): ReponsesPartielles => ({ ...REPONSES_VIDES, ...p })

describe('écrans par objectif', () => {
  it('5 étapes pour « Prendre du muscle » (question sup), 4 sinon, 1 pour « Je ne sais pas encore »', () => {
    expect(etapesQuestions(trouverObjectif(guide, 'muscle'))).toEqual(['objectif', 'seances', 'question', 'contraintes', 'budget'])
    expect(etapesQuestions(trouverObjectif(guide, 'sante'))).toEqual(['objectif', 'seances', 'contraintes', 'budget'])
    expect(etapesQuestions(trouverObjectif(guide, 'ne-sait-pas'))).toEqual(['objectif'])
    expect(etapesQuestions(undefined)).toHaveLength(4)
  })

  it('« Étape x/N » : N = 5 pour muscle, 4 sinon (et avant le choix)', () => {
    expect(progression(guide, REPONSES_VIDES, 'objectif')).toEqual({ x: 1, n: 4 })
    expect(progression(guide, r({ objectif: 'muscle' }), 'question')).toEqual({ x: 3, n: 5 })
    expect(progression(guide, r({ objectif: 'muscle' }), 'budget')).toEqual({ x: 5, n: 5 })
    expect(progression(guide, r({ objectif: 'endurance' }), 'contraintes')).toEqual({ x: 3, n: 4 })
    expect(progression(guide, r({ objectif: 'ne-sait-pas' }), 'objectif')).toEqual({ x: 1, n: 4 })
  })

  it('suivante / précédente', () => {
    const muscle = r({ objectif: 'muscle' })
    expect(etapeSuivante(guide, muscle, 'seances')).toBe('question')
    expect(etapeSuivante(guide, r({ objectif: 'sante' }), 'seances')).toBe('contraintes')
    expect(etapeSuivante(guide, muscle, 'budget')).toBe('resultat')
    expect(etapeSuivante(guide, r({ objectif: 'ne-sait-pas' }), 'objectif')).toBe('resultat')
    expect(etapePrecedente(guide, muscle, 'contraintes')).toBe('question')
    expect(etapePrecedente(guide, muscle, 'resultat')).toBe('budget')
    expect(etapePrecedente(guide, r({ objectif: 'ne-sait-pas' }), 'resultat')).toBe('objectif')
    expect(etapePrecedente(guide, muscle, 'objectif')).toBeNull()
  })
})

describe('écran accessible (rechargement, retour, URL forgée)', () => {
  const complet = r({ objectif: 'muscle', seances: '2-3', questionSup: true, contraintes: [], budget: '40-90' })

  it('écran demandé si tout ce qui précède est répondu', () => {
    expect(etapeAccessible(guide, complet, 'contraintes')).toBe('contraintes')
    expect(etapeAccessible(guide, complet, 'resultat')).toBe('resultat')
  })

  it('sinon le premier écran sans réponse', () => {
    expect(etapeAccessible(guide, r({ objectif: 'muscle' }), 'budget')).toBe('seances')
    expect(etapeAccessible(guide, REPONSES_VIDES, 'resultat')).toBe('objectif')
    expect(etapeAccessible(guide, r({ objectif: 'sante', seances: '0-1' }), 'question')).toBe('contraintes')
    expect(etapeAccessible(guide, complet, null)).toBe('objectif')
  })

  it('premier écran incomplet', () => {
    expect(premiereEtapeIncomplete(guide, r({ objectif: 'muscle', seances: '4-plus' }))).toBe('question')
    expect(premiereEtapeIncomplete(guide, r({ objectif: 'ne-sait-pas' }))).toBe('resultat')
  })
})

describe('réponses', () => {
  it('complètes seulement quand tout le parcours est répondu', () => {
    expect(reponsesCompletes(guide, r({ objectif: 'muscle', seances: '2-3', contraintes: [], budget: 'moins-40' }))).toBeNull()
    expect(
      reponsesCompletes(guide, r({ objectif: 'muscle', seances: '2-3', questionSup: false, contraintes: [], budget: 'moins-40' }))
    ).toEqual({ objectif: 'muscle', seances: '2-3', questionSup: false, contraintes: [], budget: 'moins-40' })
    expect(
      reponsesCompletes(guide, r({ objectif: 'sante', seances: '2-3', questionSup: true, contraintes: ['vegan'], budget: 'plus-90' }))
    ).toMatchObject({ questionSup: null, contraintes: ['vegan'] })
    expect(reponsesCompletes(guide, r({ objectif: 'ne-sait-pas' }))).toMatchObject({ objectif: 'ne-sait-pas' })
    expect(reponsesCompletes(guide, r({ objectif: 'inconnu' }))).toBeNull()
  })

  it('changer d’objectif efface la réponse à la question supplémentaire', () => {
    const avant = r({ objectif: 'muscle', questionSup: true, seances: '2-3' })
    expect(choisirObjectif(avant, 'muscle')).toBe(avant)
    expect(choisirObjectif(avant, 'sante')).toEqual(r({ objectif: 'sante', questionSup: null, seances: '2-3' }))
  })

  it('« Aucune » décoche les autres, et inversement', () => {
    let s = { aucune: false, contraintes: [] as ('sans-lactose' | 'vegan' | 'sans-cafeine')[] }
    s = basculerContrainte(s, 'vegan')
    s = basculerContrainte(s, 'sans-lactose')
    expect(s).toEqual({ aucune: false, contraintes: ['sans-lactose', 'vegan'] })
    s = basculerContrainte(s, 'aucune')
    expect(s).toEqual({ aucune: true, contraintes: [] })
    s = basculerContrainte(s, 'sans-cafeine')
    expect(s).toEqual({ aucune: false, contraintes: ['sans-cafeine'] })
    s = basculerContrainte(s, 'sans-cafeine')
    expect(s).toEqual({ aucune: false, contraintes: [] })
  })
})

describe('lecture défensive', () => {
  it('étape de l’URL', () => {
    expect(lireEtape('budget')).toBe('budget')
    expect(lireEtape('BUDGET')).toBeNull()
    expect(lireEtape(null)).toBeNull()
  })

  it('réponses gardées dans sessionStorage : valeurs inconnues écartées', () => {
    expect(lireReponses(null)).toBeNull()
    expect(
      lireReponses({ objectif: 'muscle', seances: '9-10', questionSup: 'oui', contraintes: ['vegan', 'paleo'], budget: '40-90' })
    ).toEqual({ objectif: 'muscle', seances: null, questionSup: null, contraintes: ['vegan'], budget: '40-90' })
  })
})
