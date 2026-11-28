import { describe, it, expect } from 'vitest'
import { pickDefaultVariant, variantFromSearch, initialImageIndex, libelleVariante } from './product-variant'

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

describe('libelleVariante : choix rappelé dans la barre d’achat fixe', () => {
  const opt = (title: string, ...pairs: [string, string][]) => ({
    title,
    selectedOptions: pairs.map(([name, value]) => ({ name, value })),
  })
  // Mutant Mass (28/11/2026) : saveur et poids changent.
  const MASS = [
    opt('Triple Chocolate / 2.27kg', ['Saveur', 'Triple Chocolate'], ['Poids', '2.27kg']),
    opt('Triple Chocolate / 6.8kg', ['Saveur', 'Triple Chocolate'], ['Poids', '6.8kg']),
    opt('Vanilla Ice Cream / 2.27kg', ['Saveur', 'Vanilla Ice Cream'], ['Poids', '2.27kg']),
  ]
  it('saveur et format, poids à la française', () => {
    expect(libelleVariante(MASS[1], MASS)).toBe('Triple Chocolate · 6,8\u00a0kg')
  })
  it('format identique partout : seule la saveur (YEAAH EAA 400 g)', () => {
    const eaa = [opt('Tropical / 400g', ['Saveur', 'Tropical'], ['Format', '400g']), opt('Watermelon / 400g', ['Saveur', 'Watermelon'], ['Format', '400g'])]
    expect(libelleVariante(eaa[0], eaa)).toBe('Tropical')
  })
  it('formule d’un pack (Pack Gamer : Jour, Jour + Nuit)', () => {
    const gamer = [opt('Jour', ['Formule', 'Jour']), opt('Jour + Nuit', ['Formule', 'Jour + Nuit'])]
    expect(libelleVariante(gamer[0], gamer)).toBe('Jour')
    expect(libelleVariante(gamer[1], gamer)).toBe('Jour + Nuit')
  })
  it('variante unique ou « Default Title » : rien', () => {
    const seule = opt('Default Title', ['Title', 'Default Title'])
    expect(libelleVariante(seule, [seule])).toBeNull()
    expect(libelleVariante(seule, [seule, { ...seule }])).toBeNull()
  })
  it('sans selectedOptions : le titre Shopify « Saveur / Format » en repli', () => {
    const a = { title: 'Chocolat / 1kg' }
    expect(libelleVariante(a, [a, { title: 'Vanille / 1kg' }])).toBe('Chocolat · 1\u00a0kg')
  })
  it('options identiques partout (doublon Shopify) : toutes les valeurs plutôt que rien', () => {
    const a = opt('Chocolat / 1kg', ['Saveur', 'Chocolat'], ['Poids', '1kg'])
    expect(libelleVariante(a, [a, { ...a }])).toBe('Chocolat · 1\u00a0kg')
  })
})
