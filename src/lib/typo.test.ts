import { describe, it, expect } from 'vitest'
import { frenchSpacing } from './typo'

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
