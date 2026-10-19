import { describe, it, expect } from 'vitest'
import { composerSelection } from './selection-saison'

const p = (handle: string, availableForSale = true) => ({
  handle,
  availableForSale,
})
const handles = (l: { handle: string }[]) => l.map((x) => x.handle)

const PACKS = [p('pack-a'), p('pack-b', false), p('pack-c'), p('pack-d'), p('pack-e')]
const MEILLEURES = [p('whey'), p('creatine'), p('pack-a'), p('barre', false), p('omega'), p('bcaa')]

describe('sélection de saison', () => {
  it('packs en stock d’abord (4 au plus), puis meilleures ventes pas encore affichées', () => {
    const r = composerSelection(PACKS, MEILLEURES, ['whey'])
    expect(handles(r)).toEqual(['pack-a', 'pack-c', 'pack-d', 'pack-e', 'creatine', 'omega'])
  })

  it('sans doublon ni produit épuisé', () => {
    const r = composerSelection([p('pack-a')], MEILLEURES, [])
    expect(handles(r)).toEqual(['pack-a', 'whey', 'creatine', 'omega', 'bcaa'])
  })

  it('moins de 4 produits : rien', () => {
    expect(composerSelection([p('pack-a')], [p('whey')], [])).toEqual([])
  })
})
