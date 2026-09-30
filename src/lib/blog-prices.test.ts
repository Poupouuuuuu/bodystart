import { describe, it, expect, vi } from 'vitest'

// Shopify simulé : un produit multi-formats, un produit absent, un handle qui fait planter l'API.
vi.mock('@/lib/shopify', () => ({
  getProductByHandle: async (handle: string) => {
    if (handle === 'whey-native-protimuscle') {
      return {
        variants: {
          nodes: [
            { price: { amount: '84.9', currencyCode: 'EUR' } },
            { price: { amount: '21.9', currencyCode: 'EUR' } },
          ],
        },
      }
    }
    if (handle === 'shopify-en-panne') throw new Error('502')
    return null
  },
}))

import {
  collectPriceHandles,
  resolvePriceTokens,
  productMinPrice,
  fetchPriceMap,
  withLivePrices,
} from './blog-prices'

const EUR = (s: string) => new RegExp(`^${s.replace(' ', '\\s')}$`) // espace insécable fine de fr-FR

describe('collectPriceHandles', () => {
  it('trouve les handles dans les textes, listes, tableaux et FAQ, sans doublon', () => {
    const article = {
      sections: [
        { h2: 'A', blocks: [{ type: 'p', text: 'La whey à {{prix:whey-native-protimuscle|21,90 €}} et {{prix:iso-zero-100-whey|78,90 €}}.' }] },
        { h2: 'B', blocks: [{ type: 'table', headers: ['Produit', 'Prix'], rows: [['x', '{{prix:cla-2400|22,90 €}}']] }] },
      ],
      faq: [{ q: 'Combien ?', a: 'Environ {{prix:whey-native-protimuscle|21,90 €}}.' }],
    }
    expect(collectPriceHandles(article)).toEqual(['whey-native-protimuscle', 'iso-zero-100-whey', 'cla-2400'])
  })
  it('rien à faire sans jeton', () => {
    expect(collectPriceHandles({ text: 'Compte 30 à 50 € par mois.' })).toEqual([])
  })
})

describe('resolvePriceTokens', () => {
  it('prix connu : remplacé ; inconnu : prix de repli ; le reste du texte est intact', () => {
    const out = resolvePriceTokens(
      { text: 'A {{prix:a|10,00 €}}, B {{prix:b|20,00 €}} et 30 à 50 € par mois.' },
      { a: '12,50 €' }
    )
    expect(out.text).toBe('A 12,50 €, B 20,00 € et 30 à 50 € par mois.')
  })
  it('conserve la structure (tableaux imbriqués) et les valeurs non textuelles', () => {
    const out = resolvePriceTokens({ rows: [['x', '{{prix:a|1,00 €}}']], n: 3, ok: true, nil: null }, { a: '2,00 €' })
    expect(out).toEqual({ rows: [['x', '2,00 €']], n: 3, ok: true, nil: null })
  })
})

describe('productMinPrice', () => {
  it('prix minimum des variantes, formaté en euros', () => {
    const p = productMinPrice({
      variants: { nodes: [{ price: { amount: '84.9', currencyCode: 'EUR' } }, { price: { amount: '21.9', currencyCode: 'EUR' } }] },
    })
    expect(p).toMatch(EUR('21,90 €'))
  })
  it('repli sur priceRange, null si rien', () => {
    expect(productMinPrice({ priceRange: { minVariantPrice: { amount: '9.9', currencyCode: 'EUR' } } })).toMatch(EUR('9,90 €'))
    expect(productMinPrice(null)).toBeNull()
    expect(productMinPrice({ variants: { nodes: [] } })).toBeNull()
  })
})

describe('fetchPriceMap et withLivePrices (Shopify simulé)', () => {
  it('produit trouvé : prix du moment ; absent ou en erreur : pas d’entrée', async () => {
    const map = await fetchPriceMap(['whey-native-protimuscle', 'inconnu', 'shopify-en-panne'])
    expect(Object.keys(map)).toEqual(['whey-native-protimuscle'])
    expect(map['whey-native-protimuscle']).toMatch(EUR('21,90 €'))
  })
  it('article résolu : prix vivant pour le produit trouvé, repli pour les autres, jamais d’exception', async () => {
    const article = {
      sections: [{ h2: 'A', blocks: [{ type: 'p', text: '{{prix:whey-native-protimuscle|19,95 €}} / {{prix:inconnu|5,00 €}} / {{prix:shopify-en-panne|7,00 €}}' }] }],
    }
    const out = await withLivePrices(article)
    expect(out.sections[0].blocks[0].text).toMatch(/^21,90\s€ \/ 5,00 € \/ 7,00 €$/)
  })
  it('sans jeton : renvoie la même valeur, sans appel réseau', async () => {
    const value = { text: 'aucun prix' }
    expect(await withLivePrices(value)).toBe(value)
  })
})
