import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import type { ShopifyCart } from '@/lib/shopify/types'
import { parsePaliers } from './index'
import { calculerCadeaux, avecLeCode, type DonneesPaliers } from './panier'

const config = parsePaliers(fs.readFileSync(path.join(__dirname, 'fixtures/paliers-2026-10-13.json'), 'utf8'))!
const DCPB = 'gid://shopify/ProductVariant/54097477534038'
const SHAKER = 'gid://shopify/ProductVariant/54795484332374'
const donnees: DonneesPaliers = {
  periodes: config.periodes.map((p) => ({ ...p, paliers: p.paliers.map((x) => (x.type === 'cadeau' ? { ...x, ensemble: 0 } : x)) })),
  ensembles: [['100', '10832196010326']],
  stock: { [DCPB]: true, [SHAKER]: true, 'gid://shopify/ProductVariant/54401705804118': true },
}
const money = (n: number) => ({ amount: n.toFixed(2), currencyCode: 'EUR' })
type L = { id: string; variant?: string; product?: string; qty?: number; prix: number; total?: number; cadeau?: number }
function panier(lignes: L[], extra: Partial<ShopifyCart> = {}): ShopifyCart {
  const nodes = lignes.map((l) => ({
    id: l.id,
    quantity: l.qty ?? 1,
    attributes: l.cadeau ? [{ key: '_cadeau', value: String(l.cadeau) }] : [],
    merchandise: { id: l.variant ?? 'gid://shopify/ProductVariant/1', title: 'x', price: money(l.prix), selectedOptions: [], product: { id: `gid://shopify/Product/${l.product ?? '100'}`, handle: 'x', title: 'x', featuredImage: null } },
    cost: { subtotalAmount: money(l.prix * (l.qty ?? 1)), totalAmount: money(l.total ?? l.prix * (l.qty ?? 1)) },
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
const opts = { now: new Date('2026-10-20T10:00:00Z'), refuses: new Set<number>(), choix: {}, codesTestes: new Set<string>(), retraitBoutique: false }

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
  it('cagnotte appliquée : pas de cadeau, palier marqué pour le bouton', () => {
    const cart = panier([{ id: 'a', prix: 70 }], { discountCodes: [{ code: 'LY-ABCD1234', applicable: true }] })
    const r = calculerCadeaux(cart, donnees, opts)
    expect(r.actions).toEqual([])
    expect(r.codeBloquant).toBe('LY-ABCD1234')
    expect(r.refuser).toEqual([60])
    expect(avecLeCode(r.codeBloquant!)).toBe('avec ta cagnotte')
    expect(avecLeCode('BIENVENUE5')).toBe('avec ton code BIENVENUE5')
  })
  it('code refusé avec un cadeau au panier : cadeau retiré une fois pour tester le code', () => {
    const cart = panier(
      [{ id: 'a', prix: 70 }, { id: 'g', variant: DCPB, prix: 2.9, total: 0, cadeau: 60 }],
      { discountCodes: [{ code: 'BIENVENUE5', applicable: false }] }
    )
    const r = calculerCadeaux(cart, donnees, opts)
    expect(r.actions).toEqual([{ type: 'retirer', lineId: 'g' }])
    expect(r.codesATester).toBe('BIENVENUE5')
    // Code toujours refusé après le test (autre raison) : le cadeau revient.
    const apres = calculerCadeaux(panier([{ id: 'a', prix: 70 }], { discountCodes: [{ code: 'BIENVENUE5', applicable: false }] }), donnees, {
      ...opts, codesTestes: new Set(['BIENVENUE5']),
    })
    expect(apres.actions).toEqual([{ type: 'ajouter', variantId: DCPB, montant: 60 }])
  })
  it('cadeau facturé par Shopify : retiré, jamais payé, pas réajouté', () => {
    const cart = panier([{ id: 'a', prix: 70 }, { id: 'g', variant: DCPB, prix: 2.9, total: 2.9, cadeau: 60 }])
    const r = calculerCadeaux(cart, donnees, opts)
    expect(r.actions).toEqual([{ type: 'retirer', lineId: 'g' }])
    expect(r.refuser).toEqual([])
    expect(r.nonAccorder).toEqual({ 60: '60||' })
  })
  it('au-delà de 100 € Shopify ne garde qu\'un cadeau : Crunch Bar retirée, ni réajoutée ni proposée, tant que le contexte tient', () => {
    // Shopify : shaker à 0 €, Crunch Bar repassée à 2,90 € (constaté sur la preview le 13/10/2026).
    const avant = panier([
      { id: 'a', prix: 105 },
      { id: 'g60', variant: DCPB, prix: 2.9, total: 2.9, cadeau: 60 },
      { id: 'g100', variant: SHAKER, prix: 6.9, total: 0, cadeau: 100 },
    ])
    const r = calculerCadeaux(avant, donnees, opts)
    expect(r.actions).toEqual([{ type: 'retirer', lineId: 'g60' }])
    expect(r.nonAccorder).toEqual({ 60: '60,100||100' })

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
  it('base livraison après remises de commande', () => {
    const cart = panier([{ id: 'a', prix: 88 }], { discountAllocations: [{ discountedAmount: money(4.4), code: 'LY-X' }] })
    const liv = calculerCadeaux(cart, donnees, opts).etats.find((e) => e.palier.type === 'livraison')!
    expect(liv.base).toBe(83.6)
    expect(liv.atteint).toBe(false)
  })
})
