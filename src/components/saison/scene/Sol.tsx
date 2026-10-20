import type { ReactNode } from 'react'

// Bande du bas d'une scène (haut de l'accueil, frise du pied de page) : un sol
// ondulé à la couleur du thème (neige, terre de nuit) et les objets posés
// dessus (enfants placés en absolu dans la bande). Décorative.
export default function Sol({
  chemin,
  couleur,
  lisere,
  className,
  classeSol,
  children,
}: {
  /** Tracé du sol dans un repère de 100 × 20, étiré en largeur, fermé par « V20 H0z ». */
  chemin: string
  couleur: string
  /** Couleur d'un liseré sur la crête du sol (trait fin, pas de filtre). */
  lisere?: string
  /** Hauteur de la bande. */
  className: string
  /** Hauteur du sol dans la bande. */
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
        {lisere && (
          <path
            d={chemin.replace(/\s*V20 H0z$/, '')}
            fill="none"
            stroke={lisere}
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
          />
        )}
      </svg>
      {children}
    </div>
  )
}
