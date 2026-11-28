// Moyens de paiement, côté serveur : Storefront `shop.paymentSettings`
// (champs vérifiés dans le schéma 2026-10 le 28/11/2026), relus au plus toutes
// les 6 h. En échec (ou sans aucune carte), repli sur les cartes déjà
// annoncées : le site n'affiche jamais un moyen qu'il n'a pas vu.
// Mise en mots : lib/paiement.ts. Utilisé par le pied de page, la FAQ et /stores.

import { unstable_cache } from 'next/cache'
import { shopifyFetch } from './client'
import { moyensPaiement, REGLAGES_REPLI, type MoyensPaiement, type ReglagesPaiement } from '@/lib/paiement'

const GET_PAIEMENT = /* GraphQL */ `
  query MoyensPaiement {
    shop {
      paymentSettings {
        acceptedCardBrands
        supportedDigitalWallets
      }
    }
  }
`

interface Reponse {
  shop: { paymentSettings: { acceptedCardBrands: string[] | null; supportedDigitalWallets: string[] | null } | null }
}

// Une erreur n'est pas mise en cache : la lecture suivante réessaie.
const lireReglages = unstable_cache(
  async (): Promise<ReglagesPaiement> => {
    const data = await shopifyFetch<Reponse>(GET_PAIEMENT)
    const p = data.shop.paymentSettings
    return { cartes: p?.acceptedCardBrands ?? [], portefeuilles: p?.supportedDigitalWallets ?? [] }
  },
  ['moyens-paiement-v1'],
  { revalidate: 6 * 3600 }
)

export async function getMoyensPaiement(): Promise<MoyensPaiement> {
  try {
    const r = await lireReglages()
    return moyensPaiement(r.cartes.length > 0 ? r : REGLAGES_REPLI)
  } catch (err) {
    console.error('[paiement] lecture de paymentSettings en échec :', err)
    return moyensPaiement(REGLAGES_REPLI)
  }
}
