import { describe, it, expect } from 'vitest'
import { handlesSansFiche } from './composants-sans-fiche'
import type { ShopifyProductVariant } from './types'

const composant = (id: string, handle: string) => ({
  quantity: 1,
  productVariant: { id: `${id}-v`, title: 'x', image: null, product: { id, handle, title: handle, featuredImage: null } },
})

const variante = (...composants: ReturnType<typeof composant>[]) =>
  ({ components: { nodes: composants } }) as unknown as ShopifyProductVariant

// Pack Débutant (19/10/2026) : la whey a une fiche, la créatine PER4M 400 g
// n'est vendue qu'en caisse.
const WHEY = composant('gid://shopify/Product/1', 'whey-native-protimuscle')
const CREATINE = composant('gid://shopify/Product/2', 'creatine-monohydrate-per4m-400-g')

describe('composants sans fiche sur le site', () => {
  it('seuls les produits absents de la réponse Storefront perdent leur lien', () => {
    const variantes = [variante(WHEY, CREATINE), variante(WHEY, CREATINE)]
    expect(handlesSansFiche(variantes, new Set(['gid://shopify/Product/1']))).toEqual([
      'creatine-monohydrate-per4m-400-g',
    ])
  })

  it('tous publiés : aucun ; lot sans composants : aucun', () => {
    const publies = new Set(['gid://shopify/Product/1', 'gid://shopify/Product/2'])
    expect(handlesSansFiche([variante(WHEY, CREATINE)], publies)).toEqual([])
    expect(handlesSansFiche([{} as ShopifyProductVariant], publies)).toEqual([])
  })
})
