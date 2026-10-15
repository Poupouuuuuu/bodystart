import { describe, it, expect } from 'vitest'
import { altImage, altProduit, formatCourt } from './alt-produit'

describe('formatCourt', () => {
  it('garde un format simple, retire « Pot de » et les précisions', () => {
    expect(formatCourt('120 softgels')).toBe('120 softgels')
    expect(formatCourt('Pot de 400 g (25 doses de 16 g)')).toBe('400 g')
    expect(formatCourt('120 gélules, 20 jours')).toBe('120 gélules')
  })
  it('plusieurs formats, description ou vide : rien', () => {
    expect(formatCourt('500 g / 1 kg / 2,25 kg')).toBeNull()
    expect(formatCourt('3 produits : French Pump 300 g, L-Citrulline 300 g')).toBeNull()
    expect(formatCourt('')).toBeNull()
    expect(formatCourt(null)).toBeNull()
  })
})

describe('altProduit', () => {
  it('[Produit] [marque] [format], BodyStart Nutrition', () => {
    expect(altProduit({ title: 'Micronized Creatine Monohydrate', vendor: 'Dedicated', format: 'Pot de 500 g (100 mesures de 5 g)' })).toBe(
      'Micronized Creatine Monohydrate Dedicated 500 g, BodyStart Nutrition',
    )
  })
  it('sans doublon de marque ni de format déjà dans le titre', () => {
    expect(altProduit({ title: 'Iron Ultra Eric Favre', vendor: 'Eric Favre', format: '120 gélules' })).toBe(
      'Iron Ultra Eric Favre 120 gélules, BodyStart Nutrition',
    )
    expect(altProduit({ title: 'L-Carnitine 1500 - 120 gélules', vendor: 'Applied Nutrition', format: '120 gélules végétales' })).toBe(
      'L-Carnitine 1500 - 120 gélules Applied Nutrition, BodyStart Nutrition',
    )
    expect(altProduit({ title: 'Pack Séance parfaite', vendor: 'BodyStart Nutrition', format: '3 produits : …' })).toBe(
      'Pack Séance parfaite, BodyStart Nutrition',
    )
  })
  it('format multiple omis', () => {
    expect(altProduit({ title: 'Whey Native Protimuscle', vendor: 'Nutrimuscle', format: '500 g / 1 kg / 2,25 kg' })).toBe(
      'Whey Native Protimuscle Nutrimuscle, BodyStart Nutrition',
    )
  })
})

describe('altImage', () => {
  it('texte Shopify prioritaire, vide ignoré', () => {
    expect(altImage({ altText: 'Coffret de Noël Muscle' }, 'généré')).toBe('Coffret de Noël Muscle')
    expect(altImage({ altText: '  ' }, 'généré')).toBe('généré')
    expect(altImage(null, 'généré')).toBe('généré')
  })
})
