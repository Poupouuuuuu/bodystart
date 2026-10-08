// Note Google de la boutique, lue dans les métachamps Shopify (server-only).
// Les pages qui l'affichent sont en ISR : la valeur suit leur régénération.

import { cache } from 'react'
import { shopifyFetch } from './client'
import { GOOGLE_RATING, type GoogleRating } from '@/lib/store-info'

const GET_GOOGLE_RATING = /* GraphQL */ `
  query GoogleRating {
    shop {
      note: metafield(namespace: "bodystart", key: "avis_google_note") { value }
      nombre: metafield(namespace: "bodystart", key: "avis_google_nombre") { value }
    }
  }
`

/** Valeurs plausibles seulement (note de 1 à 5, au moins un avis), sinon null. */
export function parseGoogleRating(note?: string | null, nombre?: string | null): GoogleRating | null {
  const value = Number(note)
  const count = Number(nombre)
  if (!note || !Number.isFinite(value) || value < 1 || value > 5) return null
  if (!nombre || !Number.isInteger(count) || count < 1) return null
  return { value: Math.round(value * 10) / 10, count }
}

/**
 * Note et nombre d'avis Google. Repli sur GOOGLE_RATING (store-info) si la
 * lecture échoue ou si un métachamp est vide ou incohérent : la page ne
 * casse jamais pour ça. `cache` : un seul appel par rendu, même si plusieurs
 * sections l'affichent.
 */
export const getGoogleRating = cache(async (): Promise<GoogleRating> => {
  try {
    const data = await shopifyFetch<{
      shop: { note: { value: string } | null; nombre: { value: string } | null }
    }>(GET_GOOGLE_RATING)
    const rating = parseGoogleRating(data.shop.note?.value, data.shop.nombre?.value)
    if (!rating) console.error('[google-rating] métachamps absents ou invalides, valeur de repli')
    return rating ?? GOOGLE_RATING
  } catch (err) {
    console.error('[google-rating] lecture Shopify en échec, valeur de repli :', err)
    return GOOGLE_RATING
  }
})

/** « 4,7 » : format français de la note. */
export const formatRating = (r: GoogleRating) => r.value.toLocaleString('fr-FR')
