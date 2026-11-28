import { describe, expect, it } from 'vitest'
import { estNouveau, formatCarte, ligneDetailsCarte, nombreDeParfums, offresDePaliers, resumeCarte, stockBasCarte } from './carte-produit'

const opt = (name: string, ...vals: string[]) => ({ name, optionValues: vals.map((v) => ({ name: v })) })
const MAINTENANT = new Date('2026-11-28T02:00:00Z')

describe('formatCarte', () => {
  it('lit l’option Poids, Format, Taille ou Contenance', () => {
    expect(formatCarte('Whey Native', [opt('Saveur', 'Chocolat', 'Vanille'), opt('Poids', '1 kg')], null)).toBe('1\u00a0kg')
    expect(formatCarte('Whey Native', [opt('Format', '500 g', '1 kg')], null)).toBe('500\u00a0g ou 1\u00a0kg')
    expect(formatCarte('Whey Native', [opt('Contenance', '500 g', '1 kg', '2 kg')], null)).toBe('3 formats')
    expect(formatCarte('Mass', [opt('Poids', '2.27kg', '6.8kg')], null)).toBe('2,27\u00a0kg ou 6,8\u00a0kg')
    expect(formatCarte('Créatine', null, '500g')).toBe('500\u00a0g')
    expect(formatCarte('Créatine DY', [opt('Format', '300 g \u2014 Neutre')], null)).toBe('300\u00a0g, Neutre')
    expect(formatCarte('Creatine Monohydrate DY - 300 g Neutre', [opt('Format', '300 g \u2014 Neutre')], null)).toBeNull()
  })
  it('se tait quand le nom contient déjà le format', () => {
    expect(formatCarte('Whey Protein PER4M - 810 g et 1,8 kg', [opt('Poids', '810 g', '1,8 kg')], null)).toBeNull()
    expect(formatCarte('Créatine Monohydrate PER4M - 400 g', [opt('Title', 'Default Title')], 'Pot de 400 g (80 doses)')).toBeNull()
    expect(formatCarte('L-Carnitine 1500 - 120 gélules', null, '120 gélules végétales')).toBeNull()
  })
  it('se rabat sur le métachamp format, réduit à sa quantité', () => {
    expect(formatCarte('Isolate Zero', [opt('Title', 'Default Title')], 'Pot de 908 g (30 doses)')).toBe('908\u00a0g')
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
    expect(ligneDetailsCarte({ format: '1 kg', parfums: 6 })).toBe('1 kg · 6 parfums')
    expect(ligneDetailsCarte({ parfums: 1 })).toBeNull()
    expect(ligneDetailsCarte({ format: '908 g', nouveau: true })).toBe('908 g')
    expect(ligneDetailsCarte(undefined)).toBeNull()
  })
  it('resumeCarte réunit les trois', () => {
    expect(
      resumeCarte(
        { title: 'Whey', createdAt: '2026-11-25T00:00:00Z', optionsCarte: [opt('Saveur', 'A', 'B'), opt('Poids', '1 kg')] },
        MAINTENANT
      )
    ).toEqual({ format: '1\u00a0kg', parfums: 2, nouveau: true })
    expect(resumeCarte({ title: 'Shaker', createdAt: '2024-01-01T00:00:00Z', optionsCarte: [] }, MAINTENANT)).toBeNull()
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

describe('pastille « Offerte dès … »', () => {
  const CREA = 'gid://shopify/ProductVariant/111'
  const SHAKER = 'gid://shopify/ProductVariant/222'
  const config = {
    periodes: [
      {
        nom: 'Black Week',
        du: '2026-11-21T00:00:00+01:00',
        au: '2026-11-28T23:59:59+01:00',
        paliers: [
          { montant: 85, type: 'livraison' as const, libelle: 'Livraison offerte' },
          { montant: 100, type: 'cadeau' as const, libelle: 'Créatine offerte', variantes: [{ id: CREA, nom: 'Créatine 500 g' }] },
          { montant: 150, type: 'cadeau' as const, libelle: 'Shaker offert', variantes: [{ id: SHAKER, nom: 'Shaker' }] },
        ],
      },
    ],
  }

  it('une pastille par variante cadeau en stock de la période en cours', () => {
    const offres = offresDePaliers(config, { [SHAKER]: false }, MAINTENANT)
    expect(offres[CREA]).toEqual({ libelle: 'Offerte dès 100\u00a0€', fin: '2026-11-28T23:59:59+01:00' })
    expect(offres[SHAKER]).toBeUndefined()
  })
  it('rien hors période', () => {
    expect(offresDePaliers(config, {}, new Date('2026-11-29T00:30:00+01:00'))).toEqual({})
    expect(offresDePaliers(null, {}, MAINTENANT)).toEqual({})
  })
  it('la carte la porte si la variante cadeau du produit est en stock', () => {
    const offres = offresDePaliers(config, {}, MAINTENANT)
    const v = (id: string, dispo = true, precommande = false) => ({
      id,
      availableForSale: dispo,
      currentlyNotInStock: precommande,
      price: { amount: '36.9', currencyCode: 'EUR' },
      compareAtPrice: null,
    })
    const crea = (variantes: ReturnType<typeof v>[]) =>
      resumeCarte({ title: 'Créatine', createdAt: '2024-01-01T00:00:00Z', prixVariantes: { nodes: variantes } }, MAINTENANT, offres)
    expect(crea([v('autre'), v(CREA)])).toEqual({ offre: 'Offerte dès 100\u00a0€', offreFin: '2026-11-28T23:59:59+01:00' })
    expect(crea([v('autre'), v(CREA, false)])).toBeNull()
    expect(crea([v('autre')])).toBeNull()
  })
})

describe('produit tout à 0', () => {
  const v = (dispo: boolean, precommande: boolean) => ({
    availableForSale: dispo,
    currentlyNotInStock: precommande,
    price: { amount: '10', currencyCode: 'EUR' },
    compareAtPrice: null,
  })
  const r = (nodes: ReturnType<typeof v>[]) =>
    resumeCarte({ title: 'X', createdAt: '2024-01-01T00:00:00Z', prixVariantes: { nodes } }, MAINTENANT)
  it('épuisé quand les seules variantes vendables sont en précommande', () => {
    expect(r([v(true, true), v(false, false)])).toEqual({ epuise: true })
  })
  it('pas épuisé avec une variante en stock ; rien à dire si Shopify le dit déjà épuisé', () => {
    expect(r([v(true, true), v(true, false)])).toBeNull()
    expect(r([v(false, false)])).toBeNull()
  })
})
