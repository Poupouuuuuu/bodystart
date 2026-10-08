// Lecture et validation du metafield boutique `bodystart.guide_conseil`.
//
// Le JSON est écrit à la main dans l'admin Shopify : on le valide entièrement
// (types, références entre objectifs et produits) avant de s'en servir. Un
// guide invalide n'est jamais utilisé à moitié : `parseGuide` lève une erreur
// et la page /conseil affiche sa version de repli.

import { z } from 'zod'
import { extraireMessage, messagesParObjectif } from './moteur'
import { BUDGETS, type Guide, type Objectif, type ParcoursParBudget } from './types'

const emplacementSchema = z.object({
  role: z.enum(['essentiel', 'complement']),
  candidats: z.array(z.string().min(1)).min(1),
})

const parcoursParBudgetSchema = z.object({
  'moins-40': z.array(emplacementSchema),
  '40-90': z.array(emplacementSchema),
  'plus-90': z.array(emplacementSchema),
})

const produitSchema = z.object({
  handle: z.string().min(1),
  format: z.string(),
  pourquoi: z.string().min(1),
})

// Les champs inconnus (dont `note`, notes internes) sont écartés par zod.
const objectifSchema = z.object({
  libelle: z.string().min(1),
  question_sup: z
    .object({
      cle: z.string().min(1),
      texte: z.string().min(1),
      oui: z.string().min(1),
      non: z.string().min(1),
    })
    .optional(),
  parcours: z.record(z.string(), parcoursParBudgetSchema).optional(),
  resultat: z.literal('boutique').optional(),
  texte: z.string().min(1).optional(),
  suggestions: z.array(z.string().min(1)).optional(),
})

const guideSchema = z.object({
  version: z.number(),
  // Règles : textes descriptifs (et la liste des budgets) ; seuls les messages entre « » servent.
  regles: z.record(z.string(), z.unknown()).default({}),
  produits: z.record(z.string(), produitSchema),
  objectifs: z.record(z.string(), objectifSchema),
})

const texte = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined)

export class GuideInvalideError extends Error {
  constructor(message: string) {
    super(`[guide_conseil] ${message}`)
    this.name = 'GuideInvalideError'
  }
}

/** Valide le guide (valeur brute du metafield, chaîne JSON ou objet). Lève GuideInvalideError. */
export function parseGuide(brut: unknown): Guide {
  let data: unknown = brut
  if (typeof brut === 'string') {
    try {
      data = JSON.parse(brut)
    } catch {
      throw new GuideInvalideError('JSON illisible')
    }
  }

  const parsed = guideSchema.safeParse(data)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    throw new GuideInvalideError(`${issue?.path.join('.') || 'racine'} : ${issue?.message ?? 'invalide'}`)
  }
  const g = parsed.data
  const produitExiste = (cle: string) => Object.prototype.hasOwnProperty.call(g.produits, cle)
  const verifierCles = (cles: string[], ou: string) => {
    for (const cle of cles) {
      if (!produitExiste(cle)) throw new GuideInvalideError(`${ou} : produit inconnu « ${cle} »`)
    }
  }

  const objectifs: Objectif[] = []
  for (const [cle, o] of Object.entries(g.objectifs)) {
    if (o.resultat === 'boutique') {
      if (!o.texte) throw new GuideInvalideError(`objectifs.${cle} : texte manquant`)
      const suggestions = o.suggestions ?? []
      verifierCles(suggestions, `objectifs.${cle}.suggestions`)
      objectifs.push({ type: 'boutique', cle, libelle: o.libelle, texte: o.texte, suggestions })
      continue
    }

    const parcours = (o.parcours ?? {}) as Record<string, ParcoursParBudget>
    if (!parcours.standard) throw new GuideInvalideError(`objectifs.${cle} : parcours standard manquant`)
    const qs = o.question_sup ?? null
    if (qs) {
      for (const nom of [qs.oui, qs.non]) {
        if (!parcours[nom]) throw new GuideInvalideError(`objectifs.${cle} : parcours « ${nom} » manquant`)
      }
    }
    for (const [nom, parBudget] of Object.entries(parcours)) {
      for (const budget of BUDGETS) {
        parBudget[budget].forEach((e, i) =>
          verifierCles(e.candidats, `objectifs.${cle}.parcours.${nom}.${budget}[${i}]`)
        )
      }
    }
    objectifs.push({ type: 'parcours', cle, libelle: o.libelle, questionSup: qs, parcours })
  }
  if (objectifs.length === 0) throw new GuideInvalideError('aucun objectif')

  return {
    version: g.version,
    produits: g.produits,
    objectifs,
    messages: {
      frequence01: extraireMessage(texte(g.regles.frequence_0_1)),
      sansLactose: extraireMessage(texte(g.regles.sans_lactose)),
      vegan: extraireMessage(texte(g.regles.vegan)),
      veganParObjectif: messagesParObjectif(texte(g.regles.vegan), objectifs.map((o) => o.cle)),
    },
  }
}
