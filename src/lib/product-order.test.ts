import { describe, it, expect } from 'vitest'
import { availableFirst } from './product-order'

type P = { id: string; availableForSale?: boolean }

describe('availableFirst — épuisés toujours en fin de liste', () => {
  it('déplace les épuisés à la fin en conservant l\'ordre relatif des deux groupes (stable)', () => {
    const items: P[] = [
      { id: 'a', availableForSale: true },
      { id: 'b', availableForSale: false },
      { id: 'c', availableForSale: true },
      { id: 'd', availableForSale: false },
      { id: 'e', availableForSale: true },
    ]
    expect(availableFirst(items).map((p) => p.id)).toEqual(['a', 'c', 'e', 'b', 'd'])
  })

  it('traite availableForSale absent (undefined) comme disponible', () => {
    const items: P[] = [
      { id: 'a', availableForSale: false },
      { id: 'b' },
      { id: 'c', availableForSale: true },
    ]
    expect(availableFirst(items).map((p) => p.id)).toEqual(['b', 'c', 'a'])
  })

  it('ne mute pas le tableau d\'entrée', () => {
    const items: P[] = [
      { id: 'a', availableForSale: false },
      { id: 'b', availableForSale: true },
    ]
    const before = items.map((p) => p.id)
    availableFirst(items)
    expect(items.map((p) => p.id)).toEqual(before)
  })

  it('gère les cas limites : liste vide, tout disponible, tout épuisé', () => {
    expect(availableFirst([])).toEqual([])
    const allOk: P[] = [{ id: 'a', availableForSale: true }, { id: 'b', availableForSale: true }]
    expect(availableFirst(allOk).map((p) => p.id)).toEqual(['a', 'b'])
    const allOut: P[] = [{ id: 'a', availableForSale: false }, { id: 'b', availableForSale: false }]
    expect(availableFirst(allOut).map((p) => p.id)).toEqual(['a', 'b'])
  })
})
