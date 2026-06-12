import type { BlogArticle } from '@/lib/blog'
import { creatineAvantOuApresSeance } from './creatine-avant-ou-apres-seance'
import { wheyOuIsolateQuelleDifference } from './whey-ou-isolate-quelle-difference'
import { combienDeProteinesParJour } from './combien-de-proteines-par-jour'
import { eaaOuBcaaLequelPrendre } from './eaa-ou-bcaa-lequel-prendre'
import { quelleWheyChoisirDebutant } from './quelle-whey-choisir-debutant'
import { preWorkoutAvecOuSansCafeine } from './pre-workout-avec-ou-sans-cafeine'
import { priseDeMasseComplementsEtOrganisation } from './prise-de-masse-complements-et-organisation'
import { complementsDebutantMusculation } from './complements-debutant-musculation'

/** Tous les articles publiés (l'ordre d'affichage est géré par date). */
export const BLOG_ARTICLES: BlogArticle[] = [
  creatineAvantOuApresSeance,
  wheyOuIsolateQuelleDifference,
  combienDeProteinesParJour,
  eaaOuBcaaLequelPrendre,
  quelleWheyChoisirDebutant,
  preWorkoutAvecOuSansCafeine,
  priseDeMasseComplementsEtOrganisation,
  complementsDebutantMusculation,
]
