import { describe, it, expect } from 'vitest'
import {
  getExpectedComponentProductIds,
  isVariantComplete,
  getCompleteBundleVariants,
  pickInitialBundleVariant,
  buildBundleAxes,
  variantOptionValue,
  isBundleOptionAvailable,
  resolveBundleVariantOnChange,
} from './bundle'
import type { ShopifyProductVariant } from './types'

/**
 * Fixture inspirée du vrai "Pack Sèche" (Shopify Bundles) :
 *   - Sub Zero Whey Isolate : Saveur (vanille | chocolate-muffin) × Poids (810g | 2kg)
 *   - L-Carnitine Pro Zero : Saveur (Tropical)
 *   - CLA 2400 : composant fixe (pas d'option de bundle)
 *
 * Piège : Sub Zero "chocolate-muffin" n'existe QU'EN 2kg. Les variantes de
 * bundle chocolate-muffin/810g existent quand même mais SANS composant
 * Sub Zero (incomplètes). Prix : 810g = 74.90, 2kg = 114.90.
 */
const SUBZERO = 'gid://shopify/Product/SUBZERO'
const CARNI = 'gid://shopify/Product/CARNI'
const CLA = 'gid://shopify/Product/CLA'

function mkVariant(
  id: string,
  price: string,
  flavor: string,
  weight: string,
  opts: { subzeroPresent: boolean }
): ShopifyProductVariant {
  const components = [
    ...(opts.subzeroPresent
      ? [
          {
            quantity: 1,
            productVariant: {
              id: `v-sz-${flavor}-${weight}`,
              title: `${flavor} / ${weight}`,
              image: null,
              product: {
                id: SUBZERO,
                handle: 'sub-zero-whey-isolate',
                title: 'Sub Zero Whey Isolate',
                featuredImage: null,
                metafields: [],
              },
            },
          },
        ]
      : []),
    {
      quantity: 1,
      productVariant: {
        id: 'v-carni-tropical',
        title: 'Tropical',
        image: null,
        product: {
          id: CARNI,
          handle: 'l-carnitine-pro-zero-liquide',
          title: 'L-Carnitine Pro Zero - Liquide',
          featuredImage: null,
          metafields: [{ namespace: 'custom', key: 'format', value: '500 ml', type: 'single_line_text_field' }],
        },
      },
    },
    {
      quantity: 1,
      productVariant: {
        id: 'v-cla',
        title: '120 capsules',
        image: null,
        product: {
          id: CLA,
          handle: 'cla-2400',
          title: 'CLA 2400',
          featuredImage: null,
          metafields: [],
        },
      },
    },
  ]
  return {
    id,
    title: `${flavor} / ${weight}`,
    availableForSale: true,
    quantityAvailable: 10,
    price: { amount: price, currencyCode: 'EUR' },
    compareAtPrice: null,
    selectedOptions: [
      { name: 'Sub Zero Whey Isolate (Saveur)', value: flavor },
      { name: 'Sub Zero Whey Isolate (Poids)', value: weight },
      { name: 'L-Carnitine Pro Zero - Liquide (Saveur)', value: 'Tropical' },
    ],
    requiresComponents: true,
    components: { nodes: components },
  }
}

// 4 combinaisons saveur×poids, mais chocolate-muffin/810g est incomplète (pas de Sub Zero)
const VARIANTS: ShopifyProductVariant[] = [
  mkVariant('b-van-810', '74.90', 'vanille', '810g', { subzeroPresent: true }),
  mkVariant('b-van-2kg', '114.90', 'vanille', '2kg', { subzeroPresent: true }),
  mkVariant('b-cm-810', '74.90', 'chocolate-muffin', '810g', { subzeroPresent: false }), // INCOMPLÈTE
  mkVariant('b-cm-2kg', '114.90', 'chocolate-muffin', '2kg', { subzeroPresent: true }),
]

const SAVEUR = 'Sub Zero Whey Isolate (Saveur)'
const POIDS = 'Sub Zero Whey Isolate (Poids)'

describe('completeness des variantes de bundle', () => {
  it('détecte les produits composants attendus (union)', () => {
    const ids = getExpectedComponentProductIds(VARIANTS)
    expect(ids).toContain(SUBZERO)
    expect(ids).toContain(CARNI)
    expect(ids).toContain(CLA)
  })

  it('marque chocolate-muffin/810g comme incomplète (Sub Zero manquant)', () => {
    const expected = getExpectedComponentProductIds(VARIANTS)
    const cm810 = VARIANTS.find((v) => v.id === 'b-cm-810')!
    const van810 = VARIANTS.find((v) => v.id === 'b-van-810')!
    expect(isVariantComplete(cm810, expected)).toBe(false)
    expect(isVariantComplete(van810, expected)).toBe(true)
  })

  it('getCompleteBundleVariants exclut la combinaison cassée', () => {
    const complete = getCompleteBundleVariants(VARIANTS)
    expect(complete.map((v) => v.id).sort()).toEqual(['b-cm-2kg', 'b-van-2kg', 'b-van-810'])
  })

  it('pickInitialBundleVariant renvoie une variante complète', () => {
    const init = pickInitialBundleVariant(VARIANTS)
    expect(init.id).not.toBe('b-cm-810')
    expect(init.availableForSale).toBe(true)
  })
})

