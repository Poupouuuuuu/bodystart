import { describe, it, expect } from 'vitest'
import { estPackCatalogue, lienPage, nombreDePages, numeroDePage, ordreCatalogue, pageCatalogue, PAR_PAGE } from './catalogue'

const produits = Array.from({ length: 30 }, (_, i) => ({ handle: `p${i}`, availableForSale: i !== 1 }))

describe('pagination du catalogue', () => {
  it('12 par page, dernière page partielle, page inexistante → null', () => {
    expect(PAR_PAGE).toBe(12)
    expect(nombreDePages(30)).toBe(3)
    expect(nombreDePages(0)).toBe(1)
    expect(pageCatalogue(produits, 1)).toHaveLength(12)
    expect(pageCatalogue(produits, 3)?.map((p) => p.handle)).toEqual(produits.slice(24).map((p) => p.handle))
    expect(pageCatalogue(produits, 4)).toBeNull()
    expect(pageCatalogue(produits, 0)).toBeNull()
  })
  it('même ordre que la vue par défaut : épuisés en fin de liste', () => {
    const ordre = ordreCatalogue(produits)
    expect(ordre.at(-1)?.handle).toBe('p1')
    expect(ordre[1].handle).toBe('p2')
  })
  it('liens : la page 1 est /products', () => {
    expect(lienPage(1)).toBe('/products')
    expect(lienPage(2)).toBe('/products/page/2')
  })
  it('numéro lu dans l’URL : une seule forme par page', () => {
    expect(numeroDePage('2')).toBe(2)
    expect(numeroDePage('10')).toBe(10)
    for (const brut of ['1', '02', '2.5', 'abc', '', '-3']) expect(numeroDePage(brut)).toBeNull()
  })
  it('pack = type Pack seulement (Hit Pack Complex, tagué « pack », reste au catalogue)', () => {
    expect(estPackCatalogue({ productType: 'Pack' })).toBe(true)
    expect(estPackCatalogue({ productType: 'Santé' })).toBe(false)
  })
})
