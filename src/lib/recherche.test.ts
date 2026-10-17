import { describe, it, expect } from 'vitest'
import { motsRecherche, normaliser, rechercher, type Recherchable } from './recherche'
// Fiches publiées sur le site le 17/10/2026 (titre, marque, type, étiquettes,
// disponibilité), dans l'ordre réel du catalogue (meilleures ventes, épuisés
// à la fin). Descriptions : extraits, seulement sur les accessoires testés.
import catalogue from './fixtures/catalogue-recherche-2026-10-17.json'

type Fiche = Recherchable & { handle: string }
const CAT = catalogue as Fiche[]
const handles = (q: string, n?: number) => rechercher(CAT, q).slice(0, n).map((p) => p.handle)

describe('normalisation', () => {
  it('accents, casse, ponctuation, œ', () => {
    expect(normaliser('Protéine d’Œuf')).toBe('proteine d oeuf')
    expect(normaliser('CRÉATINE')).toBe('creatine')
    expect(normaliser('Pré-workout')).toBe('preworkout')
    expect(normaliser('pre workout')).toBe('preworkout')
    expect(normaliser('Prise de masse')).toBe('gainer')
    expect(normaliser('Acides aminés')).toBe('acidesamines')
  })
  it('mots de la recherche : singulier, sans mots vides ni doublons', () => {
    expect(motsRecherche('Les protéines de la whey')).toEqual(['proteine', 'whey'])
    expect(motsRecherche('  ')).toEqual([])
  })
})

describe('bugs du 17/10/2026 (client en boutique)', () => {
  const ESSENTIELS = ['iso-zero-100-whey', 'isolate-zero-per4m-whey-isolate', 'native-iso-blend', 'whey-native-protimuscle']

  it('« proteine » et « protéine » : même liste, les whey et isolats du rayon dans les 12 premiers', () => {
    const sans = handles('proteine')
    expect(handles('protéine')).toEqual(sans)
    expect(handles('PROTEINES')).toEqual(sans)
    for (const h of ESSENTIELS) expect(sans.slice(0, 12), h).toContain(h)
    expect(sans.slice(0, 2)).toEqual(['iso-zero-100-whey', 'whey-native-protimuscle'])
  })

  it('« proteine » : le rayon Protéines avant les cookies, muesli et eau protéinée', () => {
    const r = handles('proteine')
    const dernierDuRayon = Math.max(...r.map((h, i) => (CAT.find((p) => p.handle === h)!.productType === 'Protéines' ? i : -1)))
    for (const h of ['critical-cookie-cookie-proteine-73-g', 'muesli-proteine-chocolat', 'protein-water-on-eau-proteinee-350-ml']) {
      expect(r.indexOf(h), h).toBeGreaterThan(dernierDuRayon)
    }
  })

  it('« proteine » : gainers en fin de rayon, en tête sur « gainer »', () => {
    const r = handles('proteine')
    expect(r.indexOf('mutant-mass')).toBeGreaterThan(r.indexOf('native-iso-blend'))
    expect(handles('gainer', 4)).toEqual([
      'game-changer-mass-gainer-3-kg',
      'metabolic-mass-gainer-6-kg',
      'critical-mass-gainer-6-kg',
      'mutant-mass',
    ])
  })

  it('« whey » : pas de shaker, ni en premier ni ailleurs', () => {
    const r = rechercher(CAT, 'whey')
    expect(r[0].productType).toBe('Protéines')
    expect(r.some((p) => p.productType === 'Accessoires')).toBe(false)
  })

  it('« creatine » = « créatine » : le rayon seul, sans entonnoir ni shaker (cités en description)', () => {
    expect(handles('creatine')).toEqual(handles('créatine'))
    expect(handles('creatine')).toEqual([
      'dedicated-nutrition-micronized-creatine-monohydrate',
      'clear-pro-creatine',
      'creatine-monohydrate-dy-300-g-neutre',
      'the-creatine-creatine-aromatisee-400-g',
      'mutant-creatine-300-g',
    ])
  })
})

