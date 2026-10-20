import type { CSSProperties } from 'react'

/** Style en ligne avec variables CSS (--x, --d…), valeurs fixes : même HTML
 * côté serveur et navigateur (jamais de hasard ni d'heure au rendu). */
export type Var = CSSProperties & Record<`--${string}`, string>
