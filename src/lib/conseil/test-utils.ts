// Aides de test du guide /conseil (importées uniquement par les *.test.ts).
// Fixtures : copie du metafield `bodystart.guide_conseil` et des produits
// Storefront au 08/10/2026. Le stock y est fixé par chaque test.

import guideBrut from './fixtures/guide-conseil-2026-10-08.json'
import produitsBruts from './fixtures/produits-storefront-2026-10-08.json'
import { parseGuide } from './guide'
import type { Catalogue, Guide, Image, Reponses } from './types'

interface ProduitFixture {
  titre: string
  image: Image | null
  variantes: { id: string; titre: string; prixCents: number }[]
}

export const GUIDE_BRUT = guideBrut
export const PRODUITS = produitsBruts as Record<string, ProduitFixture>
export const guide: Guide = parseGuide(guideBrut)

/** Stock par handle et titre de variante (5 partout par défaut). */
export type StockFn = (handle: string, titreVariante: string) => number

export interface OptionsCatalogue {
  stock?: StockFn
  /** Prix forcé (centimes) par handle et titre de variante. */
  prix?: (handle: string, titreVariante: string) => number | undefined
  /** availableForSale forcé à false. */
  invendable?: (handle: string, titreVariante: string) => boolean
  guide?: Guide
}

export function construireCatalogue(options: OptionsCatalogue = {}): Catalogue {
  const g = options.guide ?? guide
  const stock = options.stock ?? (() => 5)
  const c: Catalogue = {}
  for (const [cle, gp] of Object.entries(g.produits)) {
    const p = PRODUITS[gp.handle]
    if (!p) continue
    c[cle] = {
      handle: gp.handle,
      titre: p.titre,
      image: p.image,
      variantes: p.variantes.map((v) => ({
        id: v.id,
        titre: v.titre,
        prixCents: options.prix?.(gp.handle, v.titre) ?? v.prixCents,
        disponible: !options.invendable?.(gp.handle, v.titre),
        stock: stock(gp.handle, v.titre),
        image: null,
      })),
    }
  }
  return c
}

/** Rupture des variantes d'un handle dont le titre contient `motif` (tout le produit sans motif). */
export function rupture(...regles: [handle: string, motif?: string][]): StockFn {
  return (handle, titre) =>
    regles.some(([h, motif]) => h === handle && (motif === undefined || titre.includes(motif))) ? 0 : 5
}

export function reponses(r: Partial<Reponses> & { objectif: string }): Reponses {
  return { seances: '2-3', questionSup: null, contraintes: [], budget: '40-90', ...r }
}

export const HANDLES = {
  whey: 'whey-native-protimuscle',
  musclewhey: 'isolate-native-whey-mix-musclewhey',
  clearwhey: 'clear-whey-isolate-500-g',
  creatine: 'dedicated-nutrition-micronized-creatine-monohydrate',
  mutant: 'mutant-mass',
  magnesium: 'magnesium-bisglycinate-dy-90-capsules',
  zma: 'zn-mg-b6-complex-60-capsules',
  shaker: 'shaker-skill-nutrition-700-ml',
  crunch: 'crunch-bar-barre-proteinee',
  omega3: 'omega-3-fish-oil-epa-dha',
  d3k2: 'vitamin-d3-k2-dy-60-softgels',
  multivit: 'multivitamin-dy-60-comprimes',
} as const
