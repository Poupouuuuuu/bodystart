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

  it('lot sans parfums : libellé inchangé', () => {
    const shaker = lotById('shaker')!
    expect(lotLabelClient(shaker)).toBe('Un shaker')
    expect(lotLabelRemise(shaker)).toBe('Un shaker')
  })
})
