import type { ComponentType } from 'react'
import type { Var } from './types'

// Objets suspendus à un fil depuis le haut d'un bloc (photo du haut de
// l'accueil, sélection de saison) : boules de Noël, chauves-souris et
// araignées d'Halloween. Léger balancement autour de l'attache (scene/css.ts :
// sz-pendu), couleur du fil dans le CSS du thème (.sz-fil). Décoratifs.

export interface Suspendu {
  left: string
  /** Longueur du fil (px). */
  fil: number
  /** Largeur de l'objet (px). */
  taille: number
  /** Variante de l'objet (couleur, forme), lue par le composant Objet du thème. */
  objet: string
  /** Durée et départ du balancement. */
  d: string
  r: string
}

export type ObjetSuspendu = ComponentType<{ objet: string; taille: number }>

export default function Suspendus({
  items,
  Objet,
  className,
}: {
  items: Suspendu[]
  Objet: ObjetSuspendu
  /** Place et taille de la zone (sz-pendus-photo, sz-pendus-section…). */
  className: string
}) {
  return (
    <div aria-hidden="true" data-anim-saison="" className={`pointer-events-none absolute ${className}`}>
      {items.map((s, i) => {
        const style: Var = { left: s.left, '--d': s.d, '--r': s.r }
        return (
          <span key={i} className="sz-pendu absolute top-0 flex flex-col items-center" style={style}>
            <span className="sz-fil block" style={{ height: s.fil }} />
            <Objet objet={s.objet} taille={s.taille} />
          </span>
        )
      })}
    </div>
  )
}
