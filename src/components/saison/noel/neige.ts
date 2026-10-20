import { particules } from '../scene/particules'
import type { Var } from '../scene/types'

// Flocons de la neige qui tombe (haut de l'accueil, frise du pied de page ;
// scene/Chute). Positions fixes (pas de hasard au rendu : même HTML côté
// serveur et navigateur). x, y : place sans animation ; t : taille ; o :
// opacité ; d : durée de la chute ; r : départ décalé (déjà en chute au
// chargement) ; dx : dérive latérale.

const BASE: [number, number, number, number, number, number, number][] = [
  // x %, y %, taille px, opacité, durée s, retard s, dérive px
  [4, 12, 4, 0.9, 13, -2, 18],
  [11, 46, 3, 0.7, 16, -9, -10],
  [18, 24, 5, 0.85, 12, -5, 14],
  [26, 70, 3, 0.6, 18, -13, 8],
  [33, 8, 4, 0.8, 14, -7, -16],
  [41, 54, 3, 0.65, 17, -3, 12],
  [48, 30, 5, 0.9, 12.5, -10, -8],
  [56, 78, 3, 0.6, 15, -6, 16],
  [63, 16, 4, 0.8, 13.5, -12, -14],
  [70, 62, 3, 0.7, 16.5, -1, 10],
  [77, 36, 5, 0.85, 12, -8, -12],
  [84, 84, 3, 0.6, 18, -15, 6],
  [90, 20, 4, 0.8, 14.5, -4, -18],
  [96, 50, 3, 0.65, 15.5, -11, 12],
]

export const FLOCONS: Var[] = BASE.map(([x, y, t, o, d, r, dx]) => ({
  '--x': `${x}%`,
  '--y': `${y}%`,
  '--t': `${t}px`,
  '--o': String(o),
  '--d': `${d}s`,
  '--r': `${r}s`,
  '--dx': `${dx}px`,
}))

/**
 * Neige fine sur tout le haut de l'accueil, texte compris : 26 petits flocons
 * (2 à 3,5 px), assez transparents pour ne pas gêner la lecture.
 */
export const FLOCONS_HERO: Var[] = particules(26, {
  taille: 2,
  pas: 0.5,
  opacites: ['0.55', '0.67', '0.79'],
  duree: 12,
  derive: 8,
})
