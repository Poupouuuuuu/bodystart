import { describe, it, expect } from 'vitest'
import type { ShopifyCart } from '@/lib/shopify/types'
import { parsePaliers, periodeActive, sansRemisesInactives } from './index'
import { calculerCadeaux, type DonneesPaliers } from './panier'

// Métachamp bodystart.paliers_cadeaux du 21/11/2026, avec la Black Week avancée
// au 21/11 (remise Shopify active depuis ce matin) : chevauchement avec
// l'échelle les 21 et 22/11.
const CRUNCH = 'gid://shopify/ProductVariant/54097477534038'
const SHAKER = 'gid://shopify/ProductVariant/54795484332374'
const CREATINE = 'gid://shopify/ProductVariant/53981935206742'
const REMISE_ECHELLE = 'gid://shopify/DiscountAutomaticNode/1'
const REMISE_BW = 'gid://shopify/DiscountAutomaticNode/2'
const LIVRAISON = { montant: 85, type: 'livraison', libelle: 'Livraison offerte (Mondial Relay ou Colissimo)' }
const echelle = (du: string, au: string | null) => ({
  nom: 'Échelle de cadeaux', du, au,
  paliers: [
    { montant: 60, type: 'cadeau', libelle: 'Crunch Bar offerte', variantes: [{ id: CRUNCH, nom: 'Crunch Bar' }], remise_shopify: REMISE_ECHELLE },
    LIVRAISON,
    { montant: 100, type: 'cadeau', libelle: 'Shaker offert', variantes: [{ id: SHAKER, nom: 'Shaker' }], remise_shopify: REMISE_ECHELLE },
  ],
})
const brut = parsePaliers(JSON.stringify({
  periodes: [
    echelle('2026-10-13T09:30:00Z', '2026-11-22T22:59:59Z'),
    {
      nom: 'Black Week', du: '2026-11-21T09:00:00Z', au: '2026-11-28T22:59:59Z',
      paliers: [
        LIVRAISON,
        { montant: 100, type: 'cadeau', libelle: 'Créatine Dedicated 500 g offerte', variantes: [{ id: CREATINE, nom: 'Créatine Dedicated 500 g' }], remise_shopify: REMISE_BW },
      ],
    },
    echelle('2026-11-28T23:00:00Z', null),
  ],
}))!

const SAMEDI = new Date('2026-11-21T10:00:00Z')
const montants = (d: Date, c = brut) => periodeActive(c, d)?.paliers.map((p) => `${p.montant} ${p.libelle}`)

describe('Black Week 2026 : périodes et remise Shopify', () => {
  it('21 et 22/11 : échelle et Black Week réunies, la créatine remplace le shaker à 100 €', () => {
    expect(periodeActive(brut, SAMEDI)?.nom).toBe('Black Week')
    expect(montants(SAMEDI)).toEqual(['60 Crunch Bar offerte', '85 Livraison offerte (Mondial Relay ou Colissimo)', '100 Créatine Dedicated 500 g offerte'])
  })
  it('avant la Black Week, pendant et après : une seule période', () => {
    expect(montants(new Date('2026-11-21T08:00:00Z'))).toEqual(['60 Crunch Bar offerte', '85 Livraison offerte (Mondial Relay ou Colissimo)', '100 Shaker offert'])
    expect(montants(new Date('2026-11-25T10:00:00Z'))).toEqual(['85 Livraison offerte (Mondial Relay ou Colissimo)', '100 Créatine Dedicated 500 g offerte'])
    expect(montants(new Date('2026-11-28T22:59:59Z'))).toContain('100 Créatine Dedicated 500 g offerte')
    expect(montants(new Date('2026-11-28T23:00:00Z'))).toContain('100 Shaker offert')
  })
  it('la remise fait foi : coupée par la boutique (40 pots, stock 0) ou introuvable → palier retiré ; statut inconnu → gardé', () => {
    const coupee = sansRemisesInactives(brut, { [REMISE_BW]: 'EXPIRED', [REMISE_ECHELLE]: 'ACTIVE' })
    expect(montants(new Date('2026-11-25T10:00:00Z'), coupee)).toEqual(['85 Livraison offerte (Mondial Relay ou Colissimo)'])
    // Chevauchement : sans créatine, le shaker de l'échelle revient
    expect(montants(SAMEDI, coupee)).toContain('100 Shaker offert')
    expect(montants(SAMEDI, sansRemisesInactives(brut, { [REMISE_BW]: 'ABSENTE' }))).toContain('100 Shaker offert')
    expect(montants(SAMEDI, sansRemisesInactives(brut, { [REMISE_BW]: null }))).toContain('100 Créatine Dedicated 500 g offerte')
  })
})

// ─── Panier ───
const donnees: DonneesPaliers = {
  periodes: brut.periodes.map((p) => ({ ...p, paliers: p.paliers.map((x) => (x.type === 'cadeau' ? { ...x, ensemble: 0 } : x)) })),
  ensembles: [['100', '200']],
  stock: { [CRUNCH]: true, [SHAKER]: true, [CREATINE]: true },
  titres: ['Black Week : créatine offerte dès 100 €', 'Cadeaux dès 100 € : shaker et Crunch Bar offerts'],
}
const money = (n: number) => ({ amount: n.toFixed(2), currencyCode: 'EUR' })
type L = { id: string; variant?: string; product?: string; qty?: number; prix: number; total?: number; cadeau?: number; remises?: { titre: string; montant: number }[] }
function panier(lignes: L[]): ShopifyCart {
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
  }
}
const opts = { now: SAMEDI, refuses: new Set<number>(), choix: {}, retraitBoutique: false }
const ajouts = (r: ReturnType<typeof calculerCadeaux>) =>
  r.actions.filter((a) => a.type === 'ajouter').map((a) => (a as { variantId: string }).variantId)

