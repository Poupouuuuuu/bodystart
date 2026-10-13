import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import type { ShopifyCart } from '@/lib/shopify/types'
import { parsePaliers } from './index'
import { calculerCadeaux, type DonneesPaliers } from './panier'

const config = parsePaliers(fs.readFileSync(path.join(__dirname, 'fixtures/paliers-2026-10-13.json'), 'utf8'))!
const DCPB = 'gid://shopify/ProductVariant/54097477534038'
const SHAKER = 'gid://shopify/ProductVariant/54795484332374'
const donnees: DonneesPaliers = {
  periodes: config.periodes.map((p) => ({ ...p, paliers: p.paliers.map((x) => (x.type === 'cadeau' ? { ...x, ensemble: 0 } : x)) })),
  ensembles: [['100', '10832196010326']],
  stock: { [DCPB]: true, [SHAKER]: true, 'gid://shopify/ProductVariant/54401705804118': true },
}
const money = (n: number) => ({ amount: n.toFixed(2), currencyCode: 'EUR' })
type L = { id: string; variant?: string; product?: string; qty?: number; prix: number; total?: number; cadeau?: number; remises?: { titre: string; montant: number }[] }
function panier(lignes: L[], extra: Partial<ShopifyCart> = {}): ShopifyCart {
  const nodes = lignes.map((l) => ({
    id: l.id,
    quantity: l.qty ?? 1,
    attributes: l.cadeau ? [{ key: '_cadeau', value: String(l.cadeau) }] : [],
    merchandise: { id: l.variant ?? 'gid://shopify/ProductVariant/1', title: 'x', price: money(l.prix), selectedOptions: [], product: { id: `gid://shopify/Product/${l.product ?? '100'}`, handle: 'x', title: 'x', featuredImage: null } },
    cost: { subtotalAmount: money(l.prix * (l.qty ?? 1)), totalAmount: money(l.total ?? l.prix * (l.qty ?? 1)) },
    discountAllocations: (l.remises ?? []).map((r) => ({ discountedAmount: money(r.montant), title: r.titre })),
  }))
  const sub = nodes.reduce((s, n) => s + Number(n.cost.totalAmount.amount), 0)
  return {
    id: 'c', checkoutUrl: '', totalQuantity: nodes.length,
    lines: { nodes: nodes as unknown as ShopifyCart['lines']['nodes'] },
    cost: { subtotalAmount: money(sub), totalAmount: money(sub) },
    discountCodes: [], discountAllocations: [], attributes: [],
    ...extra,
  }
}
const opts = { now: new Date('2026-10-20T10:00:00Z'), refuses: new Set<number>(), choix: {}, retraitBoutique: false }

