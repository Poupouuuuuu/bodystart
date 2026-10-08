import { describe, it, expect } from 'vitest'
import { formatPoids, frenchSpacing } from './typo'

const NBSP = '\u00a0'

describe('frenchSpacing', () => {
  it('met une espace insécable avant la ponctuation haute et les unités', () => {
    expect(frenchSpacing('Les modes sont : le retrait ; 4,90 € ! Vraiment ? 15 %')).toBe(
      `Les modes sont${NBSP}: le retrait${NBSP}; 4,90${NBSP}€${NBSP}! Vraiment${NBSP}? 15${NBSP}%`
    )
  })

  it('protège les guillemets français et les heures', () => {
    expect(frenchSpacing('dénommée « le Vendeur », prête sous 2 h')).toBe(
      `dénommée «${NBSP}le Vendeur${NBSP}», prête sous 2${NBSP}h`
    )
  })

  it('ne touche ni aux mots en h ni aux adresses email', () => {
    const s = 'Contact : bodystartnutrition@gmail.com, 3 heures, 8 Rue du Pont des Landes'
    expect(frenchSpacing(s)).toBe(
      `Contact${NBSP}: bodystartnutrition@gmail.com, 3 heures, 8 Rue du Pont des Landes`
    )
  })
})

describe('formatPoids', () => {
  it('nombre à virgule, espace insécable, unité en minuscules', () => {
    expect(formatPoids('2.27kg')).toBe('2,27 kg')
    expect(formatPoids('6.8kg')).toBe('6,8 kg')
    expect(formatPoids('500g')).toBe('500 g')
    expect(formatPoids('Chocolat / 2,25 kg')).toBe('Chocolat / 2,25 kg')
    expect(formatPoids('Vanille / 1 KG')).toBe('Vanille / 1 kg')
    expect(formatPoids('1000mg')).toBe('1000 mg')
  })
  it('ne touche ni au texte sans unité ni aux mots qui commencent par une unité', () => {
    expect(formatPoids('BCAA 8.1.1')).toBe('BCAA 8.1.1')
    expect(formatPoids('1 Litre')).toBe('1 Litre')
    expect(formatPoids('Vitamine B6')).toBe('Vitamine B6')
    expect(formatPoids('60 gélules')).toBe('60 gélules')
  })
})
