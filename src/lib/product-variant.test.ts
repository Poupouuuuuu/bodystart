import { describe, it, expect } from 'vitest'
import { pickDefaultVariant, variantFromSearch, initialImageIndex } from './product-variant'

// YEAAH EAA (données réelles du 29/09/2026) : Fruit Punch épuisé, deux saveurs en stock.
const gid = (n: string) => `gid://shopify/ProductVariant/${n}`
const FRUIT = { id: gid('53981934813526'), availableForSale: false, image: { url: 'https://cdn/fruit.png' } }
const TROPICAL = { id: gid('53981934846294'), availableForSale: true, image: { url: 'https://cdn/tropical.png' } }
const WATERMELON = { id: gid('53981934879062'), availableForSale: true, image: { url: 'https://cdn/watermelon.png' } }
const YEAAH = [FRUIT, TROPICAL, WATERMELON]
const IMAGES = [{ url: 'https://cdn/fruit.png' }, { url: 'https://cdn/tropical.png' }, { url: 'https://cdn/watermelon.png' }]

describe('pickDefaultVariant : première variante disponible', () => {
  it('saute une première variante épuisée (YEAAH EAA → Tropical)', () => {
    expect(pickDefaultVariant(YEAAH)).toBe(TROPICAL)
  })
  it('garde la première quand elle est disponible', () => {
    expect(pickDefaultVariant([TROPICAL, FRUIT])).toBe(TROPICAL)
  })
  it('tout est épuisé : la première, comme avant', () => {
    const allOut = YEAAH.map((v) => ({ ...v, availableForSale: false }))
    expect(pickDefaultVariant(allOut)).toBe(allOut[0])
  })
  it('liste vide : undefined', () => {
    expect(pickDefaultVariant([])).toBeUndefined()
  })
})

describe('variantFromSearch : ?variant= des pubs Meta', () => {
  it('ID numérique de la variante, avec les paramètres de campagne autour', () => {
    const search = '?utm_source=instagram&variant=53981934879062&fbclid=abc123'
    expect(variantFromSearch(YEAAH, search)).toBe(WATERMELON)
  })
  it('variante épuisée demandée : elle est respectée', () => {
    expect(variantFromSearch(YEAAH, '?variant=53981934813526')).toBe(FRUIT)
  })
  it('ID inconnu, vide, non numérique ou absent : rien', () => {
    expect(variantFromSearch(YEAAH, '?variant=123')).toBeUndefined()
    expect(variantFromSearch(YEAAH, '?variant=')).toBeUndefined()
    expect(variantFromSearch(YEAAH, '?variant=gid://shopify/ProductVariant/53981934879062')).toBeUndefined()
    expect(variantFromSearch(YEAAH, '?utm_source=instagram')).toBeUndefined()
    expect(variantFromSearch(YEAAH, '')).toBeUndefined()
    expect(variantFromSearch(YEAAH, undefined)).toBeUndefined()
  })
  it("ne choisit que dans la liste fournie (pack : variantes complètes seulement)", () => {
    expect(variantFromSearch([TROPICAL], '?variant=53981934879062')).toBeUndefined()
  })
})

describe("initialImageIndex : image de la variante d'ouverture", () => {
  it("ouverture sur une autre variante que la première : son image", () => {
    expect(initialImageIndex(IMAGES, YEAAH, TROPICAL)).toBe(1)
  })
  it('ouverture sur la première variante : image principale (index 0), comme avant', () => {
    expect(initialImageIndex([{ url: 'https://cdn/hero.jpg' }, ...IMAGES], YEAAH, FRUIT)).toBe(0)
  })
  it("variante sans image, ou image absente de la galerie : index 0", () => {
    expect(initialImageIndex(IMAGES, YEAAH, { ...TROPICAL, image: null })).toBe(0)
    expect(initialImageIndex(IMAGES, YEAAH, { ...TROPICAL, image: { url: 'https://cdn/autre.png' } })).toBe(0)
    expect(initialImageIndex(IMAGES, YEAAH, undefined)).toBe(0)
  })
})
