import { describe, it, expect } from 'vitest'
import { stockBoutique, type VarianteStock } from './stock-boutique'

const COIGNIERES = 'gid://shopify/Location/119350657366'
const DEPOT = 'gid://shopify/Location/123652374870'

const niveau = (id: string, quantity: number) => ({ location: { id }, quantities: [{ name: 'available', quantity }] })

describe('stockBoutique', () => {
  it('produit simple : quantité disponible à la boutique, jamais celle du dépôt', () => {
    const v: VarianteStock = {
      id: 'v1',
      title: 'Dark Chocolate Peanut Butter',
      inventoryItem: { inventoryLevels: { nodes: [niveau(COIGNIERES, 5), niveau(DEPOT, 12)] } },
    }
    expect(stockBoutique(v, COIGNIERES)).toBe(5)
    expect(stockBoutique(v, 'gid://shopify/Location/0')).toBe(0)
  })

  it('coffret : composant le moins disponible calculé par Shopify, pas le niveau vide du parent', () => {
    const v: VarianteStock = {
      id: 'v2',
      title: 'Default Title',
      requiresComponents: true,
      sellableOnlineQuantity: 5,
      inventoryItem: { inventoryLevels: { nodes: [{ location: { id: COIGNIERES }, quantities: [] }] } },
    }
    expect(stockBoutique(v, COIGNIERES)).toBe(5)
  })

  it('coffret sans valeur ou négatif : 0', () => {
    const base = { id: 'v3', title: 'x', requiresComponents: true, inventoryItem: { inventoryLevels: { nodes: [] } } }
    expect(stockBoutique({ ...base, sellableOnlineQuantity: null }, COIGNIERES)).toBe(0)
    expect(stockBoutique({ ...base, sellableOnlineQuantity: -2 }, COIGNIERES)).toBe(0)
  })
})
