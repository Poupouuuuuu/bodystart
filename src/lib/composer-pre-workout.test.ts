import { describe, expect, it } from 'vitest'
import { liensComposerPreWorkout, type ProduitComposable } from './composer-pre-workout'

// Fiches du site au 21/11/2026 (Storefront), meilleures ventes d'abord.
const p = (o: Partial<ProduitComposable> & Pick<ProduitComposable, 'handle' | 'title'>): ProduitComposable => ({
  productType: 'Acides aminés',
  vendor: 'Applied Nutrition',
  tags: [],
  availableForSale: true,
  description: '',
  ...o,
})

const CATALOGUE: ProduitComposable[] = [
  p({ handle: 'citrulline-malate-2-1-applied-nutrition-poudre-300-g', title: 'Citrulline Malate 2:1 Applied Nutrition - Poudre 300 g', tags: ['citrulline', 'pump', 'relance-95'] }),
  p({ handle: 'one-raw-citrulline-dl-malate', title: 'One Raw Citrulline DL-Malate', vendor: 'Zoomad', tags: ['citrulline', 'pump', 'sans cafeine'] }),
  p({ handle: 'l-citrulline', title: 'L-Citrulline', vendor: 'Dedicated', tags: ['citrulline', 'pump'], availableForSale: false }),
  p({ handle: 'l-arginine-1500-gelules', title: 'L-Arginine 1500 - Gélules', tags: ['arginine', 'citrulline', 'pump', 'vegan'] }),
  p({ handle: 'l-citrulline-1500-gelules', title: 'L-Citrulline 1500 - Gélules', tags: ['citrulline', 'pump', 'sans cafeine', 'vegan'] }),
  p({ handle: 'dedicated-nutrition-beta-alanine', title: 'Beta-Alanine', vendor: 'Dedicated', tags: ['beta-alanine', 'pre-workout', 'pump'] }),
  p({ handle: 'c4-energy-shot-shot-pre-workout-60-ml', title: 'C4 Energy Shot - Shot Pré-Workout 60 ml', productType: 'Boissons', vendor: 'Cellucor', tags: ['energy', 'preworkout', 'shot'], availableForSale: false }),
  p({ handle: 'rage-energy-shot-pre-workout-liquide', title: 'Rage Energy Shot - Pré-Workout Liquide', productType: 'Boissons', vendor: 'Warrior', tags: ['boisson', 'energy', 'pre-workout'], description: 'Shot liquide avec caféine…' }),
  p({ handle: 'pump-nitric-oxide-booster', title: 'Pump - Pré-workout sans caféine', productType: 'Pré-workout', vendor: 'Warrior', tags: ['pump'] }),
]

const handles = (produits: ProduitComposable[]) => liensComposerPreWorkout(produits).map((l) => `${l.cle}:${l.handle}`)

describe('liensComposerPreWorkout', () => {
  it('catalogue du 21/11/2026 : L-citrulline pure en stock, bêta-alanine, shot Rage', () => {
    expect(liensComposerPreWorkout(CATALOGUE)).toEqual([
      { cle: 'citrulline', libelle: 'L-citrulline', handle: 'l-citrulline-1500-gelules', titre: 'L-Citrulline 1500 - Gélules' },
      { cle: 'beta-alanine', libelle: 'Bêta-alanine', handle: 'dedicated-nutrition-beta-alanine', titre: 'Beta-Alanine' },
      { cle: 'shot', libelle: 'Shot pré-workout avec caféine', handle: 'rage-energy-shot-pre-workout-liquide', titre: 'Rage Energy Shot - Pré-Workout Liquide' },
    ])
  })

  it('jamais de malate de citrulline ni la L-Arginine, même en stock', () => {
    const sansCitrullinePure = CATALOGUE.filter((x) => x.handle !== 'l-citrulline-1500-gelules')
    expect(handles(sansCitrullinePure)).toEqual(['beta-alanine:dedicated-nutrition-beta-alanine', 'shot:rage-energy-shot-pre-workout-liquide'])
  })

  it('L-Citrulline Dedicated revenue en stock : la première dans l’ordre des ventes', () => {
    const stock = CATALOGUE.map((x) => (x.handle === 'l-citrulline' ? { ...x, availableForSale: true } : x))
    expect(handles(stock)[0]).toBe('citrulline:l-citrulline')
  })

  it('une ligne disparaît quand plus rien n’est en stock', () => {
    const rupture = CATALOGUE.map((x) => (x.handle === 'dedicated-nutrition-beta-alanine' || x.handle.includes('shot') ? { ...x, availableForSale: false } : x))
    expect(handles(rupture)).toEqual(['citrulline:l-citrulline-1500-gelules'])
    expect(liensComposerPreWorkout(CATALOGUE.map((x) => ({ ...x, availableForSale: false })))).toEqual([])
    expect(liensComposerPreWorkout([])).toEqual([])
  })

  it('shot de secours : le C4 quand il revient en stock et que le Rage est épuisé', () => {
    const stock = CATALOGUE.map((x) =>
      x.handle.startsWith('c4-') ? { ...x, availableForSale: true } : x.handle.startsWith('rage-') ? { ...x, availableForSale: false } : x
    )
    expect(handles(stock)[2]).toBe('shot:c4-energy-shot-shot-pre-workout-60-ml')
  })

  it('shot sans caféine attestée, marque exclue ou réserve : jamais', () => {
    const autres = [
      p({ handle: 'shot-zen', title: 'Zen Shot', productType: 'Boissons', vendor: 'X', tags: ['boisson'] }),
      p({ handle: 'shot-favre', title: 'Energy Shot', productType: 'Boissons', vendor: 'Eric Favre', tags: ['energy'] }),
      p({ handle: 'shot-pwo', title: 'PWO Shot', productType: 'Pré-workout', vendor: 'X', tags: ['energy'] }),
      p({ handle: 'beta-favre', title: 'Beta-Alanine', vendor: 'Eric Favre', tags: ['beta-alanine'] }),
    ]
    expect(liensComposerPreWorkout(autres)).toEqual([])
  })

  it('caféine lue dans la description, accents ignorés', () => {
    const shot = p({ handle: 'shot-cafe', title: 'Focus Shot', productType: 'Boissons', vendor: 'X', tags: ['boisson'], description: '200 mg de CAFÉINE par shot' })
    expect(handles([shot])).toEqual(['shot:shot-cafe'])
  })
})
