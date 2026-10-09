import { describe, it, expect } from 'vitest'
import { LOTS, lotById, lotLabelClient, lotLabelRemise } from './lots'

describe('parfums des lots', () => {
  it('lots ciblés par variantes : une entrée par variante ciblée, ni plus ni moins (changer les variantes oblige à mettre les parfums à jour)', () => {
    const parVariantes = LOTS.filter((l) => l.parfums)
    expect(parVariantes.map((l) => l.id)).toEqual(['whey'])
    for (const lot of parVariantes) {
      expect(lot.products ?? []).toEqual([])
      expect([...lot.parfums!.map((p) => p.variant)].sort()).toEqual([...(lot.variants ?? [])].sort())
    }
  })

  it('Crunch Bar : produit entier (tous parfums), libellé sans liste de parfums', () => {
    const crunch = lotById('crunch-bar')!
    expect(crunch.products).toEqual(['gid://shopify/Product/10832196010326'])
    expect(crunch.variants).toBeUndefined()
    expect(lotLabelClient(crunch)).toBe('Une barre Crunch Bar (parfum au choix)')
    expect(lotLabelRemise(crunch)).toBe('Une barre Crunch Bar (parfum au choix)')
    expect(crunch.wheelLabel).toBe('Crunch Bar')
    expect([crunch.amount, crunch.weight]).toEqual([2.9, 25])
  })

  it('whey : les 4 parfums du lot, noms tels que dans Shopify', () => {
    const whey = lotById('whey')!
    expect(lotLabelClient(whey)).toBe('Une whey Protimuscle 1 kg au choix : Chocolat, Vanille, Choco-cookie ou Fraise')
    expect(lotLabelRemise(whey)).toBe('Une whey Protimuscle 1 kg (Chocolat, Vanille, Choco-cookie ou Fraise)')
  })

  it('lot sans parfums : libellé inchangé', () => {
    const shaker = lotById('shaker')!
    expect(lotLabelClient(shaker)).toBe('Un shaker')
    expect(lotLabelRemise(shaker)).toBe('Un shaker')
  })
})
