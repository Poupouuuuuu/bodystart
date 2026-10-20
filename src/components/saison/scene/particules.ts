import type { Var } from './types'

interface OptionsChute {
  /** Taille de la plus petite particule et écart entre les 4 tailles (px). */
  taille: number
  pas: number
  opacites: readonly string[]
  /** Durée de chute la plus courte (s), avant le ralenti de la zone (--lent). */
  duree: number
  /** Dérive latérale la plus faible (px). */
  derive: number
  /** Rotation pendant la chute (deg) : 0 pour la neige, un tour ou plus pour les feuilles. */
  tour?: number
  /** Décalage de la suite : deux zones ne montrent pas le même dessin. */
  graine?: number
}

/**
 * Particules d'une zone (scene/Chute) : suite fixe, sans hasard ni heure, donc
 * même HTML côté serveur et navigateur. x, y : place sans animation ; t :
 * taille ; o : opacité ; d : durée de la chute ; r : départ décalé (déjà en
 * chute au chargement) ; dx : dérive ; tour : rotation.
 */
export function particules(n: number, o: OptionsChute): Var[] {
  return Array.from({ length: n }, (_, i) => {
    const k = i + (o.graine ?? 0)
    const sens = i % 2 ? 1 : -1
    const p: Var = {
      '--x': `${(k * 37 + 11) % 100}%`,
      '--y': `${(k * 53 + 7) % 100}%`,
      '--t': `${o.taille + (i % 4) * o.pas}px`,
      '--o': o.opacites[i % o.opacites.length],
      '--d': `${o.duree + (i % 5) * 1.5}s`,
      '--r': `${-((k * 7) % 18)}s`,
      '--dx': `${sens * (o.derive + (i % 4) * 4)}px`,
    }
    if (o.tour) p['--tour'] = `${sens * (o.tour + (i % 3) * 120)}deg`
    return p
  })
}
