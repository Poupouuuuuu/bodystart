import { describe, it, expect } from 'vitest'
import {
  appliquerPlafond,
  correspondAuFormat,
  extraireMessage,
  formatDansTitre,
  libelleVariante,
  messagesParObjectif,
  normaliserFormat,
  prixLigneCents,
  recommander,
} from './moteur'
import { HANDLES, PRODUITS, construireCatalogue, guide, reponses, rupture } from './test-utils'
import stockReel from './fixtures/stock-coignieres-2026-10-08.json'
import type { Budget, Guide, Ligne, Resultat } from './types'

const catalogue = construireCatalogue()

const VEGAN_PROTEINE = 'Protéine végétale : passe nous voir, on te conseille.'
const VEGAN_VITAMINES =
  "Vegan : certaines vitamines et les oméga 3 sont souvent d'origine animale. Passe nous voir, on te conseille une version végétale."

function selection(r: Resultat) {
  if (r.type !== 'selection') throw new Error(`attendu une sélection, reçu ${r.type}/${r.raison}`)
  return r
}
const cles = (r: Resultat) => selection(r).lignes.map((l) => l.cle)
const roles = (r: Resultat) => selection(r).lignes.map((l) => l.role)

describe('formats', () => {
  it('normalise : minuscules, sans espaces, virgule → point', () => {
    expect(normaliserFormat(' 2,25 Kg ')).toBe('2.25kg')
    expect(normaliserFormat('2.27kg')).toBe('2.27kg')
  })

  it('« 2,25 kg » correspond à « 2.25kg » et inversement, espaces compris', () => {
    expect(correspondAuFormat('Chocolat / 2.25kg', '2,25 kg')).toBe(true)
    expect(correspondAuFormat('Chocolat / 2,25 kg', '2.25kg')).toBe(true)
    expect(correspondAuFormat('Vanille / 1 kg', '1 kg')).toBe(true)
    expect(correspondAuFormat('Triple Chocolate / 2.27kg', '2.27kg')).toBe(true)
    expect(correspondAuFormat('500g', '500g')).toBe(true)
    expect(correspondAuFormat('Vanille / 1 kg', '1 kg')).toBe(true)
  })

  it('refuse un format collé à un chiffre (11 kg, 2,25 kg pour 25 kg) ou absent', () => {
    expect(correspondAuFormat('Vanille / 11 kg', '1 kg')).toBe(false)
    expect(correspondAuFormat('Chocolat / 2,25 kg', '25 kg')).toBe(false)
    expect(correspondAuFormat('Fraise / 500 g', '1 kg')).toBe(false)
    expect(correspondAuFormat('Vanilla Ice Cream / 6.8kg', '2.27kg')).toBe(false)
  })

  it('format vide : n’importe quelle variante', () => {
    expect(correspondAuFormat('Cherry', '')).toBe(true)
    expect(correspondAuFormat('Default Title', '  ')).toBe(true)
  })

  it('libellé de parfum sans le format, format tel qu’écrit dans le titre', () => {
    expect(libelleVariante('Chocolat / 2,25 kg', '2,25 kg')).toBe('Chocolat')
    expect(libelleVariante('Triple Chocolate / 2.27kg', '2.27kg')).toBe('Triple Chocolate')
    expect(libelleVariante('500g', '500g')).toBe('')
    expect(libelleVariante('90 capsules', '')).toBe('90 capsules')
    expect(libelleVariante('Default Title', '')).toBe('')
    expect(formatDansTitre('Chocolat / 2,25 kg', '2.25kg')).toBe('2,25 kg')
    expect(formatDansTitre('Cherry', '')).toBeNull()
  })
})

