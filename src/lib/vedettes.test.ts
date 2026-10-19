import { describe, it, expect } from 'vitest'
import { composerVedettes, eligibleComplement, lireVedettes } from './vedettes'

const p = (handle: string, o: { type?: string; prix?: number; stock?: boolean; vendor?: string; tags?: string[] } = {}) => ({
  handle,
  productType: o.type ?? 'Protéines',
  vendor: o.vendor ?? 'Marque',
  tags: o.tags ?? [],
  availableForSale: o.stock ?? true,
  priceRange: { minVariantPrice: { amount: String(o.prix ?? 40) } },
})
const handles = (l: { handle: string }[]) => l.map((x) => x.handle)

describe('lireVedettes', () => {
  it('handles dans l’ordre, sans doublon ni valeur invalide', () => {
    const v = JSON.stringify({ version: 1, regle: '…', handles: ['iso-zero', 'creatine', 'iso-zero', 42, 'Pas Valide', ''] })
    expect(lireVedettes(v)).toEqual(['iso-zero', 'creatine'])
  })
  it('JSON illisible ou sans handles : rien', () => {
    expect(lireVedettes(null)).toEqual([])
    expect(lireVedettes('{')).toEqual([])
    expect(lireVedettes('{"handles":"iso-zero"}')).toEqual([])
  })
})

describe('composerVedettes', () => {
  it('ordre du metafield, non publiés et épuisés retirés, marque exclue admise', () => {
    const vedettes = [p('iso-zero', { vendor: 'Eric Favre' }), null, p('whey', { stock: false }), p('creatine')]
    expect(handles(composerVedettes(vedettes, [], 2))).toEqual(['iso-zero', 'creatine'])
  })
  it('garde toutes les vedettes même au-delà des places', () => {
    const vedettes = [p('a'), p('b'), p('c')]
    expect(handles(composerVedettes(vedettes, [p('d')], 2))).toEqual(['a', 'b', 'c'])
  })
  it('complète par le complément éligible jusqu’aux places', () => {
    const complement = [
      p('canette', { type: 'Boissons' }),
      p('barre', { type: 'Barres protéinées' }),
      p('cookie', { type: 'Snacks' }),
      p('shaker', { type: 'Accessoires' }),
      p('pas-cher', { prix: 19.9 }),
      p('favre', { vendor: 'Eric Favre' }),
      p('pack', { type: 'Pack' }),
      p('coffret', { type: 'Coffret' }),
      p('epuise', { stock: false }),
      p('a'),
      p('gainer', { prix: 20 }),
      p('omega', { type: 'Santé' }),
    ]
    expect(handles(composerVedettes([p('a')], complement, 3))).toEqual(['a', 'gainer', 'omega'])
  })
  it('seuil de prix inclus à 20 €', () => {
    expect(eligibleComplement(p('x', { prix: 20 }))).toBe(true)
    expect(eligibleComplement(p('x', { prix: 19.99 }))).toBe(false)
  })
})
