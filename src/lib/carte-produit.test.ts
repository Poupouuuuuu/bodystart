import { describe, expect, it } from 'vitest'
import { estNouveau, formatCarte, ligneDetailsCarte, nombreDeParfums, resumeCarte, stockBasCarte } from './carte-produit'

const opt = (name: string, ...vals: string[]) => ({ name, optionValues: vals.map((v) => ({ name: v })) })
const MAINTENANT = new Date('2026-11-28T02:00:00Z')

describe('formatCarte', () => {
  it('lit l’option Poids, Format, Taille ou Contenance', () => {
    expect(formatCarte('Whey Native', [opt('Saveur', 'Chocolat', 'Vanille'), opt('Poids', '1 kg')], null)).toBe('1 kg')
    expect(formatCarte('Whey Native', [opt('Format', '500 g', '1 kg')], null)).toBe('500 g ou 1 kg')
    expect(formatCarte('Whey Native', [opt('Contenance', '500 g', '1 kg', '2 kg')], null)).toBe('3 formats')
  })
  it('se tait quand le nom contient déjà le format', () => {
    expect(formatCarte('Whey Protein PER4M - 810 g et 1,8 kg', [opt('Poids', '810 g', '1,8 kg')], null)).toBeNull()
    expect(formatCarte('Créatine Monohydrate PER4M - 400 g', [opt('Title', 'Default Title')], 'Pot de 400 g (80 doses)')).toBeNull()
    expect(formatCarte('L-Carnitine 1500 - 120 gélules', null, '120 gélules végétales')).toBeNull()
  })
  it('se rabat sur le métachamp format, réduit à sa quantité', () => {
    expect(formatCarte('Isolate Zero', [opt('Title', 'Default Title')], 'Pot de 908 g (30 doses)')).toBe('908 g')
    expect(formatCarte('Isolate Zero', null, '500 g / 1 kg')).toBeNull()
    expect(formatCarte('Isolate Zero', null, null)).toBeNull()
  })
})

describe('nombreDeParfums', () => {
  it('compte les valeurs de l’option Saveur, Parfum ou Goût', () => {
    expect(nombreDeParfums([opt('Saveur', 'Chocolat', 'Vanille', 'Fraise')])).toBe(3)
    expect(nombreDeParfums([opt('Goût', 'Citron')])).toBe(1)
    expect(nombreDeParfums([opt('Poids', '1 kg', '2 kg')])).toBe(0)
    expect(nombreDeParfums(undefined)).toBe(0)
  })
})

describe('estNouveau', () => {
  it('vrai moins de 30 jours après la création, ou avec l’étiquette nouveau', () => {
    expect(estNouveau({ createdAt: '2026-11-19T12:28:28Z' }, MAINTENANT)).toBe(true)
    expect(estNouveau({ createdAt: '2026-10-14T09:57:09Z' }, MAINTENANT)).toBe(false)
    expect(estNouveau({ createdAt: '2025-01-01T00:00:00Z', tags: ['Nouveauté'] }, MAINTENANT)).toBe(true)
    expect(estNouveau({}, MAINTENANT)).toBe(false)
    expect(estNouveau({ createdAt: 'pas une date' }, MAINTENANT)).toBe(false)
  })
})

describe('ligneDetailsCarte', () => {
  it('format puis parfums, à partir de 2 parfums', () => {
    expect(ligneDetailsCarte({ format: '1 kg', parfums: 6, nouveau: false })).toBe('1 kg · 6 parfums')
    expect(ligneDetailsCarte({ format: null, parfums: 1, nouveau: false })).toBeNull()
    expect(ligneDetailsCarte({ format: '908 g', parfums: 0, nouveau: true })).toBe('908 g')
    expect(ligneDetailsCarte(undefined)).toBeNull()
  })
  it('resumeCarte réunit les trois', () => {
    expect(
      resumeCarte(
        { title: 'Whey', createdAt: '2026-11-25T00:00:00Z', optionsCarte: [opt('Saveur', 'A', 'B'), opt('Poids', '1 kg')] },
        MAINTENANT
      )
    ).toEqual({ format: '1 kg', parfums: 2, nouveau: true })
  })
})

describe('stockBasCarte', () => {
  const v = (q: number | null, dispo = true) => ({ availableForSale: dispo, quantityAvailable: q })
  it('une seule variante disponible, stock réel de 1 à 5', () => {
    expect(stockBasCarte([v(3)])).toBe(3)
    expect(stockBasCarte([v(30)], 4)).toBe(4)
    expect(stockBasCarte([v(2)], 12)).toBeNull()
    expect(stockBasCarte([v(9)])).toBeNull()
    expect(stockBasCarte([v(0)])).toBeNull()
    expect(stockBasCarte([v(null)])).toBeNull()
    expect(stockBasCarte([v(2, false)])).toBeNull()
  })
  it('jamais sur un produit à plusieurs variantes (le total ne dit rien du parfum voulu)', () => {
    expect(stockBasCarte([v(1), v(1)], 2)).toBeNull()
  })
})
