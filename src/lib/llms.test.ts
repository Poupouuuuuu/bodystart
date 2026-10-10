import { describe, it, expect } from 'vitest'
import { buildLlmsTxt, euros, isLlmsEligible, type LlmsProduct } from './llms'

const price = (amount: string, from = false) => ({
  price: { amount, currencyCode: 'EUR' },
  compareAt: null,
  discountPct: null,
  from,
})
const p = (over: Partial<LlmsProduct>): LlmsProduct => ({
  title: 'Produit',
  handle: 'produit',
  vendor: 'Nutrimuscle',
  productType: 'Protéines',
  availableForSale: true,
  createdAt: '2026-01-01T00:00:00Z',
  cardPrice: price('23.9', true),
  ...over,
})

const POOL: LlmsProduct[] = [
  p({ title: 'Whey Native Protimuscle', handle: 'whey-native-protimuscle' }),
  p({ title: 'Micronized Creatine Monohydrate', handle: 'creatine-dedicated', vendor: 'Dedicated', productType: 'Créatine', cardPrice: price('36.9'), createdAt: '2026-10-01T00:00:00Z' }),
  p({ title: 'Créatine FN', handle: 'creatine-fn', vendor: 'French Nutrition', productType: 'Créatine' }),
  p({ title: 'Iso Zero', handle: 'iso-zero', vendor: 'Eric Favre' }),
  p({ title: 'Pump', handle: 'pump', vendor: 'Warrior', productType: 'Pré-workout' }),
  p({ title: 'Fat Burner', handle: 'fat-burner', vendor: 'DY Nutrition', productType: 'Brûleur' }),
  p({ title: 'Pack Séance', handle: 'pack-seance', productType: 'Pack' }),
  p({ title: 'Épuisé', handle: 'epuise', availableForSale: false }),
  p({ title: 'Shaker 700 ml', handle: 'shaker', vendor: 'Skill Nutrition', productType: 'Accessoires', tags: ['shaker'], cardPrice: price('6.9') }),
]

describe('llms.txt', () => {
  const txt = buildLlmsTxt(POOL, 'https://bodystart-nutrition.fr/')

  it('ne liste que les produits en vente, hors marques exclues, réserve et packs', () => {
    expect(POOL.filter(isLlmsEligible).map((x) => x.handle)).toEqual(['whey-native-protimuscle', 'creatine-dedicated', 'shaker'])
    for (const h of ['creatine-fn', 'iso-zero', 'pump', 'fat-burner', 'pack-seance', 'epuise']) {
      expect(txt).not.toContain(`/products/${h})`)
    }
  })

  it('prix réel, « dès » quand les variantes diffèrent, URL du site', () => {
    expect(txt).toContain('- [Whey Native Protimuscle (Nutrimuscle)](https://bodystart-nutrition.fr/products/whey-native-protimuscle): dès 23,90 €')
    expect(txt).toContain('- [Micronized Creatine Monohydrate (Dedicated)](https://bodystart-nutrition.fr/products/creatine-dedicated): 36,90 €')
  })

  it('produits rangés sous leur catégorie, le reste à part', () => {
    expect(txt.indexOf('### Protéines')).toBeLessThan(txt.lastIndexOf('whey-native-protimuscle): dès'))
    expect(txt.indexOf('### Boissons, snacks et accessoires')).toBeLessThan(txt.lastIndexOf('/products/shaker'))
  })

  it('nouveautés : la plus récente en premier', () => {
    const section = txt.slice(txt.indexOf('## Nouveautés'), txt.indexOf('## Produits en stock'))
    expect(section.indexOf('creatine-dedicated')).toBeLessThan(section.indexOf('whey-native-protimuscle'))
  })

  it('pas de catégorie de la réserve, ni de marque en arrêt, ni de tiret long', () => {
    expect(txt).not.toContain('/categories/pre-workout')
    expect(txt).not.toContain('/categories/bruleurs')
    expect(txt).not.toContain('/categories/boosters')
    expect(txt).not.toContain('French Nutrition')
    expect(txt).not.toMatch(/[—–]/)
    expect(txt).toContain('[Parrainage](https://bodystart-nutrition.fr/parrainage)')
    expect(txt).toContain('[Guide conseil](https://bodystart-nutrition.fr/conseil)')
  })

  it('sans produits (Shopify indisponible au build) : pas de section produits', () => {
    const vide = buildLlmsTxt([], 'https://bodystart-nutrition.fr')
    expect(vide).not.toContain('## Produits en stock')
    expect(vide).toContain('## Guides')
  })

  it('format des euros', () => {
    expect(euros('2.9')).toBe('2,90 €')
  })
})
