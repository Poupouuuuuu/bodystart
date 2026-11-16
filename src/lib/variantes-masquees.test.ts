import { describe, it, expect } from 'vitest'
import { CHAMP_MASQUE, estMasquee, variantesVisibles } from './variantes-masquees'
import { computeCardPrice, type PrixVariante } from './product-price'

const v = (prix: string, dispo: boolean, masque?: boolean): PrixVariante & { id: string } => ({
  id: `${prix}-${dispo}`,
  availableForSale: dispo,
  price: { amount: prix, currencyCode: 'EUR' },
  compareAtPrice: null,
  masque: masque === undefined ? null : { value: String(masque) },
})

describe('variantes masquées (bodystart.masquer_site)', () => {
  it('masquée seulement si le metafield est à true ET la variante non achetable en ligne', () => {
    expect(estMasquee({ availableForSale: false, masque: { value: 'true' } })).toBe(true)
    expect(estMasquee({ availableForSale: true, masque: { value: 'true' } })).toBe(false) // encore en stock
    expect(estMasquee({ availableForSale: false, masque: { value: 'false' } })).toBe(false)
    expect(estMasquee({ availableForSale: false, masque: null })).toBe(false) // metafield absent
    expect(estMasquee({ availableForSale: false })).toBe(false)
  })

  it('une fiche ne se retrouve jamais sans variante', () => {
    const toutes = [v('19.9', false, true), v('29.9', false, true)]
    expect(variantesVisibles(toutes)).toEqual(toutes)
    expect(variantesVisibles([])).toEqual([])
  })

  it('prix des cartes : un 500 g masqué moins cher ne déclenche plus « dès »', () => {
    // Whey Native Protimuscle : 1 kg en stock à 39,90 €, 500 g arrêté et épuisé à 23,90 €
    const variantes = [v('39.9', true), v('39.9', true), v('23.9', false, true)]
    expect(computeCardPrice(variantes)?.from).toBe(false) // déjà le cas : le pool part des variantes en stock
    // Tout épuisé (fiche en rupture) : sans masquage, « dès 23,90 € » viendrait du 500 g arrêté
    const epuise = [v('39.9', false), v('23.9', false, true)]
    expect(computeCardPrice(epuise)).toMatchObject({ price: { amount: '23.9' }, from: true })
    expect(computeCardPrice(variantesVisibles(epuise))).toMatchObject({ price: { amount: '39.9' }, from: false })
  })

  it('champ GraphQL commun (Storefront et Admin)', () => {
    expect(CHAMP_MASQUE).toBe('masque: metafield(namespace: "bodystart", key: "masquer_site") { value }')
  })
})
