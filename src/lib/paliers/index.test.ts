import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
  parsePaliers, periodeActive, dateDeReference, baseCadeaux, baseLivraison, etatPaliers, planCadeaux,
  cadeauxPayants, prochainPalier, type LigneCadeau, type ContextePaliers,
} from './index'

const RAW = fs.readFileSync(path.join(__dirname, 'fixtures/paliers-2026-10-13.json'), 'utf8')
const config = parsePaliers(RAW)!
const DCPB = 'gid://shopify/ProductVariant/54097477534038'
const PBC = 'gid://shopify/ProductVariant/54401705804118'
const SHAKER = 'gid://shopify/ProductVariant/54795484332374'
const CREA = 'gid://shopify/ProductVariant/53981935206742'
const stock = { [DCPB]: true, [PBC]: true, [SHAKER]: true, [CREA]: true }

const ligne = (over: Partial<LigneCadeau>): LigneCadeau => ({
  id: 'l1', merchandiseId: 'gid://shopify/ProductVariant/1', productId: '111', quantity: 1, subtotal: 0, total: 0, cadeau: null, ...over,
})
const ctx = (over: Partial<ContextePaliers>): ContextePaliers => ({
  baseCadeaux: 0, baseLivraison: 0, stock, lignes: [], refuses: new Set(), retraitBoutique: false, ...over,
})
const octobre = periodeActive(config, new Date('2026-10-20T10:00:00Z'))!
const blackWeek = periodeActive(config, new Date('2026-11-24T10:00:00Z'))!

describe('métachamp et périodes', () => {
  it('lit les 3 périodes, paliers triés', () => {
    expect(config.periodes.map((p) => p.nom)).toEqual(['Échelle de cadeaux', 'Black Week', 'Échelle de cadeaux'])
    expect(octobre.paliers.map((p) => p.montant)).toEqual([60, 85, 100])
  })
  it('période selon l’heure, bornes incluses, sans fin pour la dernière', () => {
    expect(periodeActive(config, new Date('2026-10-13T09:29:59Z'))).toBeNull()
    expect(periodeActive(config, new Date('2026-11-22T22:59:59Z'))!.nom).toBe('Échelle de cadeaux')
    expect(blackWeek.nom).toBe('Black Week')
    expect(periodeActive(config, new Date('2027-03-01T00:00:00Z'))!.paliers[0].remise_shopify).toBe('gid://shopify/DiscountAutomaticNode/1932907446614')
  })
  it('date forcée seulement hors production', () => {
    const q = '?paliers_date=2026-11-24T10:00:00Z'
    const now = new Date('2026-10-20T10:00:00Z')
    expect(dateDeReference(q, 'preview', now).toISOString()).toBe('2026-11-24T10:00:00.000Z')
    expect(dateDeReference(q, 'production', now)).toBe(now)
    expect(dateDeReference('?paliers_date=nimporte', 'preview', now)).toBe(now)
  })
  it('métachamp invalide : null', () => {
    expect(parsePaliers('pas du json')).toBeNull()
    expect(parsePaliers('{"periodes":[{"du":"2026-01-01T00:00:00Z","paliers":[{"montant":60,"type":"cadeau","libelle":"x","variantes":[]}]}]}')).toBeNull()
  })
})

describe('bases', () => {
  const eligibles = new Set(['111', '222'])
  it('cadeaux : lignes non cadeaux de la collection, avant remises', () => {
    const lignes = [
      ligne({ id: 'a', productId: '111', subtotal: 40 }),
      ligne({ id: 'b', productId: '333', subtotal: 30 }), // accessoire hors collection
      ligne({ id: 'c', productId: '222', subtotal: 2.9, total: 0, cadeau: 60 }), // cadeau exclu
    ]
    expect(baseCadeaux(lignes, eligibles)).toBe(40)
  })
  it('livraison : après remises de commande', () => {
    expect(baseLivraison(90, 4.5)).toBe(85.5)
    expect(baseLivraison(10, 20)).toBe(0)
  })
})

