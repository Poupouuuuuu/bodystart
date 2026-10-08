import { describe, it, expect } from 'vitest'
import { GuideInvalideError, parseGuide } from './guide'
import { GUIDE_BRUT } from './test-utils'

const copie = () => structuredClone(GUIDE_BRUT) as unknown as Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

describe('parseGuide', () => {
  it('accepte le metafield réel (chaîne JSON ou objet), objectifs dans l’ordre', () => {
    for (const brut of [GUIDE_BRUT, JSON.stringify(GUIDE_BRUT)]) {
      const g = parseGuide(brut)
      expect(g.objectifs.map((o) => o.cle)).toEqual(['muscle', 'affiner', 'endurance', 'recuperation', 'sante', 'ne-sait-pas'])
      expect(Object.keys(g.produits)).toHaveLength(19)
    }
  })

  it('garde les libellés et la question supplémentaire ; écarte les notes internes et le texte des règles', () => {
    const g = parseGuide(GUIDE_BRUT)
    const muscle = g.objectifs[0]
    expect(muscle).toMatchObject({
      type: 'parcours',
      libelle: 'Prendre du muscle',
      questionSup: { texte: 'Tu as du mal à prendre du poids ?', oui: 'masse', non: 'standard' },
    })
    expect(g.objectifs.find((o) => o.cle === 'ne-sait-pas')).toMatchObject({ type: 'boutique', suggestions: ['protimuscle1', 'creatine', 'crunch'] })
    const serialise = JSON.stringify(g)
    expect(serialise).not.toContain('"note"')
    expect(serialise).not.toContain('Pas de brûleur')
    expect(serialise).not.toContain('allégations autorisées')
  })

  it('refuse un JSON illisible', () => {
    expect(() => parseGuide('{pas du json')).toThrow(GuideInvalideError)
  })

  it('refuse un candidat qui ne correspond à aucun produit', () => {
    const g = copie()
    g.objectifs.sante.parcours.standard['moins-40'][0].candidats = ['inexistant']
    expect(() => parseGuide(g)).toThrow(/produit inconnu « inexistant »/)
  })

  it('refuse un budget manquant, un rôle inconnu, un parcours de question manquant', () => {
    const sansBudget = copie()
    delete sansBudget.objectifs.endurance.parcours.standard['plus-90']
    expect(() => parseGuide(sansBudget)).toThrow(GuideInvalideError)

    const role = copie()
    role.objectifs.endurance.parcours.standard['40-90'][1].role = 'bonus'
    expect(() => parseGuide(role)).toThrow(GuideInvalideError)

    const masse = copie()
    delete masse.objectifs.muscle.parcours.masse
    expect(() => parseGuide(masse)).toThrow(/parcours « masse » manquant/)
  })

  it('refuse un objectif boutique sans texte, une suggestion inconnue, un produit sans handle', () => {
    const texte = copie()
    delete texte.objectifs['ne-sait-pas'].texte
    expect(() => parseGuide(texte)).toThrow(/texte manquant/)

    const suggestion = copie()
    suggestion.objectifs['ne-sait-pas'].suggestions = ['protimuscle1', 'fantome']
    expect(() => parseGuide(suggestion)).toThrow(/fantome/)

    const produit = copie()
    produit.produits.creatine.handle = ''
    expect(() => parseGuide(produit)).toThrow(GuideInvalideError)
  })

  it('messages absents si une règle disparaît (pas d’erreur)', () => {
    const g = copie()
    delete g.regles.vegan
    expect(parseGuide(g).messages.vegan).toBeNull()
  })
})
