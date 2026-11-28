import { describe, expect, it } from 'vitest'
import { choisir, choixInitial, etatValeur, optionsAChoisir, varianteDuChoix } from './selection'

const v = (id: string, saveur: string, poids: string, dispo = true) => ({
  id,
  availableForSale: dispo,
  selectedOptions: [
    { name: 'Saveur', value: saveur },
    { name: 'Poids', value: poids },
  ],
})

// Chocolat 1 kg et 2 kg, Vanille 1 kg seulement, Fraise épuisée partout, Vanille 2 kg épuisée.
const VARIANTES = [
  v('choc-1', 'Chocolat', '1 kg', false),
  v('choc-2', 'Chocolat', '2 kg'),
  v('van-1', 'Vanille', '1 kg'),
  v('van-2', 'Vanille', '2 kg', false),
  v('fra-1', 'Fraise', '1 kg', false),
]

describe('sélection de l’ajout rapide', () => {
  it('s’ouvre sur la première variante disponible', () => {
    expect(choixInitial(VARIANTES)).toEqual({ Saveur: 'Chocolat', Poids: '2 kg' })
  })
  it('grise une valeur sans aucune variante disponible', () => {
    const choix = choixInitial(VARIANTES)
    expect(etatValeur(VARIANTES, choix, 'Saveur', 'Fraise')).toBe('rupture')
    expect(etatValeur(VARIANTES, choix, 'Saveur', 'Vanille')).toBe('dispo')
    expect(etatValeur(VARIANTES, choix, 'Poids', '2 kg')).toBe('choisie')
  })
  it('passe sur la variante disponible la plus proche', () => {
    const choix = choixInitial(VARIANTES)
    // Vanille n'existe en stock qu'en 1 kg : le poids suit.
    expect(choisir(VARIANTES, choix, 'Saveur', 'Vanille')).toEqual({ Saveur: 'Vanille', Poids: '1 kg' })
    // Fraise épuisée : rien ne change.
    expect(choisir(VARIANTES, choix, 'Saveur', 'Fraise')).toEqual(choix)
    expect(varianteDuChoix(VARIANTES, { Saveur: 'Vanille', Poids: '1 kg' })?.id).toBe('van-1')
  })
  it('n’affiche pas l’option Title d’un produit sans variante', () => {
    const titre = [{ name: 'Title', optionValues: [{ name: 'Default Title' }] }]
    expect(optionsAChoisir(titre, [{ id: 'a', availableForSale: true, selectedOptions: [] }])).toEqual([])
  })
})