describe('états et plan', () => {
  it('55 € : rien à ajouter, prochain palier à 5 €', () => {
    const etats = etatPaliers(octobre, ctx({ baseCadeaux: 55, baseLivraison: 55 }))
    expect(planCadeaux(etats, [], {})).toEqual([])
    expect(prochainPalier(etats)).toMatchObject({ reste: 5, palier: { libelle: 'Crunch Bar offerte' } })
  })
  it('61 € : Crunch Bar ajoutée, première variante en stock', () => {
    const etats = etatPaliers(octobre, ctx({ baseCadeaux: 61, baseLivraison: 61 }))
    expect(planCadeaux(etats, [], {})).toEqual([{ type: 'ajouter', variantId: DCPB, montant: 60 }])
    const sansDcpb = etatPaliers(octobre, ctx({ baseCadeaux: 61, stock: { ...stock, [DCPB]: false } }))
    expect(planCadeaux(sansDcpb, [], {})).toEqual([{ type: 'ajouter', variantId: PBC, montant: 60 }])
  })
  it('choix du parfum respecté', () => {
    const etats = etatPaliers(octobre, ctx({ baseCadeaux: 61 }))
    expect(planCadeaux(etats, [], { choix: { 60: PBC } })[0]).toMatchObject({ variantId: PBC })
  })
  it('101 € : shaker ajouté, Crunch Bar déjà là gardée', () => {
    const lignes = [ligne({ id: 'g', merchandiseId: DCPB, cadeau: 60 })]
    const etats = etatPaliers(octobre, ctx({ baseCadeaux: 101, baseLivraison: 101, lignes }))
    expect(planCadeaux(etats, lignes, {})).toEqual([{ type: 'ajouter', variantId: SHAKER, montant: 100 }])
    expect(prochainPalier(etats)).toBeNull()
  })
  it('retour à 58 € : les deux cadeaux retirés', () => {
    const lignes = [ligne({ id: 'g', merchandiseId: DCPB, cadeau: 60 }), ligne({ id: 's', merchandiseId: SHAKER, cadeau: 100 })]
    const etats = etatPaliers(octobre, ctx({ baseCadeaux: 58, lignes }))
    expect(planCadeaux(etats, lignes, {})).toEqual([
      { type: 'retirer', lineId: 'g' },
      { type: 'retirer', lineId: 's' },
    ])
  })
  it('cadeau retiré par le client : pas remis de force', () => {
    const etats = etatPaliers(octobre, ctx({ baseCadeaux: 70, refuses: new Set([60]) }))
    expect(planCadeaux(etats, [], {})).toEqual([])
    expect(etats[0].refuse).toBe(true)
  })
  it('cadeau tenu par un article acheté (parAchat) : ligne cadeau retirée, aucun ajout', () => {
    const lignes = [ligne({ id: 'g', merchandiseId: DCPB, cadeau: 60 })]
    const etats = etatPaliers(octobre, ctx({ baseCadeaux: 70, lignes })).map((e) => (e.palier.montant === 60 ? { ...e, parAchat: 1 } : e))
    expect(planCadeaux(etats, lignes)).toEqual([{ type: 'retirer', lineId: 'g' }])
    expect(planCadeaux(etats.map((e) => ({ ...e, lignes: [] })), [])).toEqual([])
  })
  it('quantité forcée à 1, doublon retiré', () => {
    const lignes = [ligne({ id: 'g', merchandiseId: DCPB, cadeau: 60, quantity: 3 }), ligne({ id: 'h', merchandiseId: PBC, cadeau: 60 })]
    const etats = etatPaliers(octobre, ctx({ baseCadeaux: 70, lignes }))
    expect(planCadeaux(etats, lignes, {})).toEqual([
      { type: 'retirer', lineId: 'h' },
      { type: 'quantite1', lineId: 'g' },
    ])
  })
  it('aucune variante en stock : palier masqué', () => {
    const etats = etatPaliers(octobre, ctx({ baseCadeaux: 70, stock: { [SHAKER]: true } }))
    expect(etats.map((e) => e.palier.montant)).toEqual([85, 100])
  })
  it('Black Week : créatine à 100 €, Crunch Bar d’octobre retirée', () => {
    const lignes = [ligne({ id: 'g', merchandiseId: DCPB, cadeau: 60 })]
    const etats = etatPaliers(blackWeek, ctx({ baseCadeaux: 120, baseLivraison: 120, lignes }))
    expect(planCadeaux(etats, lignes, {})).toEqual([
      { type: 'retirer', lineId: 'g' },
      { type: 'ajouter', variantId: CREA, montant: 100 },
    ])
  })
  it('retrait en boutique : pas de palier livraison', () => {
    expect(etatPaliers(octobre, ctx({ retraitBoutique: true })).map((e) => e.palier.type)).toEqual(['cadeau', 'cadeau'])
  })
  it('accessoires seuls : livraison progresse, cadeaux non', () => {
    const etats = etatPaliers(octobre, ctx({ baseCadeaux: 0, baseLivraison: 90 }))
    expect(etats.find((e) => e.palier.type === 'livraison')!.atteint).toBe(true)
    expect(prochainPalier(etats)!.palier.montant).toBe(60)
  })
  it('cadeau facturé (non passé à 0 €) : signalé', () => {
    const lignes = [ligne({ id: 'g', cadeau: 60, subtotal: 2.9, total: 2.9 }), ligne({ id: 'h', cadeau: 100, subtotal: 6.9, total: 0 })]
    expect(cadeauxPayants(lignes).map((l) => l.id)).toEqual(['g'])
  })
})
