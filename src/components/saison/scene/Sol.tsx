import type { ReactNode } from 'react'

// Bande du bas d'une scène (haut de l'accueil, frise du pied de page) : un sol
// ondulé à la couleur du thème (neige, terre de nuit) et les objets posés
// dessus (enfants placés en absolu dans la bande). Décorative.
export default function Sol({
  chemin,
  couleur,
  className,
  classeSol,
  children,
}: {
  /** Tracé du sol dans un repère de 100 × 20, étiré en largeur. */
  chemin: string
  couleur: string
  /** Hauteur de la bande. */
  className: string
  /** Hauteur du sol dans la bande, et liseré éventuel. */
  classeSol: string
  children: ReactNode
}) {
  return (
    <div className={`absolute inset-x-0 bottom-0 ${className}`}>
      <svg
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
        className={`absolute inset-x-0 bottom-0 w-full ${classeSol}`}
        focusable="false"
      >
        <path d={chemin} fill={couleur} />
      </svg>
      {children}
    </div>
  )
}
