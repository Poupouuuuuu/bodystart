import { describe, it, expect } from 'vitest'
import { cardPriceOf, computeCardPrice, discountPctOf } from './product-price'

const eur = (amount: string) => ({ amount, currencyCode: 'EUR' })
const v = (price: string, availableForSale = true, compareAt: string | null = null) => ({
  availableForSale,
  price: eur(price),
  compareAtPrice: compareAt ? eur(compareAt) : null,
})

describe('computeCardPrice', () => {
  it('Protimuscle : la 1re variante (23,90 €) est épuisée → prix des variantes en stock, « dès »', () => {
    const p = computeCardPrice([v('23.9', false), v('21.9'), v('44.9'), v('89.9')])
    expect(p).toEqual({ price: eur('21.9'), compareAt: null, discountPct: null, from: true })
  })
  it('Tri Source Vegan : plus de fausse remise entre deux variantes différentes', () => {
    // 25,90 € (sans prix barré) et une autre variante barrée à 73,90 €
    const p = computeCardPrice([v('51.9', true, '73.9'), v('25.9')])
    expect(p).toEqual({ price: eur('25.9'), compareAt: null, discountPct: null, from: true })
  })
  it('vraie remise sur la variante affichée : prix barré de la même variante', () => {
    const p = computeCardPrice([v('29.9', true, '39.9'), v('29.9')])
    expect(p).toEqual({ price: eur('29.9'), compareAt: eur('39.9'), discountPct: 25, from: false })
  })
  it('tout épuisé : la moins chère de toutes ; prix unique : pas de « dès »', () => {
    expect(computeCardPrice([v('19.9', false), v('24.9', false)])?.price).toEqual(eur('19.9'))
    expect(computeCardPrice([v('19.9'), v('19.90')])?.from).toBe(false)
  })
  it('aucune variante : null', () => {
    expect(computeCardPrice([])).toBeNull()
    expect(computeCardPrice(undefined)).toBeNull()
  })
})

describe('discountPctOf', () => {
  it('prix barré inférieur ou égal, ou remise arrondie à 0 : pas de remise', () => {
    expect(discountPctOf(v('30', true, '30'))).toBeNull()
    expect(discountPctOf(v('30', true, '20'))).toBeNull()
    expect(discountPctOf(v('29.99', true, '30'))).toBeNull()
    expect(discountPctOf(v('20', true, '40'))).toBe(50)
  })
})

describe('cardPriceOf', () => {
  it('prix calculé côté serveur prioritaire, sinon variantes disponibles', () => {
    const server = { price: eur('9.9'), compareAt: null, discountPct: null, from: false }
    expect(cardPriceOf({ cardPrice: server, variants: { nodes: [v('99')] } })).toBe(server)
    expect(cardPriceOf({ variants: { nodes: [v('12'), v('10')] } })?.price).toEqual(eur('10'))
  })
})
