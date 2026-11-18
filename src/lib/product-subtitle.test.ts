import { describe, it, expect } from 'vitest'
import { productSubtitle, wheyLabel } from './product-subtitle'

// Étiquettes réelles du catalogue (08/10/2026).
describe('productSubtitle', () => {
  it('les cas signalés : plus de « Caseine », « Creme-de-riz », « Glucides » en double', () => {
    expect(productSubtitle(['caseine', 'relance-25', 'whey'], { category: 'Protéines' })).toBeNull()
    expect(productSubtitle(['creme-de-riz', 'glucides', 'prise-de-masse', 'relance-55'], { category: 'Glucides' })).toBe('Crème de riz')
    expect(productSubtitle(['endurance', 'glucides', 'intra-training', 'relance-40'], { category: 'Glucides' })).toBeNull()
  })
  it('jamais une étiquette interne ou brute', () => {
    expect(productSubtitle(['relance-25', 'testo'], { category: 'Boosters' })).toBeNull()
    expect(productSubtitle([], { category: 'Santé' })).toBeNull()
    expect(productSubtitle(undefined)).toBeNull()
  })
  it('en français, ordre de priorité fixe', () => {
    expect(productSubtitle(['isolate', 'relance-40', 'whey'], { category: 'Protéines', productType: 'Protéines' })).toBe('Whey isolat')
    expect(productSubtitle(['caseine', 'isolate', 'relance-55', 'whey'], { category: 'Protéines' })).toBe('Whey isolat')
    expect(productSubtitle(['clear whey', 'collagene', 'proteine', 'whey'], { category: 'Protéines' })).toBe('Whey claire')
    expect(productSubtitle(['gainer', 'relance-25', 'whey'], { category: 'Protéines' })).toBe('Gainer')
    expect(productSubtitle(['bcaa', 'eaa', 'relance-40'], { category: 'Acides aminés' })).toBe('Acides aminés essentiels')
  })
  it('protéine végétale : jamais « whey », même étiquetée isolate', () => {
    expect(productSubtitle(['isolate', 'relance-25', 'vegan'], { category: 'Protéines', productType: 'Protéines', title: 'ISO French Vegan' })).toBe('Protéine végétale')
    expect(productSubtitle(['relance-40', 'vegan'], { category: 'Protéines', productType: 'Protéines', title: 'Tri Source Protein Vegan' })).toBe('Protéine végétale')
    // « vegan » hors protéines (BCAA) : pas de « Protéine végétale »
    expect(productSubtitle(['BCAA', 'Vegan', 'relance-55'], { category: 'Acides aminés', productType: 'Acides aminés' })).toBe('BCAA')
  })
  it('sous-catégories du 18/11/2026 : une seule étiquette, isolat et claire sans étiquette whey', () => {
    expect(productSubtitle(['isolate', 'relance-25'], { category: 'Protéines', productType: 'Protéines', title: 'Native Iso Blend' })).toBe('Whey isolat')
    expect(productSubtitle(['clear-whey', 'collagene', 'proteine'], { category: 'Protéines', title: 'Clear Fusion - Protéine' })).toBe('Whey claire')
    // Mix : jamais « Whey isolat », même s'il porte encore isolate (Iso Fusion avant nettoyage)
    expect(productSubtitle(['caseine', 'isolate', 'mix', 'whey'], { category: 'Protéines', title: 'Iso Fusion Protein' })).toBe('Mix de protéines')
    expect(productSubtitle(['mix'], { category: 'Protéines', title: 'Whey Native Protimuscle' })).toBe('Mix de protéines')
    // Concentrée : exige toujours l'étiquette whey
    expect(productSubtitle(['concentre'], { category: 'Protéines' })).toBeNull()
    // L-Arginine rangée sous Citrulline : son badge reste « Arginine » (ou rien, le nom le dit)
    expect(productSubtitle(['arginine', 'citrulline', 'vegan'], { category: 'Acides aminés', productType: 'Acides aminés' })).toBe('Arginine')
    expect(productSubtitle(['arginine', 'citrulline'], { category: 'Acides aminés', title: 'L-Arginine 1500 - Gélules' })).toBeNull()
  })
  it('jamais la catégorie ni ce que le nom dit déjà', () => {
    expect(productSubtitle(['accessoire', 'shaker'], { category: 'Shaker' })).toBeNull()
    expect(productSubtitle(['omega', 'relance-25', 'sante'], { category: 'Santé', title: 'Omega 3 Fish Oil - EPA DHA' })).toBeNull()
    expect(productSubtitle(['glutamine', 'relance-55'], { category: 'Acides aminés', title: 'Glutamine' })).toBeNull()
    expect(productSubtitle(['multivitamine', 'relance-55'], { category: 'Santé', title: 'Multivitamines Minéraux' })).toBeNull()
    expect(productSubtitle(['monohydrate', 'relance-85'], { category: 'Créatine', title: 'Micronized Creatine Monohydrate' })).toBeNull()
  })
})

describe('wheyLabel (pastille de la fiche)', () => {
  it('« whey » seule ne dit pas le type : rien (Whey Native Protimuscle)', () => {
    expect(wheyLabel(['whey', 'proteine'], 'Whey Native Protimuscle')).toBeNull()
  })
  it('type précisé par étiquette', () => {
    expect(wheyLabel(['whey', 'isolate'], 'Shadowhey Isolate')).toBe('Whey isolat')
    expect(wheyLabel(['whey', 'clear-whey'], 'Clear Whey Isolate')).toBe('Whey claire')
    expect(wheyLabel(['whey', 'concentre'], 'Musclewhey')).toBe('Whey concentrée')
  })
  it('jamais sur une protéine végétale ni sur un mix', () => {
    expect(wheyLabel(['whey', 'vegan', 'isolate'], 'Iso Vegan')).toBeNull()
    expect(wheyLabel(['caseine', 'isolate', 'mix', 'whey'], 'Iso Fusion Protein')).toBeNull()
  })
  it('isolat et claire sur leur seule étiquette (18/11/2026), concentrée avec whey', () => {
    expect(wheyLabel(['isolate'], 'Native Iso Blend')).toBe('Whey isolat')
    expect(wheyLabel(['clear-whey'], 'Clear Fusion - Protéine')).toBe('Whey claire')
    expect(wheyLabel(['concentre'], 'Musclewhey')).toBeNull()
  })
  it('pas si le nom le dit déjà', () => {
    expect(wheyLabel(['whey', 'isolate'], 'Whey Isolat Native')).toBeNull()
  })
})
