import { describe, it, expect } from 'vitest'
import { sansVariantesMasquees, withCardPrice } from './index'
import type { ShopifyProduct, ShopifyProductVariant } from './types'

const variante = (id: string, titre: string, dispo: boolean, masque = false, prix = '39.9'): ShopifyProductVariant => ({
  id,
  title: titre,
  availableForSale: dispo,
  quantityAvailable: dispo ? 3 : 0,
  price: { amount: prix, currencyCode: 'EUR' },
  compareAtPrice: null,
  masque: masque ? { value: 'true' } : null,
  selectedOptions: titre.split(' / ').map((value, i) => ({ name: i ? 'Format' : 'Saveur', value })),
})

const fiche = (variantes: ShopifyProductVariant[]) =>
  ({ id: 'gid://shopify/Product/1', handle: 'whey-native-protimuscle', title: 'Whey Native Protimuscle', variants: { nodes: variantes } }) as unknown as ShopifyProduct

describe('fiche produit : variantes masquées', () => {
  it('les 500 g arrêtés et épuisés disparaissent de la fiche (sélecteur, ?variant=, JSON-LD), le Matcha en stock reste', () => {
    const p = fiche([
      variante('v1', 'Chocolat / 1 kg', true),
      variante('v2', 'Fraise / 500 g', false, true, '23.9'),
      variante('v3', 'Choco-cookie / 500 g', false, true, '23.9'),
      variante('v4', 'Matcha Latte / 500 g', true, true, '23.9'),
      variante('v5', 'Vanille / 1 kg', false), // simple rupture : reste visible
    ])
    const vue = withCardPrice(sansVariantesMasquees(p))
    expect(vue.variants.nodes.map((v) => v.id)).toEqual(['v1', 'v4', 'v5'])
  })

  it('sans metafield : fiche inchangée', () => {
    const p = fiche([variante('v1', 'Chocolat / 1 kg', true), variante('v2', 'Fraise / 500 g', false)])
    expect(sansVariantesMasquees(p).variants.nodes).toHaveLength(2)
  })
})
