import type { ReactNode } from 'react'
import Chute from './Chute'
import Guirlande from './Guirlande'
import type { Var } from './types'

// Frise du pied de page d'un décor « scène » : ciel du thème (`fond`, plus
// `ciel` pour la lune ou les étoiles), particules qui tombent, guirlande en
// haut et bande du sol en bas (enfant : Sol). Décorative.
export default function Frise({
  fond,
  particules,
  ciel,
  children,
}: {
  fond: string
  particules: Var[]
  ciel?: ReactNode
  children: ReactNode
}) {
  return (
    <div aria-hidden="true" data-anim-saison="" className={`sz-frise relative h-[104px] overflow-hidden md:h-[136px] ${fond}`}>
      {ciel}
      <Chute particules={particules} />
      <Guirlande className="absolute inset-x-0 top-1" />
      {children}
    </div>
  )
}
