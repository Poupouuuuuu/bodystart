'use client'

// Émet l'événement GA4 view_item au montage de la fiche produit.
// No-op tant que la mesure d'audience n'est pas consentie (gtag absent).

import { useEffect } from 'react'
import { gaViewItem } from '@/lib/analytics'

interface Props {
  itemId: string
  itemName: string
  price?: number
  brand?: string
}

export default function TrackViewItem({ itemId, itemName, price, brand }: Props) {
  useEffect(() => {
    gaViewItem({ item_id: itemId, item_name: itemName, price, item_brand: brand })
  }, [itemId, itemName, price, brand])
  return null
}
