import { describe, it, expect } from 'vitest'
import { LOTS, LOTS_RETIRES, estRetire, lotById, lotLabelClient, lotLabelRemise, partsDeRoue, type Lot } from './lots'

const TOUS: Lot[] = [...LOTS, ...LOTS_RETIRES]

describe('lots du tirage (03/11/2026)', () => {
  it('4 lots : canette 40, barre au choix 25, shaker 20, 5 € dès 30 € 15, total 100', () => {
    expect(LOTS.map((l) => [l.id, l.weight])).toEqual([
      ['canette-abe', 40],
      ['crunch-bar', 25],
      ['shaker', 20],
      ['bon-5', 15],
    ])
    expect(LOTS.reduce((s, l) => s + l.weight, 0)).toBe(100)
  })

  it('créatine et whey retirées : hors tirage, poids 0, encore lues pour les codes déjà émis', () => {
    expect(LOTS_RETIRES.map((l) => [l.id, l.weight])).toEqual([
      ['creatine', 0],
      ['whey', 0],
    ])
    expect(LOTS.some((l) => (l.id as string) === 'creatine' || (l.id as string) === 'whey')).toBe(false)
    expect(lotById('creatine')?.label).toBe('Une créatine Dedicated 500 g')
    expect(estRetire(lotById('whey')!)).toBe(true)
    expect(estRetire(lotById('shaker')!)).toBe(false)
    expect(new Set(TOUS.map((l) => l.id)).size).toBe(TOUS.length)
  })

  it('roue : 8 parts, chaque lot du tirage deux fois en face à face, jamais deux parts voisines identiques', () => {
    const parts = partsDeRoue(LOTS)
    expect(parts).toHaveLength(8)
    expect(parts.every((p) => LOTS.includes(p))).toBe(true)
    for (const lot of LOTS) expect(parts.filter((p) => p === lot)).toHaveLength(2)
    parts.forEach((p, i) => {
      expect(parts[(i + 1) % parts.length]).not.toBe(p)
      expect(parts[(i + 4) % parts.length]).toBe(p)
    })
    expect(partsDeRoue([])).toEqual([])
  })
})

describe('parfums des lots', () => {
  it('lots ciblés par variantes : une entrée par variante ciblée, ni plus ni moins (changer les variantes oblige à mettre les parfums à jour)', () => {
    const parVariantes = TOUS.filter((l) => l.parfums)
    expect(parVariantes.map((l) => l.id)).toEqual(['whey'])
    for (const lot of parVariantes) {
      expect(lot.products ?? []).toEqual([])
      expect([...lot.parfums!.map((p) => p.variant)].sort()).toEqual([...(lot.variants ?? [])].sort())
    }
  })

  it('barre au choix : Crunch Bar, Smart Bar et Applied Crunch entières (tous parfums), sans liste de parfums', () => {
    const crunch = lotById('crunch-bar')!
    expect(crunch.products).toEqual(['gid://shopify/Product/10832196010326', 'gid://shopify/Product/11371642061142', 'gid://shopify/Product/11371642093910'])
    expect(crunch.variants).toBeUndefined()
    expect(lotLabelClient(crunch)).toBe('Une barre protéinée au choix (Crunch Bar, Smart Bar ou Applied Crunch)')
    expect(lotLabelRemise(crunch)).toBe('Une barre protéinée au choix (Crunch Bar, Smart Bar ou Applied Crunch)')
    expect(crunch.wheelLabel).toBe('Barre au choix')
    expect([crunch.amount, crunch.weight]).toEqual([2.9, 25])
  })

  it('whey (retirée, codes déjà émis) : les 4 parfums du lot, noms tels que dans Shopify', () => {
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