describe('axes de sélecteurs', () => {
  const complete = getCompleteBundleVariants(VARIANTS)
  const axes = buildBundleAxes(complete)

  it('construit un axe par option nommée du bundle', () => {
    const names = axes.map((a) => a.name)
    expect(names).toContain(SAVEUR)
    expect(names).toContain(POIDS)
    expect(names).toContain('L-Carnitine Pro Zero - Liquide (Saveur)')
  })

  it('inclut chocolate-muffin comme saveur (existe en 2kg)', () => {
    const saveur = axes.find((a) => a.name === SAVEUR)!
    expect(saveur.values).toContain('vanille')
    expect(saveur.values).toContain('chocolate-muffin')
  })
})

describe('dépendance entre options (poids ⇒ saveur)', () => {
  const complete = getCompleteBundleVariants(VARIANTS)
  const axes = buildBundleAxes(complete)

  it('810g sélectionné : chocolate-muffin indisponible, vanille disponible', () => {
    const selection = { [SAVEUR]: 'vanille', [POIDS]: '810g', 'L-Carnitine Pro Zero - Liquide (Saveur)': 'Tropical' }
    expect(isBundleOptionAvailable(complete, axes, selection, SAVEUR, 'vanille')).toBe(true)
    expect(isBundleOptionAvailable(complete, axes, selection, SAVEUR, 'chocolate-muffin')).toBe(false)
  })

  it('chocolate-muffin sélectionné : 810g indisponible, 2kg disponible', () => {
    const selection = { [SAVEUR]: 'chocolate-muffin', [POIDS]: '2kg', 'L-Carnitine Pro Zero - Liquide (Saveur)': 'Tropical' }
    expect(isBundleOptionAvailable(complete, axes, selection, POIDS, '2kg')).toBe(true)
    expect(isBundleOptionAvailable(complete, axes, selection, POIDS, '810g')).toBe(false)
  })

  it('vanille : 810g ET 2kg disponibles', () => {
    const selection = { [SAVEUR]: 'vanille', [POIDS]: '810g', 'L-Carnitine Pro Zero - Liquide (Saveur)': 'Tropical' }
    expect(isBundleOptionAvailable(complete, axes, selection, POIDS, '810g')).toBe(true)
    expect(isBundleOptionAvailable(complete, axes, selection, POIDS, '2kg')).toBe(true)
  })
})

describe('résolution de variante + prix qui suit la sélection', () => {
  const complete = getCompleteBundleVariants(VARIANTS)
  const axes = buildBundleAxes(complete)

  it('changer le poids 810g→2kg garde la saveur et met à jour le prix', () => {
    const selection = { [SAVEUR]: 'vanille', [POIDS]: '810g', 'L-Carnitine Pro Zero - Liquide (Saveur)': 'Tropical' }
    const next = resolveBundleVariantOnChange(complete, axes, selection, POIDS, '2kg')
    expect(next?.id).toBe('b-van-2kg')
    expect(next?.price.amount).toBe('114.90')
    expect(variantOptionValue(next!, SAVEUR)).toBe('vanille')
  })

  it('changer le poids 2kg→810g (prix baisse)', () => {
    const selection = { [SAVEUR]: 'vanille', [POIDS]: '2kg', 'L-Carnitine Pro Zero - Liquide (Saveur)': 'Tropical' }
    const next = resolveBundleVariantOnChange(complete, axes, selection, POIDS, '810g')
    expect(next?.id).toBe('b-van-810')
    expect(next?.price.amount).toBe('74.90')
  })

  it('passer à chocolate-muffin alors qu’on est en 810g bascule sur une combinaison complète (2kg)', () => {
    const selection = { [SAVEUR]: 'vanille', [POIDS]: '810g', 'L-Carnitine Pro Zero - Liquide (Saveur)': 'Tropical' }
    const next = resolveBundleVariantOnChange(complete, axes, selection, SAVEUR, 'chocolate-muffin')
    // chocolate-muffin/810g n'existe pas complet → on doit tomber sur chocolate-muffin/2kg
    expect(next?.id).toBe('b-cm-2kg')
    expect(variantOptionValue(next!, SAVEUR)).toBe('chocolate-muffin')
    expect(variantOptionValue(next!, POIDS)).toBe('2kg')
  })
})
