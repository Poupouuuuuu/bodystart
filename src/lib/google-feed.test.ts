import { describe, it, expect } from 'vitest'
import {
  buildGoogleFeedXml,
  isValidGtin,
  htmlToText,
  formatGooglePrice,
  escapeXml,
  cdata,
  type FeedProduct,
} from './google-feed'

function makeProduct(overrides: Partial<FeedProduct> = {}): FeedProduct {
  return {
    id: 'gid://shopify/Product/111',
    title: 'Whey Test',
    handle: 'whey-test',
    descriptionHtml: '<p>Une <strong>whey</strong> &amp; co.</p>',
    vendor: 'Eric Favre',
    productType: 'Protéines',
    tags: [],
    onlineStoreUrl: 'https://shop.example/products/whey-test',
    featuredImage: { url: 'https://cdn.shopify.com/img-main.jpg' },
    images: { nodes: [{ url: 'https://cdn.shopify.com/img-main.jpg' }, { url: 'https://cdn.shopify.com/img-2.jpg' }] },
    variants: {
      nodes: [
        {
          id: 'gid://shopify/ProductVariant/222',
          title: 'Default Title',
          sku: null,
          barcode: '7340224405384',
          price: '29.9',
          compareAtPrice: null,
          inventoryQuantity: 5,
          inventoryPolicy: 'DENY',
          image: null,
        },
      ],
    },
    ...overrides,
  }
}

const SITE = 'https://bodystart-nutrition.fr'

describe('isValidGtin', () => {
  it('accepte un EAN-13 réel du catalogue', () => {
    expect(isValidGtin('7340224405384')).toBe(true)
    expect(isValidGtin('5904347171100')).toBe(true)
  })
  it('rejette une clé GS1 fausse', () => {
    expect(isValidGtin('7340224405385')).toBe(false)
  })
  it('rejette vides, codes internes, longueurs invalides', () => {
    expect(isValidGtin(null)).toBe(false)
    expect(isValidGtin('')).toBe(false)
    expect(isValidGtin('ABC-123')).toBe(false)
    expect(isValidGtin('12345')).toBe(false)
  })
})

describe('helpers', () => {
  it('htmlToText strip + décode', () => {
    expect(htmlToText('<p>A &amp; B<br>C</p>')).toBe('A & B\nC')
  })
  it('formatGooglePrice : 2 décimales + EUR ; rejette 0/NaN', () => {
    expect(formatGooglePrice('29.9')).toBe('29.90 EUR')
    expect(formatGooglePrice('0')).toBeNull()
    expect(formatGooglePrice('abc')).toBeNull()
  })
  it('escapeXml et cdata (séquence ]]> neutralisée)', () => {
    expect(escapeXml('a&b<c>')).toBe('a&amp;b&lt;c&gt;')
    expect(cdata('x]]>y')).toBe('<![CDATA[x]]]]><![CDATA[>y]]>')
  })
})

describe('buildGoogleFeedXml', () => {
  it('item complet : id numérique, gtin, lien canonique, catégorie, in_stock', () => {
    const { xml, counters } = buildGoogleFeedXml([makeProduct()], SITE)
    expect(counters.items).toBe(1)
    expect(xml).toContain('<g:id>222</g:id>')
    expect(xml).toContain('<g:item_group_id>111</g:item_group_id>')
    expect(xml).toContain('<link>https://bodystart-nutrition.fr/products/whey-test</link>')
    expect(xml).toContain('<g:price>29.90 EUR</g:price>')
    expect(xml).toContain('<g:gtin>7340224405384</g:gtin>')
    expect(xml).toContain('<g:availability>in_stock</g:availability>')
    expect(xml).toContain('<g:google_product_category>2984</g:google_product_category>')
    expect(xml).toContain('<g:brand><![CDATA[Eric Favre]]></g:brand>')
    expect(xml).not.toContain('identifier_exists') // gtin présent
    expect(xml).toContain('<g:additional_image_link>https://cdn.shopify.com/img-2.jpg</g:additional_image_link>')
    // titre mono-variante : pas de suffixe "Default Title"
    expect(xml).toContain('<title><![CDATA[Whey Test]]></title>')
  })

  it('promo : g:price = compareAt, g:sale_price = prix réel', () => {
    const p = makeProduct()
    p.variants.nodes[0].compareAtPrice = '39.9'
    const { xml } = buildGoogleFeedXml([p], SITE)
    expect(xml).toContain('<g:price>39.90 EUR</g:price>')
    expect(xml).toContain('<g:sale_price>29.90 EUR</g:sale_price>')
  })

  it('identifier_exists=no si ni gtin ni sku', () => {
    const p = makeProduct()
    p.variants.nodes[0].barcode = 'CODE-INTERNE'
    const { xml } = buildGoogleFeedXml([p], SITE)
    expect(xml).not.toContain('<g:gtin>')
    expect(xml).toContain('<g:identifier_exists>no</g:identifier_exists>')
  })

  it('exclusions produit : tag exclu-google, non publié', () => {
    const tagged = makeProduct({ tags: ['exclu-google'] })
    const unpublished = makeProduct({ onlineStoreUrl: null })
    const { counters } = buildGoogleFeedXml([tagged, unpublished], SITE)
    expect(counters.items).toBe(0)
    expect(counters.skippedProducts).toBe(2)
  })

  it('skip variante sans image / sans prix', () => {
    const noImage = makeProduct({ featuredImage: null, images: { nodes: [] } })
    const noPrice = makeProduct()
    noPrice.variants.nodes[0].price = '0'
    const { counters } = buildGoogleFeedXml([noImage, noPrice], SITE)
    expect(counters.items).toBe(0)
    expect(counters.skippedNoImage).toBe(1)
    expect(counters.skippedNoPrice).toBe(1)
  })

  it('multi-variantes : un item par variante, titre suffixé, out_of_stock si épuisé+DENY', () => {
    const p = makeProduct()
    p.variants.nodes = [
      { ...p.variants.nodes[0], id: 'gid://shopify/ProductVariant/1', title: 'Vanille / 810g' },
      {
        ...p.variants.nodes[0],
        id: 'gid://shopify/ProductVariant/2',
        title: 'Choco / 2kg',
        barcode: null,
        inventoryQuantity: 0,
        price: '49.9',
      },
    ]
    const { xml, counters } = buildGoogleFeedXml([p], SITE)
    expect(counters.items).toBe(2)
    expect(xml).toContain('<title><![CDATA[Whey Test - Vanille / 810g]]></title>')
    expect(xml).toContain('<title><![CDATA[Whey Test - Choco / 2kg]]></title>')
    expect(xml).toContain('<g:availability>out_of_stock</g:availability>')
  })

  it('inventoryPolicy CONTINUE → in_stock même à 0', () => {
    const p = makeProduct()
    p.variants.nodes[0].inventoryQuantity = 0
    p.variants.nodes[0].inventoryPolicy = 'CONTINUE'
    const { xml } = buildGoogleFeedXml([p], SITE)
    expect(xml).toContain('<g:availability>in_stock</g:availability>')
  })
})