describe('Black Week 2026 : créatine offerte dès 100 €', () => {
  it('a. dès 100 € de la collection : créatine ajoutée (une seule) ; la créatine offerte ne compte pas dans les 100 €', () => {
    expect(ajouts(calculerCadeaux(panier([{ id: 'a', prix: 120 }]), donnees, opts))).toContain(CREATINE)
    expect(ajouts(calculerCadeaux(panier([{ id: 'a', prix: 99 }]), donnees, opts))).not.toContain(CREATINE)
    // 70 € + créatine offerte (36,90 €) : base 70 € → créatine retirée
    const sous = calculerCadeaux(panier([{ id: 'a', prix: 70 }, { id: 'g', variant: CREATINE, prix: 36.9, total: 0, cadeau: 100 }]), donnees, opts)
    expect(sous.actions).toContainEqual({ type: 'retirer', lineId: 'g' })
    // Une seule par panier : doublon retiré
    const deux = calculerCadeaux(
      panier([{ id: 'a', prix: 120 }, { id: 'g1', variant: CREATINE, prix: 36.9, total: 0, cadeau: 100 }, { id: 'g2', variant: CREATINE, prix: 36.9, total: 0, cadeau: 100 }]),
      donnees,
      opts
    )
    expect(deux.actions).toContainEqual({ type: 'retirer', lineId: 'g2' })
  })

  it('b. remise absente (coupée, finie, non cumulable) : la créatine ajoutée par le site reste à 36,90 € → retirée, jamais facturée, pas réajoutée', () => {
    // Panier stable (Crunch Bar déjà offerte) : seul changement, la créatine facturée
    const crunch = { id: 'cb', variant: CRUNCH, prix: 2.9, total: 0, cadeau: 60, remises: [{ titre: 'Cadeaux dès 100 € : shaker et Crunch Bar offerts', montant: 2.9 }] }
    const cart = panier([{ id: 'a', prix: 120 }, crunch, { id: 'g', variant: CREATINE, prix: 36.9, total: 36.9, cadeau: 100 }])
    const r = calculerCadeaux(cart, donnees, opts)
    expect(r.actions).toEqual([{ type: 'retirer', lineId: 'g' }])
    expect(Object.keys(r.nonAccorder)).toEqual(['100'])
    const apres = calculerCadeaux(panier([{ id: 'a', prix: 120 }, crunch]), donnees, { ...opts, nonAccordes: r.nonAccorder })
    expect(apres.actions).toEqual([])
    expect(ajouts(apres)).not.toContain(CREATINE)
    expect(apres.etats.find((e) => e.palier.montant === 100)?.nonAccorde).toBe(true)
  })

  it('c. après le 28/11 23 h 59 : plus de palier créatine, la ligne restante est retirée', () => {
    const cart = panier([{ id: 'a', prix: 120 }, { id: 'g', variant: CREATINE, prix: 36.9, total: 36.9, cadeau: 100 }])
    const r = calculerCadeaux(cart, donnees, { ...opts, now: new Date('2026-11-28T23:30:00Z') })
    expect(r.actions).toContainEqual({ type: 'retirer', lineId: 'g' })
    expect(ajouts(r)).not.toContain(CREATINE)
  })

  it('e. créatine déjà mise par le client : pas de 2e offerte', () => {
    const r = calculerCadeaux(
      panier([{ id: 'a', prix: 110 }, { id: 'c', variant: CREATINE, product: '200', prix: 36.9, total: 0, remises: [{ titre: 'Black Week : créatine offerte dès 100 €', montant: 36.9 }] }]),
      donnees,
      opts
    )
    expect(ajouts(r)).not.toContain(CREATINE)
    expect(r.etats.find((e) => e.palier.montant === 100)?.parAchat).toBe(1)
    expect(r.offertsParAchat).toBe(0) // pas de message « Ta Crunch Bar est offerte »
    // 89,90 € + créatine achetée : Shopify ne la compte pas dans le minimum → pas offerte, pas de 2e,
    // et la barre dit « Plus que 10,10 € »
    const court = calculerCadeaux(
      panier([{ id: 'a', prix: 89.9 }, { id: 'c', variant: CREATINE, product: '200', prix: 36.9 }]),
      donnees,
      opts
    )
    expect(ajouts(court)).not.toContain(CREATINE)
    const creatine = court.etats.find((e) => e.palier.montant === 100)!
    expect([creatine.atteint, creatine.reste, creatine.parAchat]).toEqual([false, 10.1, 0])
  })

  it('f. Crunch Bar refacturée quand la créatine est offerte (remises non cumulables) : retirée et plus proposée', () => {
    const cart = panier([
      { id: 'a', prix: 120 },
      { id: 'cb', variant: CRUNCH, prix: 2.9, total: 2.9, cadeau: 60 },
      { id: 'g', variant: CREATINE, prix: 36.9, total: 0, cadeau: 100, remises: [{ titre: 'Black Week : créatine offerte dès 100 €', montant: 36.9 }] },
    ])
    const r = calculerCadeaux(cart, donnees, opts)
    expect(r.actions).toEqual([{ type: 'retirer', lineId: 'cb' }])
    const apres = calculerCadeaux(
      panier([{ id: 'a', prix: 120 }, { id: 'g', variant: CREATINE, prix: 36.9, total: 0, cadeau: 100, remises: [{ titre: 'Black Week : créatine offerte dès 100 €', montant: 36.9 }] }]),
      donnees,
      { ...opts, nonAccordes: r.nonAccorder }
    )
    expect(apres.actions).toEqual([])
    expect(apres.etats.find((e) => e.palier.montant === 60)?.nonAccorde).toBe(true)
  })
})
