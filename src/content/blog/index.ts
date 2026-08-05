import type { BlogArticle } from '@/lib/blog'
import { creatineAvantOuApresSeance } from './creatine-avant-ou-apres-seance'
import { wheyOuIsolateQuelleDifference } from './whey-ou-isolate-quelle-difference'
import { combienDeProteinesParJour } from './combien-de-proteines-par-jour'
import { eaaOuBcaaLequelPrendre } from './eaa-ou-bcaa-lequel-prendre'
import { quelleWheyChoisirDebutant } from './quelle-whey-choisir-debutant'
import { preWorkoutAvecOuSansCafeine } from './pre-workout-avec-ou-sans-cafeine'
import { priseDeMasseComplementsEtOrganisation } from './prise-de-masse-complements-et-organisation'
import { complementsDebutantMusculation } from './complements-debutant-musculation'
import { creatinePourLesFemmes } from './creatine-pour-les-femmes'
import { complementsApres40Ans } from './complements-apres-40-ans'
import { mieuxDormirRecuperation } from './mieux-dormir-recuperation'
import { proteinesVegetalesMusculation } from './proteines-vegetales-musculation'
import { bruleursDeGraisseCaMarche } from './bruleurs-de-graisse-ca-marche'
import { collageneBienfaitsCommentChoisir } from './collagene-bienfaits-comment-choisir'
import { vitamineDCombienQuandPourquoi } from './vitamine-d-combien-quand-pourquoi'
import { gainerPriseDeMasseCommentChoisir } from './gainer-prise-de-masse-comment-choisir'
import { quandPrendreSaWhey } from './quand-prendre-sa-whey'
import { magnesiumBienfaitsQuelleFormeChoisir } from './magnesium-bienfaits-quelle-forme-choisir'
import { multivitaminesUtileCommentChoisir } from './multivitamines-utile-comment-choisir'
import { commentFaireUneSeche } from './comment-faire-une-seche'

/** Tous les articles publiés (l'ordre d'affichage est géré par date). */
export const BLOG_ARTICLES: BlogArticle[] = [
  commentFaireUneSeche,
  magnesiumBienfaitsQuelleFormeChoisir,
  multivitaminesUtileCommentChoisir,
  vitamineDCombienQuandPourquoi,
  gainerPriseDeMasseCommentChoisir,
  quandPrendreSaWhey,
  proteinesVegetalesMusculation,
  bruleursDeGraisseCaMarche,
  collageneBienfaitsCommentChoisir,
  creatinePourLesFemmes,
  complementsApres40Ans,
  mieuxDormirRecuperation,
  creatineAvantOuApresSeance,
  wheyOuIsolateQuelleDifference,
  combienDeProteinesParJour,
  eaaOuBcaaLequelPrendre,
  quelleWheyChoisirDebutant,
  preWorkoutAvecOuSansCafeine,
  priseDeMasseComplementsEtOrganisation,
  complementsDebutantMusculation,
]
