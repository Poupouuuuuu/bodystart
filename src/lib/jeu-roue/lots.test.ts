import { describe, it, expect } from 'vitest'
import { LOTS, lotById, lotLabelClient, lotLabelRemise } from './lots'

describe('parfums des lots', () => {
  it('une entrée par variante ciblée, ni plus ni moins (changer les variantes oblige à mettre les parfums à jour)', () => {
    for (const lot of LOTS.filter((l) => l.parfums)) {
      expect([...lot.parfums!.map((p) => p.variant)].sort()).toEqual([...(lot.variants ?? [])].sort())
    }
  })

  it('Crunch Bar : libellé client et titre de remise avec les parfums couverts', () => {
    const crunch = lotById('crunch-bar')!
    expect(lotLabelClient(crunch)).toBe(
      'Une barre Crunch Bar au choix : Dark Chocolate Peanut Butter, Peanut Butter Cup ou Chocolate Chip Cookie Dough'
    )
    expect(lotLabelRemise(crunch)).toBe('Une barre Crunch Bar (Dark Choco PB, PB Cup ou Cookie Dough)')
    expect(crunch.wheelLabel).toBe('Crunch Bar')
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
