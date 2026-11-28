import { describe, expect, it } from 'vitest'
import type { EtatPalier, Palier } from './index'
import { choisirSuggestion, estCanette, variantesCadeaux, type ArticleSuggerable } from './suggestion'

const livraison: Palier = { montant: 85, type: 'livraison', libelle: 'Livraison offerte' }
const creatine: Palier & { ensemble: number } = {
  montant: 100,
  type: 'cadeau',
  libelle: 'Créatine offerte',
  variantes: [{ id: 'gid://shopify/ProductVariant/900', nom: 'Créatine 500 g' }],
  ensemble: 0,
}

const etat = (palier: Palier, base: number): EtatPalier => {
  const reste = Math.round(Math.max(0, palier.montant - base) * 100) / 100
  return { palier, base, atteint: reste === 0, reste, variantesDispo: [], lignes: [], refuse: false, nonAccorde: false, parAchat: 0 }
}

let n = 0
const article = (handle: string, prix: number, extra: Partial<ArticleSuggerable> = {}): ArticleSuggerable => ({
  handle,
  title: handle,
  price: prix.toFixed(2),
  variantId: `gid://shopify/ProductVariant/${++n}`,
  productId: String(n),
  family: 'collation',
  vendor: 'Warrior',
  ...extra,
})

const base = new Set(['10', '11', '12'])
const appel = (etats: EtatPalier[], candidats: ArticleSuggerable[], options: { panier?: string[]; cadeaux?: Set<string> | null } = {}) =>
  choisirSuggestion({
    etats,
    candidats,
    handlesPanier: new Set(options.panier ?? []),
    variantesCadeaux: options.cadeaux === undefined ? new Set(['gid://shopify/ProductVariant/900']) : options.cadeaux,
    baseCadeau: (p) => ((p as Palier & { ensemble?: number }).ensemble === 0 ? base : null),
  })

describe('choisirSuggestion : livraison offerte', () => {
  const gel = article('gel', 1.9)
  const barre = article('barre', 2.9)
  const entonnoir = article('entonnoir', 3.9, { family: 'accessoire' })
  const shaker = article('shaker', 6.9, { family: 'shaker' })

  it('rien au-delà de 5 € d’écart', () => {
    expect(appel([etat(livraison, 79.9), etat(creatine, 79.9)], [gel, barre, shaker])).toBeNull()
  })

  it('le moins cher qui fait atteindre 85 €', () => {
    const s = appel([etat(livraison, 82.2), etat(creatine, 82.2)], [shaker, entonnoir, gel, barre])
    expect(s?.article.handle).toBe('barre')
    expect(s?.suffit).toBe(true)
  })

  it('écart pile de 5 € : le shaker suffit', () => {
    const s = appel([etat(livraison, 80), etat(creatine, 80)], [shaker, gel])
    expect(s?.article.handle).toBe('shaker')
  })

  it('aucun article suffisant : le moins cher, qui en rapproche', () => {
    const s = appel([etat(livraison, 80.5)], [gel, barre])
    expect(s?.article.handle).toBe('gel')
    expect(s?.suffit).toBe(false)
  })

  it('jamais une canette, une boisson, un pack, une marque exclue, un article sans variante unique ou déjà au panier', () => {
    const candidats = [
      article('canette', 2.9, { title: 'C4 Energy - Canette 500 ml', family: 'autre' }),
      article('abe', 2.9, { title: 'ABE Energy - Boisson Énergisante Performance', family: 'boisson' }),
      article('shake', 2.9, { title: 'ON High Protein Shake - 330 ml', family: 'boisson' }),
      article('pack', 3.5, { family: 'pack' }),
      article('exclue', 3.5, { vendor: 'Eric Favre' }),
      article('saveurs', 3.5, { variantId: null }),
      article('deja', 3.5),
    ]
    expect(appel([etat(livraison, 82)], candidats, { panier: ['deja'] })).toBeNull()
  })

  it('jamais un cadeau d’une période en cours ou à venir', () => {
    const crunch = article('crunch', 2.9, { variantId: 'gid://shopify/ProductVariant/700' })
    const cadeaux = new Set(['gid://shopify/ProductVariant/700'])
    expect(appel([etat(livraison, 82)], [crunch, shaker], { cadeaux })?.article.handle).toBe('shaker')
  })

  it('cadeaux inconnus (route en échec) : aucune suggestion', () => {
    expect(appel([etat(livraison, 82)], [gel], { cadeaux: null })).toBeNull()
  })

  it('palier atteint : rien', () => {
    expect(appel([etat(livraison, 90)], [gel])).toBeNull()
  })
})

