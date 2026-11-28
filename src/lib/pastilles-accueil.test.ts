import { describe, it, expect } from 'vitest'
import { pastillesDesProduits } from './pastilles-accueil'

const CREATINE = 'gid://shopify/ProductVariant/111'
const produit = (id: string, variantes: string[]) => ({ id, variants: { nodes: variantes.map((v) => ({ id: v })) } })

describe('pastillesDesProduits', () => {
  it('pastille sur le produit dont une variante est le cadeau, avec la fin de la période', () => {
    const offres = { [CREATINE]: { libelle: 'Offerte dès 100 €', fin: '2026-11-28T22:59:59Z' } }
    expect(pastillesDesProduits(offres, [produit('p-creatine', [CREATINE]), produit('p-whey', ['gid://shopify/ProductVariant/222'])])).toEqual({
      'p-creatine': { texte: 'Offerte dès 100 €', fin: '2026-11-28T22:59:59Z' },
    })
  })

  it('rien sans offres (paliers illisibles ou hors période)', () => {
    expect(pastillesDesProduits(null, [produit('p-creatine', [CREATINE])])).toEqual({})
    expect(pastillesDesProduits({}, [produit('p-creatine', [CREATINE])])).toEqual({})
  })
})
