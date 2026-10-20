import { describe, expect, it } from 'vitest'
import { CSS_HALLOWEEN } from '../halloween/styles'
import { CSS_NOEL } from '../noel/styles'
import { cssGuirlande } from './guirlande'
import { particules } from './particules'

describe('scène de saison', () => {
  it('particules : suite fixe (même rendu serveur et navigateur), sans valeur invalide', () => {
    const o = { taille: 8, pas: 1.5, opacites: ['0.75', '0.85'], duree: 13, derive: 14, tour: 260, graine: 3 }
    const a = particules(18, o)
    expect(a).toHaveLength(18)
    expect(particules(18, o)).toEqual(a)
    for (const p of a) {
      expect(Object.values(p).join(' ')).not.toMatch(/NaN|undefined|Infinity/)
      expect(p['--tour']).toMatch(/^-?\d+deg$/)
    }
    expect(particules(4, { ...o, tour: undefined })[0]).not.toHaveProperty('--tour')
  })

  it('guirlande : motif, halos en alternance, barre sous l’en-tête effacée au défilement', () => {
    const { motif, css } = cssGuirlande({
      fil: '#2A2233',
      forme: 'lanterne',
      lumieres: [
        { x: 15, y: 5.6, couleur: '#E8711A' },
        { x: 45, y: 11.6, couleur: '#4B2A6B', halo: '#A77BDB' },
        { x: 75, y: 11.6, couleur: '#E8711A' },
        { x: 105, y: 5.6, couleur: '#FFF3C4' },
      ],
    })
    // Image écrite une seule fois (variable CSS), reprise par l'en-tête et les bandeaux.
    expect(motif).toBe('var(--sz-guirlande)')
    expect(css.match(/--sz-guirlande:url\("data:image\/svg\+xml,/g)).toHaveLength(1)
    expect(css).toContain('.sz-guirlande{')
    expect(css).toContain('header[data-defile] .saison-entete::before')
    expect(css).toContain('%23A77BDB')
    expect(css).toContain('prefers-reduced-motion:no-preference')
  })

  it('CSS des thèmes : règles communes, images encodées, mouvement réduit respecté', () => {
    for (const css of [CSS_NOEL, CSS_HALLOWEEN]) {
      expect(css).toContain('.sz-chute{')
      expect(css).toContain('.sz-guirlande{')
      expect(css).toContain('[data-pause]')
      // Toute animation est déclarée dans un bloc prefers-reduced-motion.
      const horsBloc = css.replace(/@media \(prefers-reduced-motion:no-preference\)\{[\s\S]*?\n\}/g, '')
      expect(horsBloc).not.toMatch(/[{;]animation:(?!none)/)
      // Aucune image SVG non encodée (< ou " dans une url()).
      expect(css).not.toMatch(/url\("data:image\/svg\+xml,[^"]*</)
    }
    expect(CSS_HALLOWEEN).not.toMatch(/mask/)
  })
})
