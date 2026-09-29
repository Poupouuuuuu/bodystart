'use client'

// Émet GA4 view_item et Meta ViewContent pour la variante vue à l'ouverture
// de la fiche. Monté par BuyBoxV2 une fois ?variant= (pubs Meta) appliqué.
// Chacun est un no-op tant que sa catégorie de cookies n'est pas acceptée.
// Arrivée depuis une pub : si la personne accepte la publicité sur la fiche
// même, ViewContent part à ce moment-là (une seule fois par fiche affichée).

import { useEffect } from 'react'
import { gaViewItem } from '@/lib/analytics'
import { metaViewContent } from '@/lib/meta-pixel'
import { CONSENT_EVENT } from '@/lib/consent'

interface Props {
  itemId: string
  itemName: string
  price?: number
  brand?: string
  /** GID Shopify de la variante affichée : son ID numérique est l'ID du catalogue Meta. */
  variantId?: string
  category?: string
}

export default function TrackViewItem({ itemId, itemName, price, brand, variantId, category }: Props) {
  useEffect(() => {
    gaViewItem({ item_id: itemId, item_name: itemName, price, item_brand: brand })
  }, [itemId, itemName, price, brand])

  useEffect(() => {
    if (!variantId) return
    const item = { variantId, name: itemName, price, category }
    let sent = metaViewContent(item) !== null
    const onConsent = () => {
      if (!sent) sent = metaViewContent(item) !== null
    }
    window.addEventListener(CONSENT_EVENT, onConsent)
    return () => window.removeEventListener(CONSENT_EVENT, onConsent)
  }, [variantId, itemName, price, category])

  return null
}
