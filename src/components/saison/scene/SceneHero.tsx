import type { ReactNode } from 'react'
import Chute from './Chute'
import type { Var } from './types'

// Décor posé sur tout le haut de l'accueil, texte compris (decors :
// hero.DecorHero) : particules fines et lentes, et en bas la bande du sol avec
// ses objets (enfant : Sol ; place réservée sous le texte par
// decors.hero.espaceBas). Sans clic (pointer-events-none).
export default function SceneHero({ particules, children }: { particules: Var[]; children: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      data-anim-saison=""
      className="sz-scene-hero pointer-events-none absolute inset-0 overflow-hidden"
    >
      <Chute particules={particules} />
      {children}
    </div>
  )
}
