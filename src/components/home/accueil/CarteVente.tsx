'use client'

import { useEffect, useState } from 'react'
import { ProductCardShop } from '@/components/product/ProductCardShop'
import type { ShopifyProduct } from '@/lib/shopify/types'

/**
 * Carte catalogue de l'accueil, avec la pastille d'offre du cadeau d'un
 * palier (« Offerte dès 100 € », lib/paliers) jusqu'à la fin de la période
 * de paliers, même avec la page en cache : premier rendu identique au
 * serveur, puis un effet retire la pastille à l'heure de fin.
 */
export default function CarteVente({
  product,
  pastille,
}: {
  product: ShopifyProduct
  /** Pastille d'offre et fin de la période (ISO, null : sans fin), lib/pastilles-accueil. */
  pastille?: { texte: string; fin: string | null }
}) {
  const [active, setActive] = useState(!!pastille)
  const fin = pastille?.fin

  useEffect(() => {
    if (!fin) return
    const reste = Date.parse(fin) + 1000 - Date.now()
    if (reste <= 0) {
      setActive(false)
      return
    }
    // setTimeout plafonne à ~24 j ; au-delà, la page aura été rechargée.
    if (reste > 24 * 3600 * 1000) return
    const t = setTimeout(() => setActive(false), reste)
    return () => clearTimeout(t)
  }, [fin])

  return <ProductCardShop product={product} pastilleOffre={active ? pastille?.texte : undefined} />
}
