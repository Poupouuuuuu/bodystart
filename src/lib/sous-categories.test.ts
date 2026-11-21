import { describe, expect, it } from 'vitest'
import { dansSousCategorie, PRIORITE_PROTEINES, sousCategoriesDe, type SousCategorie } from './sous-categories'

// Mêmes pastilles que ProductsPageClient (Protéines).
const PROTEINES: SousCategorie[] = [
  { key: 'whey', label: 'Whey', tags: ['whey'] },
  { key: 'isolate', label: 'Isolate', tags: ['isolate'] },
  { key: 'mix', label: 'Mix', tags: ['mix'] },
  { key: 'clear-whey', label: 'Clear whey', tags: ['clear-whey'] },
  { key: 'gainer', label: 'Gainer', tags: ['gainer'] },
  { key: 'vegetale', label: 'Végétale et œuf', tags: ['vegan', 'oeuf'] },
]

// Étiquettes des 21 Protéines visibles sur le site, relevé Storefront du
// 21/11/2026 (Musclewhey avec l'étiquette mix posée le jour même, décision Boutique).
const RELEVE: Record<string, string[]> = {
  'iso-fusion-protein': ['caseine', 'isolate', 'mix', 'relance-55', 'whey'],
  'clear-whey-isolate-500-g': ['clear-whey', 'isolate', 'proteine', 'relance-25', 'whey'],
  'whey-native-protimuscle': ['caseine', 'mix', 'relance-25', 'whey'],
  'isolate-native-whey-mix-musclewhey': ['isolate', 'mix', 'relance-25', 'whey'],
  'clear-fusion-proteine-claire-amp-collagene': ['clear-whey', 'collagene', 'proteine', 'relance-25', 'whey'],
  'iso-zero-100-whey': ['isolate', 'relance-40', 'whey'],
  'isolate-zero-per4m-whey-isolate': ['isolate', 'proteine', 'relance-55', 'whey'],
  'native-iso-blend': ['isolate', 'relance-25', 'whey'],
  'mutant-mass': ['gainer', 'relance-25'],
  'metabolic-mass-gainer-6-kg': ['gainer', 'prise-de-masse', 'proteine', 'relance-40'],
  'game-changer-mass-gainer-3-kg': ['gainer', 'prise-de-masse', 'proteine', 'relance-25'],
  'critical-mass-gainer-6-kg': ['gainer', 'prise-de-masse', 'proteine', 'relance-40'],
  'iso-french-vegan': ['relance-25', 'vegan'],
  'tri-source-protein-vegan': ['relance-40', 'vegan'],
  'proteine-doeuf-en-poudre': ['oeuf', 'relance-25'],
  'whey-optimax-protein': ['relance-40', 'whey'],
  'beauty-shape-proteine-collagene': ['relance-25', 'whey'],
  'shadowhey-100-whey-protein-2-kg': ['proteine', 'relance-55', 'whey'],
  'shadowhey-concentrate-whey-concentree-2-kg': ['concentre', 'relance-55', 'whey'],
  'mutant-whey-proteine-2-27-kg': ['proteine', 'relance-55', 'whey'],
  'whey-protein-per4m-2-01-kg': ['proteine', 'relance-55', 'whey'],
}

const pastille = (tags: string[]) => sousCategoriesDe(tags, PROTEINES, PRIORITE_PROTEINES)

describe('sousCategoriesDe : pastilles Protéines exclusives (21/11/2026)', () => {
  it('ordre : Végétale et œuf > Mix > Clear whey > Isolate > Gainer > Whey', () => {
    expect(pastille(RELEVE['iso-fusion-protein'])).toEqual(['mix'])
    expect(pastille(RELEVE['whey-native-protimuscle'])).toEqual(['mix'])
    expect(pastille(RELEVE['isolate-native-whey-mix-musclewhey'])).toEqual(['mix'])
    expect(pastille(RELEVE['clear-whey-isolate-500-g'])).toEqual(['clear-whey'])
    expect(pastille(RELEVE['clear-fusion-proteine-claire-amp-collagene'])).toEqual(['clear-whey'])
    expect(pastille(RELEVE['native-iso-blend'])).toEqual(['isolate'])
    expect(pastille(RELEVE['shadowhey-concentrate-whey-concentree-2-kg'])).toEqual(['whey'])
    expect(pastille(['gainer', 'whey'])).toEqual(['gainer'])
    expect(pastille(['vegan', 'isolate'])).toEqual(['vegetale'])
    expect(pastille(['oeuf'])).toEqual(['vegetale'])
  })

  it('casse et accents ignorés, rien sans étiquette de sous-catégorie', () => {
    expect(pastille(['Whey', 'ISOLATE'])).toEqual(['isolate'])
    expect(pastille(['relance-25', 'proteine'])).toEqual([])
    expect(pastille([])).toEqual([])
    expect(sousCategoriesDe(null, PROTEINES, PRIORITE_PROTEINES)).toEqual([])
  })

  it('relevé du 21/11/2026 : une seule pastille par fiche, comptes attendus', () => {
    const comptes: Record<string, number> = {}
    for (const tags of Object.values(RELEVE)) {
      const p = pastille(tags)
      expect(p).toHaveLength(1)
      comptes[p[0]] = (comptes[p[0]] ?? 0) + 1
    }
    expect(comptes).toEqual({ whey: 6, isolate: 3, mix: 3, 'clear-whey': 2, gainer: 4, vegetale: 3 })
  })

  it("l'ordre Protéines couvre toutes les pastilles", () => {
    expect([...PRIORITE_PROTEINES].sort()).toEqual(PROTEINES.map((s) => s.key).sort())
  })

  it('sans ordre : cumul (autres rayons)', () => {
    const aa: SousCategorie[] = [
      { key: 'citrulline', label: 'Citrulline', tags: ['citrulline'] },
      { key: 'beta-alanine', label: 'Bêta-alanine', tags: ['beta-alanine'] },
    ]
    expect(sousCategoriesDe(['citrulline', 'beta-alanine', 'pump'], aa)).toEqual(['citrulline', 'beta-alanine'])
    expect(sousCategoriesDe(['arginine', 'citrulline', 'pump'], aa)).toEqual(['citrulline'])
  })

  it('une pastille absente de l’ordre reste cumulable', () => {
    expect(sousCategoriesDe(['whey', 'isolate', 'bio'], [...PROTEINES, { key: 'bio', label: 'Bio', tags: ['bio'] }], PRIORITE_PROTEINES)).toEqual([
      'isolate',
      'bio',
    ])
  })
})

describe('dansSousCategorie', () => {
  it('un isolat étiqueté whey ne sort plus sous Whey', () => {
    expect(dansSousCategorie(RELEVE['iso-zero-100-whey'], 'isolate', PROTEINES, PRIORITE_PROTEINES)).toBe(true)
    expect(dansSousCategorie(RELEVE['iso-zero-100-whey'], 'whey', PROTEINES, PRIORITE_PROTEINES)).toBe(false)
    expect(dansSousCategorie(RELEVE['whey-optimax-protein'], 'whey', PROTEINES, PRIORITE_PROTEINES)).toBe(true)
  })
})
