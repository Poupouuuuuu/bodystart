import { describe, it, expect } from 'vitest'
import {
  buildBackInStockEmail,
  displayVariantTitle,
  gidToNumericId,
  isValidEmail,
  isValidVariantGid,
  parseInventoryLevelPayload,
} from './core'

describe('validation des entrées', () => {
  it('accepte un email et un gid de variante valides', () => {
    expect(isValidEmail('adam@example.com')).toBe(true)
    expect(isValidVariantGid('gid://shopify/ProductVariant/55014961807702')).toBe(true)
  })

  it('rejette les valeurs malformées ou d’un autre type', () => {
    expect(isValidEmail('pas-un-email')).toBe(false)
    expect(isValidEmail(42)).toBe(false)
    expect(isValidVariantGid('gid://shopify/Product/1')).toBe(false)
    expect(isValidVariantGid('55014961807702')).toBe(false)
  })

  it('extrait l’id numérique d’un gid', () => {
    expect(gidToNumericId('gid://shopify/InventoryItem/987')).toBe('987')
    expect(() => gidToNumericId('gid://shopify/InventoryItem/')).toThrow()
  })
})

describe('parseInventoryLevelPayload', () => {
  it('lit un payload inventory_levels/update', () => {
    expect(
      parseInventoryLevelPayload({ inventory_item_id: 123, location_id: 456, available: 3, updated_at: 'x' })
    ).toEqual({ inventoryItemId: '123', available: 3, locationId: '456' })
  })

  it('tolère available null (stock non suivi) et les ids en chaîne', () => {
    expect(parseInventoryLevelPayload({ inventory_item_id: '123', available: null })).toEqual({
      inventoryItemId: '123',
      available: null,
      locationId: null,
    })
  })

  it('refuse un payload sans inventory_item_id exploitable', () => {
    expect(parseInventoryLevelPayload(null)).toBeNull()
    expect(parseInventoryLevelPayload({ available: 2 })).toBeNull()
    expect(parseInventoryLevelPayload({ inventory_item_id: 'abc', available: 2 })).toBeNull()
    expect(parseInventoryLevelPayload({ inventory_item_id: 1, available: 'deux' })).toBeNull()
  })
})

describe('buildBackInStockEmail', () => {
  const base = { productTitle: 'Creatine Monohydrate DY', productHandle: 'creatine-dy', siteUrl: 'https://bodystart-nutrition.fr/' }

  it('contient le nom, la variante et le lien produit', () => {
    const mail = buildBackInStockEmail({ ...base, variantTitle: '300 g — Neutre' })
    expect(mail.subject).toBe('De retour en stock : Creatine Monohydrate DY (300 g — Neutre)')
    expect(mail.html).toContain('https://bodystart-nutrition.fr/products/creatine-dy')
    expect(mail.text).toContain('https://bodystart-nutrition.fr/products/creatine-dy')
    expect(mail.html).toContain('Creatine Monohydrate DY (300 g — Neutre)')
  })

  it('masque « Default Title » et échappe le HTML', () => {
    expect(displayVariantTitle('Default Title')).toBeNull()
    const mail = buildBackInStockEmail({ ...base, productTitle: 'Whey <b>Native</b>', variantTitle: 'Default Title' })
    expect(mail.subject).toBe('De retour en stock : Whey <b>Native</b>')
    expect(mail.html).toContain('Whey &lt;b&gt;Native&lt;/b&gt;')
    expect(mail.html).not.toContain('<b>Native</b>')
  })
})
