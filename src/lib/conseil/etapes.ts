// Enchaînement des écrans du guide /conseil (fonctions pures, testées).
//
// Une question par écran. Le nombre d'étapes dépend de l'objectif : 5 quand
// il a une question supplémentaire (« Prendre du muscle »), 4 sinon, 1 pour
// « Je ne sais pas encore » (résultat boutique direct). L'étape courante est
// écrite dans l'URL (?etape=<nom>) pour la mesure ; les contraintes, elles,
// ne sortent jamais de l'état du navigateur.

import {
  BUDGETS,
  CONTRAINTES,
  SEANCES,
  type Budget,
  type Contrainte,
  type Guide,
  type Objectif,
  type Reponses,
  type Seances,
} from './types'

export type Etape = 'objectif' | 'seances' | 'question' | 'contraintes' | 'budget' | 'resultat'

export const ETAPES: readonly Etape[] = ['objectif', 'seances', 'question', 'contraintes', 'budget', 'resultat']

export interface ReponsesPartielles {
  objectif: string | null
  seances: Seances | null
  questionSup: boolean | null
  /** null = écran pas encore validé ; [] = « Aucune ». */
  contraintes: Contrainte[] | null
  budget: Budget | null
}

export const REPONSES_VIDES: ReponsesPartielles = {
  objectif: null,
  seances: null,
  questionSup: null,
  contraintes: null,
  budget: null,
}

export function trouverObjectif(guide: Guide, cle: string | null | undefined): Objectif | undefined {
  return cle ? guide.objectifs.find((o) => o.cle === cle) : undefined
}

/** Écrans de questions pour un objectif (sans le résultat). Objectif inconnu : cas général à 4 étapes. */
export function etapesQuestions(objectif: Objectif | undefined): Etape[] {
  if (objectif?.type === 'boutique') return ['objectif']
  if (objectif?.questionSup) return ['objectif', 'seances', 'question', 'contraintes', 'budget']
  return ['objectif', 'seances', 'contraintes', 'budget']
}

function repondu(etape: Etape, r: ReponsesPartielles): boolean {
  switch (etape) {
    case 'objectif':
      return r.objectif !== null
    case 'seances':
      return r.seances !== null
    case 'question':
      return r.questionSup !== null
    case 'contraintes':
      return r.contraintes !== null
    case 'budget':
      return r.budget !== null
    default:
      return false
  }
}

/** Premier écran sans réponse ; « resultat » si tout est répondu. */
export function premiereEtapeIncomplete(guide: Guide, r: ReponsesPartielles): Etape {
  const etapes = etapesQuestions(trouverObjectif(guide, r.objectif))
  return etapes.find((e) => !repondu(e, r)) ?? 'resultat'
}

/**
 * Écran réellement affichable : celui demandé s'il fait partie du parcours et
 * que tout ce qui le précède est répondu, sinon le premier écran incomplet
 * (rechargement de page, retour arrière sur un écran devenu hors parcours…).
 */
export function etapeAccessible(guide: Guide, r: ReponsesPartielles, demandee: Etape | null): Etape {
  const premiere = premiereEtapeIncomplete(guide, r)
  if (!demandee) return 'objectif'
  if (demandee === 'resultat') return premiere
  const etapes = etapesQuestions(trouverObjectif(guide, r.objectif))
  const i = etapes.indexOf(demandee)
  if (i === -1) return premiere
  const precedentesOk = etapes.slice(0, i).every((e) => repondu(e, r))
  return precedentesOk ? demandee : premiere
}

/** Écran suivant dans le parcours de l'objectif choisi. */
export function etapeSuivante(guide: Guide, r: ReponsesPartielles, courante: Etape): Etape {
  const etapes = etapesQuestions(trouverObjectif(guide, r.objectif))
  const i = etapes.indexOf(courante)
  return i === -1 || i === etapes.length - 1 ? 'resultat' : etapes[i + 1]
}

/** Écran précédent (null sur le premier). */
export function etapePrecedente(guide: Guide, r: ReponsesPartielles, courante: Etape): Etape | null {
  const etapes = etapesQuestions(trouverObjectif(guide, r.objectif))
  if (courante === 'resultat') return etapes[etapes.length - 1]
  const i = etapes.indexOf(courante)
  return i > 0 ? etapes[i - 1] : null
}

/** « Étape x/N » : position et total pour l'objectif courant (4 tant qu'il n'est pas choisi). */
export function progression(guide: Guide, r: ReponsesPartielles, courante: Etape): { x: number; n: number } {
  const etapes = etapesQuestions(trouverObjectif(guide, r.objectif))
  const n = etapes.length < 4 ? 4 : etapes.length
  return { x: Math.max(1, etapes.indexOf(courante) + 1), n }
}

/** Réponses complètes pour le moteur, ou null s'il en manque. */
export function reponsesCompletes(guide: Guide, r: ReponsesPartielles): Reponses | null {
  const objectif = trouverObjectif(guide, r.objectif)
  if (!objectif) return null
  if (objectif.type === 'boutique') {
    // Le moteur n'utilise que l'objectif sur ce chemin.
    return { objectif: objectif.cle, seances: '2-3', questionSup: null, contraintes: [], budget: 'plus-90' }
  }
  if (!r.seances || !r.budget || r.contraintes === null) return null
  if (objectif.questionSup && r.questionSup === null) return null
  return {
    objectif: objectif.cle,
    seances: r.seances,
    questionSup: objectif.questionSup ? r.questionSup : null,
    contraintes: r.contraintes,
    budget: r.budget,
  }
}

/** Changer d'objectif efface la réponse à la question supplémentaire (elle lui est propre). */
export function choisirObjectif(r: ReponsesPartielles, cle: string): ReponsesPartielles {
  return r.objectif === cle ? r : { ...r, objectif: cle, questionSup: null }
}

/**
 * Coche ou décoche une option de l'écran contraintes. « Aucune » ([] côté
 * réponses) décoche les autres, et cocher une contrainte retire « Aucune ».
 */
export function basculerContrainte(
  selection: { aucune: boolean; contraintes: Contrainte[] },
  option: Contrainte | 'aucune'
): { aucune: boolean; contraintes: Contrainte[] } {
  if (option === 'aucune') return { aucune: !selection.aucune, contraintes: [] }
  const coche = selection.contraintes.includes(option)
  const contraintes = coche
    ? selection.contraintes.filter((c) => c !== option)
    : CONTRAINTES.filter((c) => c === option || selection.contraintes.includes(c))
  return { aucune: false, contraintes }
}

// ─── Lecture défensive (URL, sessionStorage) ─────────────────

export function lireEtape(v: string | null | undefined): Etape | null {
  return v && (ETAPES as readonly string[]).includes(v) ? (v as Etape) : null
}

/** Relit des réponses gardées dans sessionStorage (format inconnu ou abîmé : null). */
export function lireReponses(brut: unknown): ReponsesPartielles | null {
  if (!brut || typeof brut !== 'object') return null
  const o = brut as Record<string, unknown>
  const objectif = typeof o.objectif === 'string' ? o.objectif : null
  const seances = (SEANCES as readonly unknown[]).includes(o.seances) ? (o.seances as Seances) : null
  const budget = (BUDGETS as readonly unknown[]).includes(o.budget) ? (o.budget as Budget) : null
  const questionSup = typeof o.questionSup === 'boolean' ? o.questionSup : null
  const contraintes = Array.isArray(o.contraintes)
    ? CONTRAINTES.filter((c) => (o.contraintes as unknown[]).includes(c))
    : null
  return { objectif, seances, questionSup, contraintes, budget }
}