describe('classement', () => {
  it('en stock avant les ruptures, ruptures toujours trouvables', () => {
    const r = rechercher(CAT, 'creatine')
    const premiereRupture = r.findIndex((p) => !p.availableForSale)
    expect(premiereRupture).toBeGreaterThan(0)
    expect(r.slice(premiereRupture).every((p) => !p.availableForSale)).toBe(true)
  })

  it('accessoires après les compléments, sauf recherche d’accessoire', () => {
    const favre = handles('eric favre')
    expect(favre.indexOf('shaker-fit-eric-favre-500-ml-bleu')).toBeGreaterThan(favre.indexOf('iso-zero-100-whey'))
    expect(handles('shaker', 3)).toEqual([
      'shaker-fit-eric-favre-500-ml-bleu',
      'smartshake-slim-series-shaker-500-ml',
      'shaker-skill-nutrition-700-ml',
    ])
  })

  it('titre avant étiquette hors rayon (« whey » : Whey Native avant Native Iso Blend)', () => {
    const r = handles('whey')
    expect(r.indexOf('whey-native-protimuscle')).toBeLessThan(r.indexOf('native-iso-blend'))
  })

  it('marque : « nutrimuscle » trouve ses fiches', () => {
    expect(handles('nutrimuscle')).toEqual(expect.arrayContaining(['whey-native-protimuscle', 'native-iso-blend', 'creme-de-riz-bio']))
  })

  it('tous les mots doivent être trouvés', () => {
    expect(handles('whey isolate')).toContain('isolate-zero-per4m-whey-isolate')
    expect(handles('whey isolate')).not.toContain('whey-native-protimuscle')
    expect(handles('chocolat licorne')).toEqual([])
  })

  it('début de mot pendant la saisie (le rayon d’abord : « crea » trouve aussi Cream of Rice, après)', () => {
    expect(handles('crea', 5)).toEqual(handles('creatine'))
    expect(handles('crea')).toContain('cream-of-rice-per4m-creme-de-riz-2-kg')
    expect(handles('nutrim').length).toBeGreaterThan(0)
  })

  it('description en dernier recours seulement', () => {
    // « entonnoir » est dans un titre : la fiche sort par son titre
    expect(handles('entonnoir')).toEqual(['funnel-entonnoir-doseur'])
    // « transporter » n'est que dans une description : elle sert, faute de mieux
    expect(handles('transporter')).toEqual(['funnel-entonnoir-doseur'])
  })
})

describe('synonymes', () => {
  it('iso ↔ isolate', () => {
    const r = handles('iso')
    for (const h of ['iso-zero-100-whey', 'isolate-zero-per4m-whey-isolate', 'native-iso-blend', 'clear-whey-isolate-500-g']) {
      expect(r, h).toContain(h)
    }
    expect(handles('isolate')).toContain('iso-zero-100-whey')
  })

  it('gainer ↔ prise de masse', () => {
    expect(handles('prise de masse')).toEqual(handles('gainer'))
  })

  it('bcaa et eaa → rayon acides aminés, les fiches qui le nomment d’abord', () => {
    const bcaa = rechercher(CAT, 'bcaa')
    expect(bcaa.slice(0, 5).every((p) => /bcaa/i.test(p.title))).toBe(true)
    expect(bcaa.map((p) => p.handle)).toContain('hit-eaa')
    const eaa = rechercher(CAT, 'eaa')
    expect(/eaa/i.test(eaa[0].title)).toBe(true)
    expect(eaa.map((p) => p.handle)).toContain('mutant-hardcore-bcaa')
  })

  it('preworkout, pre workout, pré-workout, pré-entraînement : même liste', () => {
    const ref = handles('pré-workout')
    expect(ref).toContain('french-pump-pre-workout')
    for (const q of ['preworkout', 'pre workout', 'pré-entraînement']) expect(handles(q), q).toEqual(ref)
  })

  it('protein (anglais) = proteine', () => {
    expect(handles('protein', 12)).toEqual(handles('proteine', 12))
  })
})
