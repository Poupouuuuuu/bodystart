import { describe, it, expect } from 'vitest'
import { parsePaliers } from '@/lib/paliers'
import { pastillesCadeaux } from './pastilles-accueil'

const CREATINE = 'gid://shopify/ProductVariant/111'
const CONFIG = parsePaliers(
  JSON.stringify({
    periodes: [
      {
        nom: 'Black Week',
        du: '2026-11-22T23:00:00Z',
        au: '2026-11-28T22:59:59Z',
        paliers: [
          { montant: 85, type: 'livraison', libelle: 'Livraison offerte' },
          { montant: 100, type: 'cadeau', libelle: 'Créatine offerte', variantes: [{ id: CREATINE, nom: 'Créatine 500 g' }] },
        ],
      },
    ],
  })
)

const produit = (id: string, variantes: { id: string; availableForSale?: boolean }[]) => ({ id, variants: { nodes: variantes } })
const creatine = produit('p-creatine', [{ id: CREATINE, availableForSale: true }])
const whey = produit('p-whey', [{ id: 'gid://shopify/ProductVariant/222', availableForSale: true }])

describe('pastillesCadeaux', () => {
  it('pastille sur le cadeau du palier pendant la période, avec sa fin', () => {
    const r = pastillesCadeaux(CONFIG, new Date('2026-11-28T10:00:00Z'), [creatine, whey])
    expect(r.pastilles).toEqual({ 'p-creatine': 'Offerte dès 100 €' })
    expect(r.fin).toBe('2026-11-28T22:59:59Z')
  })

  it('rien après la période ni sans configuration', () => {
    expect(pastillesCadeaux(CONFIG, new Date('2026-11-28T23:00:00Z'), [creatine]).pastilles).toEqual({})
    expect(pastillesCadeaux(null, new Date('2026-11-28T10:00:00Z'), [creatine])).toEqual({ pastilles: {}, fin: null })
  })

  it('rien si la variante cadeau est épuisée', () => {
    const epuisee = produit('p-creatine', [{ id: CREATINE, availableForSale: false }])
    expect(pastillesCadeaux(CONFIG, new Date('2026-11-28T10:00:00Z'), [epuisee]).pastilles).toEqual({})
  })
})
