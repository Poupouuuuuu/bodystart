import { describe, it, expect } from 'vitest'
import { parseProductRedirects } from './product-redirects'

describe('parseProductRedirects', () => {
  it('garde les redirections internes valides', () => {
    expect(
      parseProductRedirects(
        JSON.stringify({
          'liv-ox-detox-foie': '/categories/sante',
          'Omega-4': ' /products/omega-3-fish-oil-epa-dha ',
        })
      )
    ).toEqual({
      'liv-ox-detox-foie': '/categories/sante',
      'omega-4': '/products/omega-3-fish-oil-epa-dha',
    })
  })

  it('écarte les destinations externes, les boucles et les valeurs invalides', () => {
    expect(
      parseProductRedirects(
        JSON.stringify({
          a: 'https://ailleurs.example/x',
          b: '//ailleurs.example/x',
          c: '/products/c',
          d: 42,
          'e f': '/categories/sante',
        })
      )
    ).toEqual({})
  })

  it('métachamp vide ou illisible : table vide', () => {
    expect(parseProductRedirects(null)).toEqual({})
    expect(parseProductRedirects('pas du json')).toEqual({})
    expect(parseProductRedirects('["/a"]')).toEqual({})
  })
})
