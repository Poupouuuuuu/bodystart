'use client'

import { Suspense, type ComponentProps } from 'react'
import CrossSellV2 from './CrossSellV2'

/** Îlot d'hydratation de « Ça va bien avec » : même principe que BuyBoxIsland. */
export default function CrossSellIsland(props: ComponentProps<typeof CrossSellV2>) {
  return (
    <Suspense fallback={null}>
      <CrossSellV2 {...props} />
    </Suspense>
  )
}