describe('calculerCadeaux', () => {
  it('61 € de compléments : Crunch Bar ajoutée', () => {
    const r = calculerCadeaux(panier([{ id: 'a', prix: 61 }]), donnees, opts)
    expect(r.actions).toEqual([{ type: 'ajouter', variantId: DCPB, montant: 60 }])
    expect(r.horsBase).toBe(false)
  })
  it('accessoires seuls : pas de cadeau, signalé hors base', () => {
    const r = calculerCadeaux(panier([{ id: 'a', prix: 95, product: '999' }]), donnees, opts)
    expect(r.actions).toEqual([])
    expect(r.horsBase).toBe(true)
    expect(r.etats.find((e) => e.palier.type === 'livraison')!.atteint).toBe(true)
  })
  it('code appliqué (cumulable depuis le 13/10/2026) : le cadeau est ajouté comme sans code', () => {
    const cart = panier([{ id: 'a', prix: 70 }], { discountCodes: [{ code: 'BIENVENUE5', applicable: true }] })
    expect(calculerCadeaux(cart, donnees, opts).actions).toEqual([{ type: 'ajouter', variantId: DCPB, montant: 60 }])
    const avecCadeau = panier(
      [{ id: 'a', prix: 70 }, { id: 'g', variant: DCPB, prix: 2.9, total: 0, cadeau: 60 }],
      { discountCodes: [{ code: 'LY-ABCD1234', applicable: true }] }
    )
    expect(calculerCadeaux(avecCadeau, donnees, opts).actions).toEqual([])
  })
  it('vieux code non cumulable : cadeau refacturé retiré ; code retiré, le cadeau revient', () => {
    const codes = [{ code: 'VIEUXCODE', applicable: true }]
    const r = calculerCadeaux(
      panier([{ id: 'a', prix: 70 }, { id: 'g', variant: DCPB, prix: 2.9, total: 2.9, cadeau: 60 }], { discountCodes: codes }),
      donnees,
      opts
    )
    expect(r.actions).toEqual([{ type: 'retirer', lineId: 'g' }])
    const memo = { ...opts, nonAccordes: r.nonAccorder }
    expect(calculerCadeaux(panier([{ id: 'a', prix: 70 }], { discountCodes: codes }), donnees, memo).actions).toEqual([])
    expect(calculerCadeaux(panier([{ id: 'a', prix: 70 }]), donnees, memo).actions).toEqual([
      { type: 'ajouter', variantId: DCPB, montant: 60 },
    ])
  })
  it('cadeau facturé par Shopify : retiré, jamais payé, pas réajouté', () => {
    const cart = panier([{ id: 'a', prix: 70 }, { id: 'g', variant: DCPB, prix: 2.9, total: 2.9, cadeau: 60 }])
    const r = calculerCadeaux(cart, donnees, opts)
    expect(r.actions).toEqual([{ type: 'retirer', lineId: 'g' }])
    expect(r.nonAccorder).toEqual({ 60: '60|||1x1' })
  })
  it('cadeau refusé par Shopify : retiré, ni réajouté ni proposé, tant que le contexte tient', () => {
    // Constaté le 13/10/2026 avant la remise unique à 100 € : shaker à 0 €, Crunch Bar repassée à 2,90 €.
    const avant = panier([
      { id: 'a', prix: 105 },
      { id: 'g60', variant: DCPB, prix: 2.9, total: 2.9, cadeau: 60 },
      { id: 'g100', variant: SHAKER, prix: 6.9, total: 0, cadeau: 100 },
    ])
    const r = calculerCadeaux(avant, donnees, opts)
    expect(r.actions).toEqual([{ type: 'retirer', lineId: 'g60' }])
    expect(r.nonAccorder).toEqual({ 60: '60,100||100|1x1' })

    const memo = { ...opts, nonAccordes: r.nonAccorder }
    const apres = calculerCadeaux(panier([{ id: 'a', prix: 105 }, { id: 'g100', variant: SHAKER, prix: 6.9, total: 0, cadeau: 100 }]), donnees, memo)
    expect(apres.actions).toEqual([])
    const crunch = apres.etats.find((e) => e.palier.montant === 60)!
    expect(crunch.nonAccorde).toBe(true)
    expect(crunch.refuse).toBe(false)

    // Shaker retiré par le client : la Crunch Bar redevient possible.
    const sansShaker = calculerCadeaux(panier([{ id: 'a', prix: 105 }]), donnees, { ...memo, refuses: new Set([100]) })
    expect(sansShaker.actions).toEqual([{ type: 'ajouter', variantId: DCPB, montant: 60 }])
    // Panier repassé sous 100 € : idem.
    const sous100 = calculerCadeaux(panier([{ id: 'a', prix: 80 }, { id: 'g100', variant: SHAKER, prix: 6.9, total: 6.9, cadeau: 100 }]), donnees, memo)
    expect(sous100.actions).toEqual([{ type: 'ajouter', variantId: DCPB, montant: 60 }, { type: 'retirer', lineId: 'g100' }])
    expect(sous100.nonAccorder).toEqual({})
  })
  describe('gratuité posée sur un article acheté (paniers mesurés le 13/10/2026)', () => {
    const R60 = 'Cadeau dès 60 € : Crunch Bar offerte'
    const R100 = 'Cadeaux dès 100 € : shaker et Crunch Bar offerts'
    const avecTitres = { ...donnees, titres: [R60, R100] }
    const PBC = 'gid://shopify/ProductVariant/54401705804118'

    it('60 € : Crunch DCPB achetée remisée, cadeau à 2,90 € → cadeau gardé, affiché offert', () => {
      const cart = panier([
        { id: 'a', prix: 60.8 },
        { id: 'achat', variant: DCPB, prix: 2.9, total: 0, remises: [{ titre: R60, montant: 2.9 }] },
        { id: 'g', variant: DCPB, prix: 2.9, total: 2.9, cadeau: 60, remises: [{ titre: R60, montant: 0 }] },
      ])
      const r = calculerCadeaux(cart, avecTitres, opts)
      expect(r.actions).toEqual([])
      expect(r.nonAccorder).toEqual({})
      expect(r.affiches).toEqual({ g: 0, achat: 2.9 })
    })
    it('60 € : Crunch PB Cup achetée remisée à la place de la DCPB offerte → même règle (même prix, autre parfum)', () => {
      const cart = panier([
        { id: 'a', prix: 60.8 },
        { id: 'achat', variant: PBC, prix: 2.9, total: 0, remises: [{ titre: R60, montant: 2.9 }] },
        { id: 'g60', variant: DCPB, prix: 2.9, total: 2.9, cadeau: 60 },
      ])
      const r = calculerCadeaux(cart, avecTitres, opts)
      expect(r.actions).toEqual([])
      expect(r.affiches).toEqual({ g60: 0, achat: 2.9 })
    })
    it('100 € : Crunch achetée et Crunch offerte remisées, shaker à 6,90 € → on retire la Crunch offerte et on juge le shaker au tour suivant', () => {
      const cart = panier([
        { id: 'a', prix: 98.7 },
        { id: 'achat', variant: DCPB, prix: 2.9, total: 0, remises: [{ titre: R100, montant: 2.9 }] },
        { id: 'g60', variant: DCPB, prix: 2.9, total: 0, cadeau: 60, remises: [{ titre: R100, montant: 2.9 }] },
        { id: 'g100', variant: SHAKER, prix: 6.9, total: 6.9, cadeau: 100 },
      ])
      const r = calculerCadeaux(cart, avecTitres, opts)
      expect(r.actions).toEqual([{ type: 'retirer', lineId: 'g60' }])
      expect(r.nonAccorder).toEqual({})
    })
    it('une autre promo automatique (3 achetées, 1 offerte) ne couvre jamais un cadeau', () => {
      const cart = panier([
        { id: 'a', prix: 60.8 },
        { id: 'achat', variant: DCPB, qty: 3, prix: 2.9, total: 5.8, remises: [{ titre: '3 Crunch achetées, 1 offerte', montant: 2.9 }] },
        { id: 'g', variant: DCPB, prix: 2.9, total: 2.9, cadeau: 60 },
      ])
      const r = calculerCadeaux(cart, avecTitres, opts)
      expect(r.actions).toEqual([{ type: 'retirer', lineId: 'g' }])
      expect(r.affiches).toEqual({})
    })
    it('sans les titres (ancienne réponse de /api/paliers) : protection inchangée, cadeau facturé retiré', () => {
      const cart = panier([
        { id: 'a', prix: 60.8 },
        { id: 'achat', variant: DCPB, prix: 2.9, total: 0, remises: [{ titre: R60, montant: 2.9 }] },
        { id: 'g', variant: DCPB, prix: 2.9, total: 2.9, cadeau: 60 },
      ])
      expect(calculerCadeaux(cart, donnees, opts).actions).toEqual([{ type: 'retirer', lineId: 'g' }])
    })
  })
  describe('Crunch Bar achetée à partir de 100 € : elle tient lieu de cadeau (Claude Gestion, 13/10/2026)', () => {
    const R100 = 'Cadeaux dès 100 € : shaker et Crunch Bar offerts'
    const avecTitres = { ...donnees, titres: ['Cadeau dès 60 € : Crunch Bar offerte', R100] }
    const PBC = 'gid://shopify/ProductVariant/54401705804118'

    it('de 60 à 99 € : la Crunch achetée ne remplace pas le cadeau', () => {
      const r = calculerCadeaux(panier([{ id: 'a', prix: 61 }, { id: 'achat', variant: DCPB, prix: 2.9 }]), avecTitres, opts)
      expect(r.actions).toEqual([{ type: 'ajouter', variantId: DCPB, montant: 60 }])
      expect(r.offertsParAchat).toBe(0)
    })
    it('1 Crunch achetée : pas de Crunch cadeau (retirée si présente), shaker ajouté, « Ta Crunch Bar est offerte. »', () => {
      const r = calculerCadeaux(
        panier([
          { id: 'a', prix: 101 },
          { id: 'achat', variant: PBC, prix: 2.9 },
          { id: 'g60', variant: DCPB, prix: 2.9, total: 0, cadeau: 60 },
        ]),
        avecTitres,
        opts
      )
      expect(r.actions).toEqual([
        { type: 'retirer', lineId: 'g60' },
        { type: 'ajouter', variantId: SHAKER, montant: 100 },
      ])
      expect(r.offertsParAchat).toBe(1)
      expect(r.etats.find((e) => e.palier.montant === 60)!.parAchat).toBe(1)
    })
    it('1 Crunch achetée, Shopify offre la Crunch et le shaker : rien à faire, la Crunch achetée s\'affiche offerte', () => {
      const r = calculerCadeaux(
        panier([
          { id: 'a', prix: 101 },
          { id: 'achat', variant: DCPB, prix: 2.9, total: 0, remises: [{ titre: R100, montant: 2.9 }] },
          { id: 'g100', variant: SHAKER, prix: 6.9, total: 0, cadeau: 100, remises: [{ titre: R100, montant: 6.9 }] },
        ]),
        avecTitres,
        opts
      )
      expect(r.actions).toEqual([])
      expect(r.lignesOffertes).toEqual(['achat'])
    })
    it('2 Crunch achetées : Shopify les offre, shaker refacturé et retiré, message « à la place du shaker »', () => {
      const r = calculerCadeaux(
        panier([
          { id: 'a', prix: 101 },
          { id: 'achat', variant: DCPB, qty: 2, prix: 2.9, total: 0, remises: [{ titre: R100, montant: 5.8 }] },
          { id: 'g100', variant: SHAKER, prix: 6.9, total: 6.9, cadeau: 100 },
        ]),
        avecTitres,
        opts
      )
      expect(r.actions).toEqual([{ type: 'retirer', lineId: 'g100' }])
      expect(Object.keys(r.nonAccorder)).toEqual(['100'])
      expect(r.offertsParAchat).toBe(2)
      expect(r.lignesOffertes).toEqual(['achat'])
      // Le client garde une seule Crunch : le shaker revient.
      const memo = { ...opts, nonAccordes: r.nonAccorder }
      const une = calculerCadeaux(panier([{ id: 'a', prix: 101 }, { id: 'achat', variant: DCPB, prix: 2.9 }]), avecTitres, memo)
      expect(une.actions).toEqual([{ type: 'ajouter', variantId: SHAKER, montant: 100 }])
    })
  })
  it('base livraison après remises de commande', () => {
    const cart = panier([{ id: 'a', prix: 88 }], { discountAllocations: [{ discountedAmount: money(4.4), code: 'LY-X' }] })
    const liv = calculerCadeaux(cart, donnees, opts).etats.find((e) => e.palier.type === 'livraison')!
    expect(liv.base).toBe(83.6)
    expect(liv.atteint).toBe(false)
  })
})