describe('messages des règles', () => {
  it('extrait le texte entre « » (le dernier), rien sinon', () => {
    expect(extraireMessage('Retirer la créatine et afficher : « Passe nous voir. »')).toBe('Passe nous voir.')
    expect(extraireMessage('Les phrases « pourquoi » sont validées. Et : « Message final. »')).toBe('Message final.')
    expect(extraireMessage('Aucun produit du guide ne contient de caféine.')).toBeNull()
    expect(extraireMessage(undefined)).toBeNull()
  })

  it('le guide réel (v3) fournit les messages client, le vegan par objectif', () => {
    expect(guide.messages.frequence01).toMatch(/^Pour progresser, l'entraînement compte plus que les compléments\./)
    expect(guide.messages.sansLactose).toBe("Intolérance avérée : vérifie l'étiquette ou demande-nous conseil en boutique.")
    expect(guide.messages.veganParObjectif).toEqual({
      muscle: VEGAN_PROTEINE,
      affiner: VEGAN_PROTEINE,
      recuperation: VEGAN_PROTEINE,
      sante: VEGAN_VITAMINES,
      endurance: VEGAN_VITAMINES,
    })
  })

  it('messagesParObjectif : clés connues seulement, accents ignorés', () => {
    expect(messagesParObjectif('Texte : muscle, récupération : « A » ; sante et inconnu : « B »', ['muscle', 'recuperation', 'sante'])).toEqual({
      muscle: 'A',
      recuperation: 'A',
      sante: 'B',
    })
    expect(messagesParObjectif('Afficher : « Un seul message. »', ['muscle'])).toEqual({})
    expect(messagesParObjectif(undefined, ['muscle'])).toEqual({})
  })
})

describe('chaque objectif × chaque budget (tout en stock, 2 à 3 séances, sans contrainte)', () => {
  const attendu: Record<string, Record<Budget, string[]>> = {
    'muscle/standard': {
      'moins-40': ['creatine'],
      '40-90': ['protimuscle1', 'creatine'],
      'plus-90': ['protimuscle1', 'creatine', 'creamofrice'],
    },
    'muscle/masse': {
      'moins-40': ['mutantmass227'],
      '40-90': ['mutantmass227', 'creatine'],
      'plus-90': ['mutantmass68', 'creatine'],
    },
    affiner: {
      'moins-40': ['clearwhey'],
      '40-90': ['clearwhey', 'creatine'],
      'plus-90': ['clearwhey', 'creatine', 'multivit'],
    },
    endurance: {
      'moins-40': ['clusterdextrin'],
      '40-90': ['clusterdextrin', 'magnesium'],
      'plus-90': ['clusterdextrin', 'magnesium', 'hiteaa'],
    },
    recuperation: {
      'moins-40': ['magnesium'],
      '40-90': ['protimuscle1', 'magnesium'],
      'plus-90': ['protimuscle1', 'magnesium', 'hiteaa'],
    },
    sante: {
      'moins-40': ['multivit', 'd3k2'],
      '40-90': ['multivit', 'd3k2', 'omega3', 'magnesium'],
      'plus-90': ['multivit', 'd3k2', 'omega3', 'magnesium'],
    },
  }

  for (const [chemin, parBudget] of Object.entries(attendu)) {
    const [objectif, parcours] = chemin.split('/')
    for (const [budget, lignes] of Object.entries(parBudget) as [Budget, string[]][]) {
      it(`${chemin} / ${budget} → ${lignes.join(', ')}`, () => {
        const r = recommander(
          guide,
          reponses({ objectif, budget, questionSup: objectif === 'muscle' ? parcours === 'masse' : null }),
          catalogue
        )
        expect(cles(r)).toEqual(lignes)
        expect(roles(r)[0]).toBe('essentiel')
        expect(selection(r).messages).toEqual([])
      })
    }
  }

  it('le plafond suit le budget (40 €, 90 €, aucun)', () => {
    const plafond = (budget: Budget) => selection(recommander(guide, reponses({ objectif: 'sante', budget }), catalogue)).plafondCents
    expect(plafond('moins-40')).toBe(4000)
    expect(plafond('40-90')).toBe(9000)
    expect(plafond('plus-90')).toBeNull()
  })

  it('les lignes portent la phrase « pourquoi » du guide, telle quelle', () => {
    const r = selection(recommander(guide, reponses({ objectif: 'muscle', questionSup: false }), catalogue))
    expect(r.lignes[0].pourquoi).toBe(guide.produits.protimuscle1.pourquoi)
    expect(r.lignes[1].pourquoi).toBe(guide.produits.creatine.pourquoi)
  })
})

describe('contraintes', () => {
  it('sans lactose (v3) : Clear Whey d’abord, avec le message', () => {
    const r = recommander(guide, reponses({ objectif: 'muscle', questionSup: false, contraintes: ['sans-lactose'] }), catalogue)
    expect(cles(r)).toEqual(['clearwhey', 'creatine'])
    expect(selection(r).messages).toEqual([guide.messages.sansLactose])
    // MuscleWhey en stock mais jamais devant la Clear Whey, même pour récupération et affiner.
    expect(cles(recommander(guide, reponses({ objectif: 'recuperation', contraintes: ['sans-lactose'] }), catalogue))).toEqual(['clearwhey', 'magnesium'])
    expect(cles(recommander(guide, reponses({ objectif: 'affiner', contraintes: ['sans-lactose'] }), catalogue))).toEqual(['clearwhey', 'creatine'])
  })

  it('sans lactose (v3) : MuscleWhey seulement si la Clear Whey n’a aucun parfum en stock', () => {
    const unParfum = construireCatalogue({ stock: (h, t) => (h === HANDLES.clearwhey ? (t === 'Cherry' ? 1 : 0) : 5) })
    expect(cles(recommander(guide, reponses({ objectif: 'muscle', questionSup: false, contraintes: ['sans-lactose'] }), unParfum))).toEqual(['clearwhey', 'creatine'])
    const sansClear = construireCatalogue({ stock: rupture([HANDLES.clearwhey]) })
    expect(cles(recommander(guide, reponses({ objectif: 'muscle', questionSup: false, contraintes: ['sans-lactose'] }), sansClear))).toEqual(['musclewhey', 'creatine'])
    // Ni l'un ni l'autre : jamais de whey native en repli.
    const aucun = construireCatalogue({ stock: rupture([HANDLES.clearwhey], [HANDLES.musclewhey]) })
    expect(cles(recommander(guide, reponses({ objectif: 'muscle', questionSup: false, contraintes: ['sans-lactose'] }), aucun))).toEqual(['creatine'])
  })

  it('sans lactose : règle appliquée telle qu’écrite (le gainer et la barre restent)', () => {
    const r = recommander(
      guide,
      reponses({ objectif: 'muscle', questionSup: true, contraintes: ['sans-lactose'], budget: 'moins-40' }),
      catalogue
    )
    expect(cles(r)).toEqual(['mutantmass227'])
  })

  it('vegan (v3) : créatine et magnésium seulement, le premier restant devient l’essentiel', () => {
    const muscle = selection(recommander(guide, reponses({ objectif: 'muscle', questionSup: false, contraintes: ['vegan'] }), catalogue))
    expect(muscle.lignes.map((l) => [l.cle, l.role])).toEqual([['creatine', 'essentiel']])
    expect(muscle.shaker).toBeNull()

    const masse = selection(recommander(guide, reponses({ objectif: 'muscle', questionSup: true, budget: 'plus-90', contraintes: ['vegan'] }), catalogue))
    expect(masse.lignes.map((l) => [l.cle, l.role])).toEqual([['creatine', 'essentiel']])

    const affiner = selection(recommander(guide, reponses({ objectif: 'affiner', budget: 'plus-90', contraintes: ['vegan'] }), catalogue))
    expect(affiner.lignes.map((l) => [l.cle, l.role])).toEqual([['creatine', 'essentiel']])

    const sante = selection(recommander(guide, reponses({ objectif: 'sante', contraintes: ['vegan'] }), catalogue))
    expect(sante.lignes.map((l) => [l.cle, l.role])).toEqual([['magnesium', 'essentiel']])

    const endurance = selection(recommander(guide, reponses({ objectif: 'endurance', budget: 'plus-90', contraintes: ['vegan'] }), catalogue))
    expect(endurance.lignes.map((l) => [l.cle, l.role])).toEqual([['magnesium', 'essentiel']])

    const recup = selection(recommander(guide, reponses({ objectif: 'recuperation', budget: 'moins-40', contraintes: ['vegan'] }), catalogue))
    expect(recup.lignes.map((l) => [l.cle, l.role])).toEqual([['magnesium', 'essentiel']])
  })

  it('vegan (v3) : message selon l’objectif', () => {
    const message = (objectif: string, budget: Budget = 'plus-90') =>
      recommander(guide, reponses({ objectif, questionSup: false, budget, contraintes: ['vegan'] }), catalogue).messages
    expect(message('muscle')).toEqual([VEGAN_PROTEINE])
    expect(message('affiner')).toEqual([VEGAN_PROTEINE])
    expect(message('recuperation')).toEqual([VEGAN_PROTEINE])
    expect(message('sante')).toEqual([VEGAN_VITAMINES])
    expect(message('endurance')).toEqual([VEGAN_VITAMINES])
  })

  it('vegan sans rien de compatible : résultat boutique, message de l’objectif conservé', () => {
    const affiner = recommander(guide, reponses({ objectif: 'affiner', budget: 'moins-40', contraintes: ['vegan'] }), catalogue)
    expect(affiner).toMatchObject({ type: 'boutique', raison: 'rupture', messages: [VEGAN_PROTEINE] })
    const sante = recommander(guide, reponses({ objectif: 'sante', budget: 'moins-40', contraintes: ['vegan'] }), catalogue)
    expect(sante).toMatchObject({ type: 'boutique', raison: 'rupture', messages: [VEGAN_VITAMINES] })
    const endurance = recommander(guide, reponses({ objectif: 'endurance', budget: 'moins-40', contraintes: ['vegan'] }), catalogue)
    expect(endurance).toMatchObject({ type: 'boutique', raison: 'rupture', messages: [VEGAN_VITAMINES] })
  })

  it('sans caféine : aucun effet', () => {
    for (const objectif of ['muscle', 'affiner', 'endurance', 'recuperation', 'sante']) {
      const base = recommander(guide, reponses({ objectif, questionSup: false }), catalogue)
      const sansCafeine = recommander(guide, reponses({ objectif, questionSup: false, contraintes: ['sans-cafeine'] }), catalogue)
      expect(sansCafeine).toEqual(base)
    }
  })

  it('plusieurs contraintes : messages dans l’ordre des règles', () => {
    const r = recommander(
      guide,
      reponses({ objectif: 'muscle', questionSup: false, seances: '0-1', contraintes: ['vegan', 'sans-lactose'] }),
      catalogue
    )
    expect(r.messages).toEqual([guide.messages.frequence01, guide.messages.sansLactose, VEGAN_PROTEINE])
  })
})

describe('stock à la boutique', () => {
  it('rupture du premier candidat : repli sur le suivant', () => {
    const c = construireCatalogue({ stock: rupture([HANDLES.whey, '1 kg']) })
    const r = recommander(guide, reponses({ objectif: 'muscle', questionSup: false }), c)
    expect(cles(r)).toEqual(['musclewhey', 'creatine'])
  })

  it('rupture de tous les candidats d’un emplacement : emplacement non affiché', () => {
    const c = construireCatalogue({ stock: rupture([HANDLES.magnesium], [HANDLES.zma]) })
    const r = recommander(guide, reponses({ objectif: 'recuperation' }), c)
    expect(cles(r)).toEqual(['protimuscle1'])
  })

  it('plus rien en stock : résultat boutique', () => {
    const c = construireCatalogue({ stock: () => 0 })
    expect(recommander(guide, reponses({ objectif: 'sante' }), c)).toMatchObject({
      type: 'boutique',
      raison: 'rupture',
      suggestions: [],
    })
  })

  it('format : seules les variantes au bon format comptent (500 g en stock ne sauve pas le 1 kg)', () => {
    const c = construireCatalogue({ stock: (h, t) => (h === HANDLES.whey ? (t.includes('500 g') ? 9 : 0) : 5) })
    const r = recommander(guide, reponses({ objectif: 'recuperation' }), c)
    expect(cles(r)).toEqual(['musclewhey', 'magnesium'])
  })

  it('parfum par défaut : la variante la plus stockée ; liste des seuls parfums en stock au bon format', () => {
    const stocks: Record<string, number> = { 'Chocolat / 1 kg': 2, 'Vanille / 1 kg': 7, 'Fraise / 1 kg': 0, 'Matcha Latte / 1 kg': 7 }
    const c = construireCatalogue({ stock: (h, t) => (h === HANDLES.whey ? stocks[t] ?? 0 : 5) })
    const ligne = selection(recommander(guide, reponses({ objectif: 'recuperation' }), c)).lignes[0]
    expect(ligne.format).toBe('1 kg')
    // À stock égal, l'ordre Shopify départage (Vanille avant Matcha Latte).
    expect(ligne.variantes.map((v) => v.libelle)).toEqual(['Vanille', 'Matcha Latte', 'Chocolat'])
    expect(prixLigneCents(ligne)).toBe(4490)
    expect(prixLigneCents(ligne, ligne.variantes[2].id)).toBe(4490)
    expect(prixLigneCents(ligne, 'gid://inconnue')).toBe(4490)
  })

  it('une variante non vendable en ligne est ignorée même en stock', () => {
    const c = construireCatalogue({ invendable: (h) => h === HANDLES.whey })
    const r = recommander(guide, reponses({ objectif: 'recuperation' }), c)
    expect(cles(r)).toEqual(['musclewhey', 'magnesium'])
  })

  it('jamais deux fois le même produit au même format dans une sélection', () => {
    const g: Guide = structuredClone(guide)
    const muscle = g.objectifs.find((o) => o.cle === 'muscle')
    if (muscle?.type !== 'parcours') throw new Error('fixture')
    muscle.parcours.standard['plus-90'] = [
      { role: 'essentiel', candidats: ['protimuscle1', 'musclewhey'] },
      { role: 'complement', candidats: ['protimuscle1', 'creatine'] },
      { role: 'complement', candidats: ['protimuscle225'] },
    ]
    const r = recommander(g, reponses({ objectif: 'muscle', questionSup: false, budget: 'plus-90' }), catalogue)
    // Même handle, autre format (2,25 kg) : autorisé.
    expect(cles(r)).toEqual(['protimuscle1', 'creatine', 'protimuscle225'])
  })
})

describe('plafond du budget', () => {
  it('retire le dernier complément tant que le total dépasse', () => {
    const c = construireCatalogue({ prix: (h) => (h === HANDLES.omega3 ? 5000 : undefined) })
    // 14,90 + 14,90 + 50 + 16,90 = 96,70 € > 90 € : le magnésium (dernier) part.
    const r = recommander(guide, reponses({ objectif: 'sante', budget: '40-90' }), c)
    expect(cles(r)).toEqual(['multivit', 'd3k2', 'omega3'])
  })

  it('n’ajoute jamais de produit pour atteindre le budget', () => {
    const r = recommander(guide, reponses({ objectif: 'recuperation', budget: 'moins-40' }), catalogue)
    expect(cles(r)).toEqual(['magnesium'])
  })

  it('ne retire jamais l’essentiel, même au-dessus du plafond', () => {
    const c = construireCatalogue({ stock: rupture([HANDLES.clearwhey]) })
    const r = selection(recommander(guide, reponses({ objectif: 'affiner', budget: 'moins-40' }), c))
    expect(cles(r)).toEqual(['musclewhey'])
    expect(r.lignes[0].prixMaxCents).toBeGreaterThan(4000)
  })

  it('compte le parfum le plus cher : le plafond tient quel que soit le parfum choisi', () => {
    const c = construireCatalogue({ prix: (h, t) => (h === HANDLES.whey && t === 'Fraise / 1 kg' ? 6000 : undefined) })
    const r = selection(recommander(guide, reponses({ objectif: 'muscle', questionSup: false, budget: '40-90' }), c))
    expect(cles(r)).toEqual(['protimuscle1'])
    expect(r.lignes[0].prixMaxCents).toBe(6000)
  })

  it('appliquerPlafond : sans plafond, rien ne bouge ; sans complément, on s’arrête', () => {
    const l = (cle: string, role: Ligne['role'], prix: number): Ligne => ({
      cle,
      role,
      handle: cle,
      titre: cle,
      pourquoi: '',
      format: null,
      variantes: [{ id: cle, libelle: '', prixCents: prix, stock: 1, image: null }],
      prixMaxCents: prix,
    })
    const lignes = [l('a', 'essentiel', 3000), l('b', 'complement', 2000), l('c', 'complement', 1000)]
    expect(appliquerPlafond(lignes, null)).toEqual(lignes)
    // Total égal au plafond : accepté.
    expect(appliquerPlafond(lignes, 5000).map((x) => x.cle)).toEqual(['a', 'b'])
    expect(appliquerPlafond(lignes, 4999).map((x) => x.cle)).toEqual(['a'])
    expect(appliquerPlafond(lignes, 3500).map((x) => x.cle)).toEqual(['a'])
    expect(appliquerPlafond([l('a', 'essentiel', 9000)], 4000).map((x) => x.cle)).toEqual(['a'])
  })
})

describe('shaker en option', () => {
  it('proposé avec une protéine en poudre ou un gainer, hors sélection', () => {
    for (const r of [
      recommander(guide, reponses({ objectif: 'muscle', questionSup: false }), catalogue),
      recommander(guide, reponses({ objectif: 'muscle', questionSup: true, budget: 'moins-40' }), catalogue),
      recommander(guide, reponses({ objectif: 'affiner', budget: 'moins-40' }), catalogue),
    ]) {
      const s = selection(r)
      expect(s.shaker).toMatchObject({ cle: 'shaker', role: 'option' })
      expect(s.lignes.some((l) => l.cle === 'shaker')).toBe(false)
    }
  })

  it('absent sans protéine ni gainer, ou si le shaker est en rupture', () => {
    expect(selection(recommander(guide, reponses({ objectif: 'endurance' }), catalogue)).shaker).toBeNull()
    expect(
      selection(recommander(guide, reponses({ objectif: 'muscle', questionSup: false, budget: 'moins-40' }), catalogue)).shaker
    ).toBeNull()
    const c = construireCatalogue({ stock: rupture([HANDLES.shaker]) })
    expect(selection(recommander(guide, reponses({ objectif: 'muscle', questionSup: false }), c)).shaker).toBeNull()
  })
})

describe('« Je ne sais pas encore »', () => {
  it('résultat boutique : texte du guide + 3 suggestions en stock', () => {
    const r = recommander(guide, reponses({ objectif: 'ne-sait-pas' }), catalogue)
    expect(r).toMatchObject({ type: 'boutique', raison: 'ne-sait-pas', messages: [] })
    if (r.type !== 'boutique') return
    expect(r.texte).toBe('Passe nous voir : en 5 minutes, on fait le point ensemble, sans engagement.')
    expect(r.suggestions.map((s) => [s.cle, s.role])).toEqual([
      ['protimuscle1', 'suggestion'],
      ['creatine', 'suggestion'],
      ['crunch', 'suggestion'],
    ])
  })

  it('une suggestion en rupture n’est pas affichée', () => {
    const c = construireCatalogue({ stock: rupture([HANDLES.crunch]) })
    const r = recommander(guide, reponses({ objectif: 'ne-sait-pas' }), c)
    expect(r.type === 'boutique' && r.suggestions.map((s) => s.cle)).toEqual(['protimuscle1', 'creatine'])
  })

  it('objectif inconnu : résultat boutique vide', () => {
    expect(recommander(guide, reponses({ objectif: 'inconnu' }), catalogue)).toMatchObject({ type: 'boutique', suggestions: [] })
  })
})

describe('séances', () => {
  it('0 à 1 : la créatine est retirée et le message s’affiche', () => {
    const r = recommander(guide, reponses({ objectif: 'muscle', questionSup: false, seances: '0-1' }), catalogue)
    expect(cles(r)).toEqual(['protimuscle1'])
    expect(r.messages).toEqual([guide.messages.frequence01])
  })

  it('0 à 1 (v3) : santé inchangée, sans message', () => {
    for (const budget of ['moins-40', '40-90', 'plus-90'] as Budget[]) {
      const base = recommander(guide, reponses({ objectif: 'sante', budget }), catalogue)
      const r = recommander(guide, reponses({ objectif: 'sante', budget, seances: '0-1' }), catalogue)
      expect(r).toEqual(base)
      expect(r.messages).toEqual([])
    }
  })

  it('0 à 1 : la règle vaut pour les autres objectifs (affiner, endurance, récupération)', () => {
    expect(cles(recommander(guide, reponses({ objectif: 'affiner', seances: '0-1' }), catalogue))).toEqual(['clearwhey'])
    expect(recommander(guide, reponses({ objectif: 'endurance', seances: '0-1' }), catalogue).messages).toEqual([guide.messages.frequence01])
  })

  it('0 à 1 avec la créatine seule au programme : résultat boutique avec le message', () => {
    const r = recommander(guide, reponses({ objectif: 'muscle', questionSup: false, seances: '0-1', budget: 'moins-40' }), catalogue)
    expect(r).toMatchObject({ type: 'boutique', raison: 'rupture', messages: [guide.messages.frequence01] })
  })

  it('4 et plus, budget plus de 90 € : le 2,25 kg en premier, le 1 kg en repli', () => {
    const r = selection(
      recommander(guide, reponses({ objectif: 'muscle', questionSup: false, seances: '4-plus', budget: 'plus-90' }), catalogue)
    )
    expect(cles(r)).toEqual(['protimuscle225', 'creatine', 'creamofrice'])
    expect(r.lignes[0].format).toBe('2,25 kg')
    expect(r.lignes[0].variantes.every((v) => v.prixCents === 8990)).toBe(true)

    const sans225 = construireCatalogue({ stock: rupture([HANDLES.whey, '2,25 kg']) })
    const r2 = recommander(guide, reponses({ objectif: 'recuperation', seances: '4-plus', budget: 'plus-90' }), sans225)
    expect(cles(r2)).toEqual(['protimuscle1', 'magnesium', 'hiteaa'])
  })

  it('4 et plus avec un autre budget : pas de grand format', () => {
    const r = recommander(guide, reponses({ objectif: 'muscle', questionSup: false, seances: '4-plus', budget: '40-90' }), catalogue)
    expect(cles(r)).toEqual(['protimuscle1', 'creatine'])
  })

  it('4 et plus + sans lactose : la Clear Whey remplace aussi le grand format', () => {
    const r = recommander(
      guide,
      reponses({ objectif: 'muscle', questionSup: false, seances: '4-plus', budget: 'plus-90', contraintes: ['sans-lactose'] }),
      catalogue
    )
    expect(cles(r)).toEqual(['clearwhey', 'creatine', 'creamofrice'])
  })
})

describe('stock réel de Coignières au 08/10/2026 (lecture Admin API)', () => {
  const stocks = stockReel as Record<string, number>
  const catalogueReel = construireCatalogue({
    stock: (handle, titre) => {
      const v = PRODUITS[handle]?.variantes.find((x) => x.titre === titre)
      return v ? stocks[v.id.split('/').pop()!] ?? 0 : 0
    },
  })

  it('chaque objectif et chaque budget donnent une sélection complète', () => {
    for (const o of guide.objectifs) {
      if (o.type !== 'parcours') continue
      for (const questionSup of o.questionSup ? [false, true] : [null]) {
        for (const budget of ['moins-40', '40-90', 'plus-90'] as Budget[]) {
          const r = recommander(guide, reponses({ objectif: o.cle, questionSup, budget }), catalogueReel)
          const attendu = recommander(guide, reponses({ objectif: o.cle, questionSup, budget }), catalogue)
          expect(cles(r)).toEqual(cles(attendu))
        }
      }
    }
  })

  it('parfums par défaut : les plus stockés', () => {
    const muscle = selection(recommander(guide, reponses({ objectif: 'muscle', questionSup: false, budget: 'plus-90' }), catalogueReel))
    expect(muscle.lignes.map((l) => l.variantes[0].libelle)).toEqual(['Chocolat', '', 'Triple Chocolate'])
    expect(muscle.lignes[0].variantes.map((v) => v.libelle)).toEqual(['Chocolat', 'Vanille', 'Choco-cookie', 'Fraise', 'Matcha Latte'])
  })
})
