import { describe, it, expect } from 'vitest'
import { composerSelection } from './selection-saison'

const p = (handle: string, availableForSale = true) => ({ handle, availableForSale })
const handles = (l: { handle: string }[]) => l.map((x) => x.handle)

const PACKS = [p('pack-a'), p('pack-b', false), p('pack-c'), p('pack-d'), p('pack-e')]
const MEILLEURES = [p('whey'), p('creatine'), p('pack-a'), p('barre', false), p('omega'), p('bcaa')]

describe('sélection de saison', () => {
  it('3 packs en stock, puis 3 meilleures ventes ni packs ni déjà affichées', () => {
    const r = composerSelection(PACKS, MEILLEURES, ['whey'])
    expect(handles(r.packs)).toEqual(['pack-a', 'pack-c', 'pack-d'])
    expect(handles(r.produits)).toEqual(['creatine', 'omega', 'bcaa'])
  })

  it('un pack épuisé n’est pas proposé, même parmi les meilleures ventes', () => {
    const r = composerSelection([p('pack-a', false), p('pack-c')], MEILLEURES, [])
    expect(handles(r.packs)).toEqual(['pack-c'])
    expect(handles(r.produits)).toEqual(['whey', 'creatine', 'omega'])
  })

  it('moins de 4 produits : rien', () => {
    expect(composerSelection([p('pack-a')], [p('whey')], [])).toEqual({ packs: [], produits: [] })
  })
})
