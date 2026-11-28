import { describe, it, expect } from 'vitest'
import { estPackCatalogue, lienPage, nombreDePages, numeroDePage, ordreCatalogue, pageCatalogue, PAR_PAGE, vedettesDabord } from './catalogue'

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

describe('vedettesDabord (vue par défaut, 28/11/2026)', () => {
  const p = (handle: string, dispo = true, epuise = false) => ({
    handle,
    availableForSale: dispo,
    ...(epuise ? { carte: { epuise: true as const } } : {}),
  })
  const ventes = [p('crunch-bar'), p('abe'), p('whey-native'), p('creatine-dedicated'), p('iso-zero', false), p('mutant-mass'), p('shaker')]

  it('vedettes en stock en tête, dans l’ordre du metafield, puis le reste par ventes', () => {
    const ordre = vedettesDabord(ventes, ['creatine-dedicated', 'whey-native', 'iso-zero', 'mutant-mass']).map((x) => x.handle)
    expect(ordre).toEqual(['creatine-dedicated', 'whey-native', 'mutant-mass', 'crunch-bar', 'abe', 'iso-zero', 'shaker'])
  })
  it('ignore les vedettes absentes, épuisées, en précommande ou citées deux fois', () => {
    const avecPrecommande = [...ventes, p('game-changer', true, true)]
    const ordre = vedettesDabord(avecPrecommande, ['pack-gamer', 'whey-native', 'whey-native', 'game-changer']).map((x) => x.handle)
    expect(ordre[0]).toBe('whey-native')
    expect(ordre.filter((h) => h === 'whey-native')).toHaveLength(1)
    expect(ordre).toHaveLength(avecPrecommande.length)
  })
  it('sans vedettes : ordre des ventes inchangé', () => {
    expect(vedettesDabord(ventes, [])).toEqual(ventes)
  })
  it('pages de 12 : aucun produit en double ni perdu', () => {
    const catalogue = Array.from({ length: 113 }, (_, i) => p(`produit-${i}`, i % 9 !== 0))
    const ordre = ordreCatalogue(vedettesDabord(catalogue, ['produit-50', 'produit-9', 'produit-3', 'produit-112']))
    const pages = Array.from({ length: nombreDePages(ordre.length) }, (_, i) => pageCatalogue(ordre, i + 1) ?? [])
    const vus = pages.flat().map((x) => x.handle)
    expect(vus).toHaveLength(113)
    expect(new Set(vus).size).toBe(113)
    expect(vus.slice(0, 3)).toEqual(['produit-50', 'produit-3', 'produit-112'])
  })
})