describe('choisirSuggestion : palier cadeau', () => {
  const vitD = { ...article('vitamine-d', 9.9), productId: '10' }
  const magnesium = { ...article('magnesium', 12.9), productId: '11' }
  const shaker = { ...article('shaker', 6.9, { family: 'shaker' }), productId: '99' }
  const creatineAchetee = { ...article('creatine-500', 19.9, { variantId: 'gid://shopify/ProductVariant/900' }), productId: '12' }

  it('le moins cher de la base des cadeaux qui fait atteindre le palier', () => {
    const s = appel([etat(livraison, 91), etat(creatine, 91)], [magnesium, vitD, shaker])
    expect(s?.article.handle).toBe('vitamine-d')
    expect(s?.suffit).toBe(true)
    // 10 € manquants : la vitamine D (9,90 €) ne suffit pas, le magnésium oui.
    expect(appel([etat(livraison, 90), etat(creatine, 90)], [magnesium, vitD])?.article.handle).toBe('magnesium')
    expect(s?.palier.palier.type).toBe('cadeau')
  })

  it('hors base (accessoire) : jamais proposé', () => {
    const s = appel([etat(livraison, 94), etat(creatine, 94)], [shaker, vitD])
    expect(s?.article.handle).toBe('vitamine-d')
  })

  it('aucun article de la base ne suffit : rien (pas de repli)', () => {
    expect(appel([etat(livraison, 86), etat(creatine, 86)], [vitD, magnesium])).toBeNull()
  })

  it('rien au-delà de 15 € d’écart', () => {
    // Livraison atteinte (accessoires au panier), base des cadeaux à 84,90 € : 15,10 € manquants.
    expect(appel([etat(livraison, 92), etat(creatine, 84.9)], [{ ...magnesium, price: '19.90' }])).toBeNull()
    expect(appel([etat(livraison, 92), etat(creatine, 85)], [{ ...magnesium, price: '19.90' }])?.article.handle).toBe('magnesium')
  })

  it('le cadeau lui-même n’est jamais proposé', () => {
    expect(appel([etat(livraison, 90), etat(creatine, 90)], [creatineAchetee])).toBeNull()
  })

  it('base inconnue : rien', () => {
    const sansBase = { ...creatine, ensemble: 3 }
    expect(appel([etat(livraison, 90), etat(sansBase, 90)], [vitD])).toBeNull()
  })

  it('le prochain palier est la livraison : la suggestion vise la livraison, pas le cadeau', () => {
    const s = appel([etat(livraison, 82), etat(creatine, 82)], [vitD, shaker])
    expect(s?.palier.palier.type).toBe('livraison')
    expect(s?.article.handle).toBe('shaker')
  })
})

describe('estCanette', () => {
  it('canette nommée, ou boisson dont on ne sait pas que ce n’en est pas une : exclue', () => {
    expect(estCanette({ title: 'C4 Energy - Canette 500 ml', family: 'boisson' })).toBe(true)
    expect(estCanette({ title: 'Monster Can', family: 'autre' })).toBe(true)
    expect(estCanette({ title: 'ABE Energy - Boisson Énergisante Performance', family: 'boisson' })).toBe(true)
    expect(estCanette({ title: 'ON High Protein Shake - 330 ml', family: 'boisson' })).toBe(true)
    expect(estCanette({ title: 'Protein Water ON - Eau Protéinée 35 cl', family: 'boisson' })).toBe(true)
  })

  it('shot, pastilles, bouteille ou petit format : passe', () => {
    expect(estCanette({ title: 'C4 Energy Shot - Shot Pré-Workout 60 ml', family: 'boisson' })).toBe(false)
    expect(estCanette({ title: 'Rage Energy Shot - Pré-Workout Liquide', family: 'boisson' })).toBe(false)
    expect(estCanette({ title: "Endurance Hydration - Pastilles d'électrolytes", family: 'boisson' })).toBe(false)
    expect(estCanette({ title: 'Shake protéiné - Bouteille 330 ml', family: 'boisson' })).toBe(false)
    expect(estCanette({ title: 'Gel 60 ml', family: 'glucides' })).toBe(false)
  })

  it('un shot à 2,90 € peut être suggéré pour la livraison', () => {
    const shot = article('shot', 2.9, { title: 'C4 Energy Shot - Shot Pré-Workout 60 ml', family: 'boisson' })
    expect(appel([etat(livraison, 82.5)], [shot])?.article.handle).toBe('shot')
  })
})

describe('variantesCadeaux', () => {
  const crunch = { montant: 60, type: 'cadeau' as const, libelle: 'Crunch Bar', variantes: [{ id: 'v-crunch', nom: 'Chocolat' }] }
  const shaker = { montant: 100, type: 'cadeau' as const, libelle: 'Shaker', variantes: [{ id: 'v-shaker', nom: 'Shaker' }] }
  const creat = { montant: 100, type: 'cadeau' as const, libelle: 'Créatine', variantes: [{ id: 'v-creat', nom: '500 g' }] }
  const periodes = [
    { au: '2026-11-22T22:59:59Z', paliers: [{ ...crunch, variantes: [{ id: 'v-ancienne', nom: 'x' }] }] },
    { au: '2026-11-28T22:59:59Z', paliers: [livraison, creat] },
    { au: null, paliers: [livraison, crunch, shaker] },
  ]

  it('période en cours et période à venir, jamais une période finie', () => {
    const v = variantesCadeaux(periodes, new Date('2026-11-28T01:00:00Z'))
    expect([...v].sort()).toEqual(['v-creat', 'v-crunch', 'v-shaker'])
  })

  it('après la Black Week : seulement l’échelle', () => {
    const v = variantesCadeaux(periodes, new Date('2026-11-29T00:00:00Z'))
    expect([...v].sort()).toEqual(['v-crunch', 'v-shaker'])
  })
})
