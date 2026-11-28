// Variantes d'un produit pour la feuille d'ajout rapide des cartes.
//
// Lues à la demande, au premier appui sur « Choisir » (Storefront, comme le
// panier) : les pages de liste n'envoient que deux variantes par produit, et
// y mettre toutes les variantes de tout le catalogue alourdirait /products
// pour un usage occasionnel. Une requête par produit ouvert, gardée en
// mémoire le temps de la visite ; une erreur n'est pas gardée (nouvel essai).

import { shopifyFetch } from '@/lib/shopify/client'
import type { ShopifyMoney } from '@/lib/shopify/types'

export interface VarianteAjout {
  id: string
  title: string
  availableForSale: boolean
  requiresComponents: boolean | null
  selectedOptions: { name: string; value: string }[]
  price: ShopifyMoney
  compareAtPrice: ShopifyMoney | null
  image: { url: string; altText: string | null } | null
}

export interface ProduitAjout {
  handle: string
  title: string
  options: { name: string; optionValues: { name: string }[] }[]
  variants: VarianteAjout[]
}

const REQUETE = `
  query AjoutRapide($handle: String!) {
    product(handle: $handle) {
      handle
      title
      options(first: 3) {
        name
        optionValues {
          name
        }
      }
      variants(first: 100) {
        nodes {
          id
          title
          availableForSale
          currentlyNotInStock
          requiresComponents
          selectedOptions {
            name
            value
          }
          price {
            amount
            currencyCode
          }
          compareAtPrice {
            amount
            currencyCode
          }
          image {
            url
            altText
          }
        }
      }
    }
  }
`

const enCours = new Map<string, Promise<ProduitAjout | null>>()

export function chargerProduitAjout(handle: string): Promise<ProduitAjout | null> {
  const deja = enCours.get(handle)
  if (deja) return deja
  const promesse = shopifyFetch<{
    product:
      | (Omit<ProduitAjout, 'variants'> & {
          variants: { nodes: (VarianteAjout & { currentlyNotInStock?: boolean | null })[] }
        })
      | null
  }>(REQUETE, { handle })
    // Variante vendable mais à 0 (précommande) : en rupture pour l'ajout rapide.
    .then(({ product }) =>
      product
        ? {
            ...product,
            variants: product.variants.nodes.map(({ currentlyNotInStock, ...v }) => ({
              ...v,
              availableForSale: v.availableForSale && !currentlyNotInStock,
            })),
          }
        : null
    )
    .catch((err) => {
      enCours.delete(handle)
      throw err
    })
  enCours.set(handle, promesse)
  return promesse
}
