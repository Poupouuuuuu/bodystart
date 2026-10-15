import { describe, it, expect } from 'vitest'
import { descriptionSchema, gtinSchema, productSchema, type ProduitSchema } from './product'

const SITE = 'https://bodystart-nutrition.fr'
const variante = (id: number, extra: Partial<ProduitSchema['variants'][number]> = {}) => ({
  id: `gid://shopify/ProductVariant/${id}`,
  title: 'Default Title',
  availableForSale: true,
  price: { amount: '27.9', currencyCode: 'EUR' },
  selectedOptions: [{ name: 'Title', value: 'Default Title' }],
  barcode: null,
  sku: null,
  ...extra,
})
const produit = (extra: Partial<ProduitSchema> = {}): ProduitSchema => ({
  id: 'gid://shopify/Product/42',
  handle: 'l-carnitine-1500-120-gelules',
  title: 'L-Carnitine 1500 - 120 gélules',
  vendor: 'Applied Nutrition',
  descriptionHtml: '<p>120 gélules.</p><p>La L-carnitine est un dérivé d’acide aminé.</p>',
  images: [{ url: 'https://cdn.shopify.com/a.jpg' }],
  variants: [variante(1, { barcode: '634158635786' })],
  ...extra,
})

describe('gtinSchema', () => {
  it('propriété selon la longueur, clé GS1 vérifiée', () => {
    expect(gtinSchema('3525722029612')).toEqual({ gtin13: '3525722029612' })
    expect(gtinSchema(' 634158635786 ')).toEqual({ gtin12: '634158635786' })
    expect(gtinSchema('3525722029613')).toEqual({})
    expect(gtinSchema('ABC')).toEqual({})
    expect(gtinSchema(null)).toEqual({})
  })
})

describe('descriptionSchema', () => {
  it('un espace entre les paragraphes (avant : « 120 gélules.La L-carnitine »)', () => {
    expect(descriptionSchema(produit())).toBe('120 gélules. La L-carnitine est un dérivé d’acide aminé.')
  })
  it('repli sur le texte brut, coupé au mot', () => {
    const long = 'mot '.repeat(200)
    const d = descriptionSchema({ descriptionHtml: null, description: long })
    expect(d.length).toBeLessThanOrEqual(501)
    expect(d.endsWith('…')).toBe(true)
  })
})

describe('productSchema', () => {
  it('une variante : Product + Offer, gtin12, sku = id de variante', () => {
    const s = productSchema(produit(), { siteUrl: SITE, offre: { seller: { '@type': 'Organization', name: 'BodyStart Nutrition' } } })!
    expect(s['@type']).toBe('Product')
    expect(s).toMatchObject({
      name: 'L-Carnitine 1500 - 120 gélules',
      image: ['https://cdn.shopify.com/a.jpg'],
      brand: { name: 'Applied Nutrition' },
      gtin12: '634158635786',
      sku: '1',
      offers: {
        '@type': 'Offer',
        url: `${SITE}/products/l-carnitine-1500-120-gelules`,
        price: '27.9',
        priceCurrency: 'EUR',
        availability: 'https://schema.org/InStock',
        seller: { name: 'BodyStart Nutrition' },
      },
    })
  })

  it('plusieurs variantes : ProductGroup, un Offer par variante avec son prix et son URL', () => {
    const s = productSchema(
      produit({
        title: 'Whey Native Protimuscle',
        handle: 'whey-native-protimuscle',
        variants: [
          variante(10, {
            title: 'Chocolat / 1 kg',
            selectedOptions: [{ name: 'Saveur', value: 'Chocolat' }, { name: 'Poids', value: '1 kg' }],
            price: { amount: '44.9', currencyCode: 'EUR' },
            barcode: '3525722029612',
            image: { url: 'https://cdn.shopify.com/choco.jpg' },
          }),
          variante(11, {
            title: 'Vanille / 500 g',
            selectedOptions: [{ name: 'Saveur', value: 'Vanille' }, { name: 'Poids', value: '500 g' }],
            price: { amount: '23.9', currencyCode: 'EUR' },
            availableForSale: false,
          }),
        ],
      }),
      { siteUrl: SITE },
    )!
    expect(s['@type']).toBe('ProductGroup')
    expect(s).toMatchObject({ url: `${SITE}/products/whey-native-protimuscle`, productGroupID: '42' })
    const [a, b] = s.hasVariant as Record<string, unknown>[]
    expect(a).toMatchObject({
      name: 'Whey Native Protimuscle - Chocolat, 1 kg',
      image: 'https://cdn.shopify.com/choco.jpg',
      gtin13: '3525722029612',
      sku: '10',
      offers: { price: '44.9', url: `${SITE}/products/whey-native-protimuscle?variant=10` },
    })
    expect(b).toMatchObject({
      name: 'Whey Native Protimuscle - Vanille, 500 g',
      image: 'https://cdn.shopify.com/a.jpg',
      sku: '11',
      offers: { price: '23.9', availability: 'https://schema.org/OutOfStock' },
    })
    expect(b.gtin13).toBeUndefined()
  })

  it('pas de Product sans image, ni sans prix', () => {
    expect(productSchema(produit({ images: [] }), { siteUrl: SITE })).toBeNull()
    expect(
      productSchema(produit({ variants: [variante(1, { price: { amount: '0.0', currencyCode: 'EUR' } })] }), { siteUrl: SITE }),
    ).toBeNull()
  })

  it('SKU Shopify prioritaire, images dédoublonnées et plafonnées à 5', () => {
    const urls = ['a', 'a', 'b', 'c', 'd', 'e', 'f'].map((x) => ({ url: `https://cdn.shopify.com/${x}.jpg` }))
    const s = productSchema(produit({ images: urls, variants: [variante(1, { sku: 'AN-LC1500' })] }), { siteUrl: SITE })!
    expect(s.sku).toBe('AN-LC1500')
    expect(s.image).toHaveLength(5)
  })
})
