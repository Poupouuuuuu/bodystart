import { describe, it, expect } from 'vitest'
import { familyOf, homeBestSellers, isAutoPromotable, pickComplements } from './merchandising'

// Types et marques réels du catalogue (08/10/2026).
const p = (handle: string, productType: string, vendor = 'DY Nutrition', tags: string[] = [], availableForSale = true) => ({
  handle, productType, vendor, tags, availableForSale,
})
const POOL = [
  p('iso-zero-100-whey', 'Protéines', 'Eric Favre'),
  p('whey-native-protimuscle', 'Protéines', 'Nutrimuscle'),
  p('shadowhey-isolate', 'Protéines'),
  p('mutant-mass', 'Protéines', 'Mutant', ['gainer']),
  p('clear-pro-creatine', 'Créatine', 'Eric Favre'),
  p('creatine-dedicated', 'Créatine', 'Dedicated'),
  p('creatine-dy', 'Créatine'),
  p('shaker-eric-favre', 'Accessoires', 'Eric Favre', ['shaker']),
  p('shaker-skill', 'Accessoires', 'Skill Nutrition', ['shaker']),
  p('t-shirt', 'Accessoires', 'MuscleTech', ['vetement']),
  p('cream-of-rice', 'Glucides', 'Trained by JP'),
  p('crunch-bar', 'Barres protéinées', 'Warrior'),
  p('critical-cookie', 'Snacks', 'Applied Nutrition'),
  p('french-pump', 'Pré-workout', 'French Nutrition'),
  p('c4-energy', 'Boissons', 'Cellucor'),
  p('creatine-epuisee', 'Créatine', 'Mutant', [], false),
]

describe('marques exclues des blocs automatiques', () => {
  it('Eric Favre et French Nutrition, casse et accents ignorés', () => {
    expect(isAutoPromotable({ vendor: 'Eric Favre' })).toBe(false)
    expect(isAutoPromotable({ vendor: 'french nutrition' })).toBe(false)
    expect(isAutoPromotable({ vendor: 'Nutrimuscle' })).toBe(true)
    expect(isAutoPromotable({ vendor: null })).toBe(true)
  })
})

describe('familyOf', () => {
  it('type Shopify, gainer et shaker par étiquette', () => {
    expect(familyOf(p('x', 'Protéines'))).toBe('proteine')
    expect(familyOf(p('x', 'Protéines', 'Mutant', ['gainer']))).toBe('gainer')
    expect(familyOf(p('x', 'Accessoires', 'x', ['shaker']))).toBe('shaker')
    expect(familyOf(p('x', 'Accessoires', 'x', ['vetement']))).toBe('accessoire')
    expect(familyOf(p('x', 'Barres protéinées'))).toBe('collation')
    expect(familyOf(p('x', 'Snacks'))).toBe('collation')
    expect(familyOf(p('x', 'Boosters'))).toBe('pre-workout')
    expect(familyOf({ productType: null })).toBe('autre')
  })
})

describe('pickComplements', () => {
  it('sous une whey : créatine, shaker, crème de riz, collation, jamais une whey ni un gainer', () => {
    const out = pickComplements(POOL[1], POOL).map((x) => x.handle)
    expect(out).toEqual(['creatine-dedicated', 'shaker-skill', 'cream-of-rice', 'crunch-bar'])
  })
  it('marques exclues et produits épuisés jamais proposés', () => {
    const out = pickComplements(p('whey', 'Protéines'), POOL, 10).map((x) => x.handle)
    expect(out).not.toContain('clear-pro-creatine')
    expect(out).not.toContain('shaker-eric-favre')
    expect(out).not.toContain('creatine-epuisee')
  })
  it('un seul produit par famille, quitte à en proposer moins', () => {
    const out = pickComplements(p('whey', 'Protéines'), POOL, 10).map((x) => x.handle)
    expect(out).toEqual(['creatine-dedicated', 'shaker-skill', 'cream-of-rice', 'crunch-bar'])
  })
  it('sous une créatine : protéine, shaker, collation seulement (ni 2ᵉ protéine ni autre créatine)', () => {
    const out = pickComplements(POOL[5], POOL).map((x) => x.handle)
    expect(out).toEqual(['whey-native-protimuscle', 'shaker-skill', 'crunch-bar'])
  })
})

describe('homeBestSellers', () => {
  it('Whey Native Protimuscle en tête, marques exclues retirées', () => {
    const out = homeBestSellers(POOL).map((x) => x.handle)
    expect(out[0]).toBe('whey-native-protimuscle')
    expect(out).not.toContain('iso-zero-100-whey')
    expect(out).not.toContain('french-pump')
    expect(out.filter((h) => h === 'whey-native-protimuscle')).toHaveLength(1)
  })
  it('carte mise en avant hors des meilleures ventes : ajoutée en tête', () => {
    const featured = p('whey-native-protimuscle', 'Protéines', 'Nutrimuscle')
    const out = homeBestSellers([POOL[6], POOL[10]], featured).map((x) => x.handle)
    expect(out).toEqual(['whey-native-protimuscle', 'creatine-dy', 'cream-of-rice'])
  })
  it('carte mise en avant épuisée : pas en tête', () => {
    const featured = p('whey-native-protimuscle', 'Protéines', 'Nutrimuscle', [], false)
    expect(homeBestSellers([POOL[6]], featured).map((x) => x.handle)).toEqual(['creatine-dy'])
  })
})
