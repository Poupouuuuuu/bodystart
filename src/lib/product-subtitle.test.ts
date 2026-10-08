import { describe, it, expect } from 'vitest'
import { productSubtitle } from './product-subtitle'

// Étiquettes réelles du catalogue (08/10/2026).
describe('productSubtitle', () => {
  it('les cas signalés : plus de « Caseine », « Creme-de-riz », « Glucides » en double', () => {
    expect(productSubtitle(['caseine', 'relance-25', 'whey'], 'Protéines')).toBeNull()
    expect(productSubtitle(['creme-de-riz', 'glucides', 'prise-de-masse', 'relance-55'], 'Glucides')).toBe('Crème de riz')
    expect(productSubtitle(['endurance', 'glucides', 'intra-training', 'relance-40'], 'Glucides')).toBeNull()
  })
  it('jamais une étiquette interne ou brute', () => {
    expect(productSubtitle(['relance-25', 'testo'], 'Boosters')).toBeNull()
    expect(productSubtitle([], 'Santé')).toBeNull()
    expect(productSubtitle(undefined)).toBeNull()
  })
  it('ordre de priorité fixe, pas celui des étiquettes', () => {
    expect(productSubtitle(['isolate', 'relance-40', 'whey'], 'Protéines')).toBe('Whey isolate')
    expect(productSubtitle(['caseine', 'isolate', 'relance-55', 'whey'], 'Protéines')).toBe('Whey isolate')
    expect(productSubtitle(['clear whey', 'collagene', 'proteine', 'whey'], 'Protéines')).toBe('Whey claire')
    expect(productSubtitle(['gainer', 'relance-25', 'whey'], 'Protéines')).toBe('Gainer')
    expect(productSubtitle(['bcaa', 'eaa', 'relance-40'], 'Acides aminés')).toBe('Acides aminés essentiels')
    expect(productSubtitle(['monohydrate', 'relance-85'], 'Créatine')).toBe('Créatine monohydrate')
  })
  it('jamais identique à la catégorie', () => {
    expect(productSubtitle(['accessoire', 'shaker'], 'Shaker')).toBeNull()
  })
})
