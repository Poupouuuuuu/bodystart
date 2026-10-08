'use client'

import { Suspense, type ComponentProps } from 'react'
import BuyBoxV2 from './BuyBoxV2'

/**
 * Îlot d'hydratation de la zone d'achat (08/10/2026).
 *
 * La frontière <Suspense> découpe l'hydratation (React hydrate la zone d'achat
 * dans sa propre tâche, au lieu d'une seule longue tâche sur mobile). Posée
 * dans la page serveur, elle envoyait la zone d'achat dans un bloc caché
 * révélé par un script : sans JS, ni prix, ni bouton, ni galerie. Ici, dans
 * un composant client qui importe BuyBoxV2 directement, le module est déjà
 * chargé quand la frontière se rend côté serveur : elle se termine sur place,
 * le HTML reste visible, et l'hydratation reste découpée.
 */
export default function BuyBoxIsland(props: ComponentProps<typeof BuyBoxV2>) {
  return (
    <Suspense fallback={null}>
      <BuyBoxV2 {...props} />
    </Suspense>
  )
}
