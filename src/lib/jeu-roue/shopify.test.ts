import { describe, it, expect, vi, beforeEach } from 'vitest'

const adminFetch = vi.fn()
vi.mock('@/lib/shopify/client', () => ({ shopifyAdminFetch: (...a: unknown[]) => adminFetch(...a) }))
const noterErreur = vi.fn()
vi.mock('./journal', () => ({ noterErreur: (...a: unknown[]) => noterErreur(...a) }))

import {
  discountInput,
  readResult,
  lotsAvailability,
  upsertCustomer,
  createLotDiscount,
  markParticipant,
  getCustomerByEmail,
  claimSpin,
  type ShopCustomer,
} from './shopify'
import { LOTS, lotById } from './lots'

const entry = { firstName: 'Léa', lastName: 'Dupont', email: 'lea@exemple.fr', phone: '+33612345678', optIn: true }

beforeEach(() => {
  adminFetch.mockReset()
  noterErreur.mockReset()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('discountInput', () => {
  const start = new Date('2026-10-07T10:00:00Z')
  const end = new Date('2026-11-06T10:00:00Z')

  it('article offert : montant fixe une seule fois, limité aux cibles, 1 utilisation', () => {
    const input = discountInput(lotById('crunch-bar')!, 'ROUE-ABC234', 2.9, start, end)
    expect(input).toMatchObject({
      title: 'Jeu roue : Une barre protéinée au choix (Crunch Bar, Smart Bar ou Applied Crunch) : ROUE-ABC234',
      code: 'ROUE-ABC234',
      startsAt: '2026-10-07T10:00:00.000Z',
      endsAt: '2026-11-06T10:00:00.000Z',
      context: { all: 'ALL' },
      usageLimit: 1,
      appliesOncePerCustomer: false,
      combinesWith: { productDiscounts: true, orderDiscounts: true, shippingDiscounts: true },
      customerGets: {
        value: { discountAmount: { amount: '2.90', appliesOnEachItem: false } },
        items: { products: { productsToAdd: ['gid://shopify/Product/10832196010326', 'gid://shopify/Product/11371642061142', 'gid://shopify/Product/11371642093910'], productVariantsToAdd: [] } },
      },
    })
    expect(input).not.toHaveProperty('minimumRequirement')
  })

  it('bon de 5 € : toute la commande, minimum 30 €', () => {
    const input = discountInput(lotById('bon-5')!, 'ROUE-ABC234', 5, start, end)
    expect(input.customerGets.items).toEqual({ all: true })
    expect(input.minimumRequirement).toEqual({ subtotal: { greaterThanOrEqualToSubtotal: '30.00' } })
  })
})

describe('readResult', () => {
  it('lit le métachamp, ignore un contenu invalide', () => {
    const ok = { jeuRoue: { value: JSON.stringify({ lotId: 'shaker', code: 'ROUE-ABC234', endsAt: 'e', playedAt: 'p' }) } }
    expect(readResult(ok)).toEqual({ lotId: 'shaker', code: 'ROUE-ABC234', endsAt: 'e', playedAt: 'p' })
    expect(readResult({ jeuRoue: { value: '{"lotId":"inconnu","code":"ROUE-ABC234"}' } })).toBeNull()
    expect(readResult({ jeuRoue: { value: 'pas du json' } })).toBeNull()
    expect(readResult({ jeuRoue: null })).toBeNull()
  })
})

describe('lotsAvailability', () => {
  const level = (q: number) => ({ inventoryLevel: { quantities: [{ quantity: q }] } })

  it('retire un lot sans stock, garde la remise sur commande, prix max des cibles', async () => {
    adminFetch.mockResolvedValue({
      nodes: [
        { __typename: 'Product', id: 'gid://shopify/Product/10927490892118', variants: { nodes: [
          { id: 'a', price: '3.10', inventoryItem: level(0) },
          { id: 'b', price: '3.10', inventoryItem: level(0) },
        ] } },
        { __typename: 'Product', id: 'gid://shopify/Product/10832196010326', variants: { nodes: [
          { id: 'd', price: '2.90', inventoryItem: level(4) },
          { id: 'e', price: '2.90', inventoryItem: level(3) },
        ] } },
        { __typename: 'Product', id: 'gid://shopify/Product/11139051290966', variants: { nodes: [{ id: 'c', price: '6.90', inventoryItem: level(53) }] } },
        { __typename: 'ProductVariant', id: 'gid://shopify/ProductVariant/53981935206742', price: '36.90', inventoryItem: { inventoryLevel: null } },
        { __typename: 'ProductVariant', id: 'gid://shopify/ProductVariant/54095546483030', price: '44.90', inventoryItem: level(6) },
        { __typename: 'ProductVariant', id: 'gid://shopify/ProductVariant/54095546515798', price: '46.90', inventoryItem: level(0) },
      ],
    })
    const { available, prices, stock } = await lotsAvailability()
    expect([...available].sort()).toEqual(['bon-5', 'crunch-bar', 'shaker', 'whey'])
    // Unités en boutique par lot article (récap hebdo) : pas d'entrée pour le bon
    expect(Object.fromEntries(stock)).toEqual({ 'canette-abe': 0, 'crunch-bar': 7, shaker: 53, creatine: 0, whey: 6 })
    expect(prices.get('whey')).toBe(46.9)
    expect(prices.get('crunch-bar')).toBe(2.9)
    expect(adminFetch.mock.calls[0][1].loc).toBe('gid://shopify/Location/119350657366')
    expect(adminFetch.mock.calls[0][2]).toEqual({ apiVersion: '2026-04' })
  })
})

describe('upsertCustomer', () => {
  const existante = { customerByIdentifier: { id: 'gid://shopify/Customer/3', tags: [], jeuRoue: null } }
  const SUBSCRIBED = { marketingState: 'SUBSCRIBED', marketingOptInLevel: 'SINGLE_OPT_IN' }
  const pris = { field: ['phone'], message: 'Phone has already been taken' }
  const mutations = () => adminFetch.mock.calls.map((c) => (c[0] as string).match(/\{\s*(\w+)\(/)?.[1])

  it('nouveau client, case cochée : accords SMS et e-mail à la création', async () => {
    adminFetch
      .mockResolvedValueOnce({ customerByIdentifier: null })
      .mockResolvedValueOnce({ customerCreate: { customer: { id: 'gid://shopify/Customer/2' }, userErrors: [] } })
    await upsertCustomer(entry)
    const input = adminFetch.mock.calls[1][1].input
    expect(input).toMatchObject({ phone: '+33612345678', smsMarketingConsent: SUBSCRIBED, emailMarketingConsent: SUBSCRIBED })
    expect(input.smsMarketingConsent.consentUpdatedAt).toBe(input.emailMarketingConsent.consentUpdatedAt)
    expect(noterErreur).not.toHaveBeenCalled()
  })

  it('nouveau client, case décochée : aucun accord marketing envoyé', async () => {
    adminFetch
      .mockResolvedValueOnce({ customerByIdentifier: null })
      .mockResolvedValueOnce({ customerCreate: { customer: { id: 'gid://shopify/Customer/2' }, userErrors: [] } })
    await upsertCustomer({ ...entry, optIn: false })
    const input = adminFetch.mock.calls[1][1].input
    expect(input).not.toHaveProperty('emailMarketingConsent')
    expect(input).not.toHaveProperty('smsMarketingConsent')
  })

  it('client existant, case cochée : mise à jour puis accords e-mail et SMS', async () => {
    adminFetch
      .mockResolvedValueOnce(existante)
      .mockResolvedValueOnce({ customerUpdate: { userErrors: [] } })
      .mockResolvedValueOnce({ customerEmailMarketingConsentUpdate: { userErrors: [] } })
      .mockResolvedValueOnce({ customerSmsMarketingConsentUpdate: { userErrors: [] } })
    expect(await upsertCustomer(entry)).toBe('gid://shopify/Customer/3')
    expect(adminFetch.mock.calls[1][1].input).toMatchObject({ id: 'gid://shopify/Customer/3', firstName: 'Léa', phone: '+33612345678' })
    expect(mutations()).toEqual(['customerByIdentifier', 'customerUpdate', 'customerEmailMarketingConsentUpdate', 'customerSmsMarketingConsentUpdate'])
    expect(adminFetch.mock.calls[2][1].input.emailMarketingConsent).toMatchObject(SUBSCRIBED)
    expect(adminFetch.mock.calls[3][1].input.smsMarketingConsent).toMatchObject(SUBSCRIBED)
  })

  it('fiche déjà abonnée, case décochée : aucun accord touché, jamais de désabonnement', async () => {
    adminFetch.mockResolvedValueOnce(existante).mockResolvedValueOnce({ customerUpdate: { userErrors: [] } })
    await upsertCustomer({ ...entry, optIn: false })
    expect(mutations()).toEqual(['customerByIdentifier', 'customerUpdate'])
    expect(JSON.stringify(adminFetch.mock.calls)).not.toMatch(/MarketingConsent|UNSUBSCRIBED|NOT_SUBSCRIBED/)
  })

  it('nouveau client, téléphone déjà pris ailleurs, case cochée : recréé sans téléphone ni accord SMS, noté au journal', async () => {
    adminFetch
      .mockResolvedValueOnce({ customerByIdentifier: null })
      .mockResolvedValueOnce({ customerCreate: { customer: null, userErrors: [pris] } })
      .mockResolvedValueOnce({ customerCreate: { customer: { id: 'gid://shopify/Customer/1' }, userErrors: [] } })
    expect(await upsertCustomer(entry)).toBe('gid://shopify/Customer/1')
    const first = adminFetch.mock.calls[1][1].input
    const second = adminFetch.mock.calls[2][1].input
    expect(first).toMatchObject({ phone: '+33612345678', smsMarketingConsent: SUBSCRIBED })
    expect(second).not.toHaveProperty('phone')
    expect(second).not.toHaveProperty('smsMarketingConsent')
    expect(second.emailMarketingConsent).toMatchObject(SUBSCRIBED)
    expect(noterErreur).toHaveBeenCalledTimes(1)
    expect(noterErreur.mock.calls[0][0]).toEqual({
      etape: 'register',
      source: 'serveur',
      niveau: 'avertissement',
      message: 'accord SMS non enregistré, téléphone refusé : Phone has already been taken',
    })
  })

  it('téléphone déjà pris, case décochée : rien au journal', async () => {
    adminFetch
      .mockResolvedValueOnce({ customerByIdentifier: null })
      .mockResolvedValueOnce({ customerCreate: { customer: null, userErrors: [pris] } })
      .mockResolvedValueOnce({ customerCreate: { customer: { id: 'gid://shopify/Customer/1' }, userErrors: [] } })
    await upsertCustomer({ ...entry, optIn: false })
    expect(noterErreur).not.toHaveBeenCalled()
  })

  it('client existant, téléphone pris ailleurs, case cochée : mis à jour sans téléphone, accord e-mail seul, noté au journal', async () => {
    adminFetch
      .mockResolvedValueOnce(existante)
      .mockResolvedValueOnce({ customerUpdate: { userErrors: [pris] } })
      .mockResolvedValueOnce({ customerUpdate: { userErrors: [] } })
      .mockResolvedValueOnce({ customerEmailMarketingConsentUpdate: { userErrors: [] } })
    expect(await upsertCustomer(entry)).toBe('gid://shopify/Customer/3')
    expect(adminFetch.mock.calls[2][1].input).not.toHaveProperty('phone')
    expect(mutations()).toEqual(['customerByIdentifier', 'customerUpdate', 'customerUpdate', 'customerEmailMarketingConsentUpdate'])
    expect(noterErreur).toHaveBeenCalledTimes(1)
    expect(noterErreur.mock.calls[0][0].message).toBe('accord SMS non enregistré, téléphone refusé : Phone has already been taken')
  })

  it('client existant, autre erreur que le téléphone : pas présentée comme un conflit de téléphone', async () => {
    adminFetch
      .mockResolvedValueOnce(existante)
      .mockResolvedValueOnce({ customerUpdate: { userErrors: [{ field: ['lastName'], message: 'Last name is invalid' }] } })
      .mockResolvedValueOnce({ customerEmailMarketingConsentUpdate: { userErrors: [] } })
    await upsertCustomer(entry)
    expect(mutations()).toEqual(['customerByIdentifier', 'customerUpdate', 'customerEmailMarketingConsentUpdate'])
    expect(noterErreur).toHaveBeenCalledTimes(1)
    expect(noterErreur.mock.calls[0][0].message).toContain('customerUpdate')
  })

  it('ne relit jamais nom, e-mail ni téléphone (interdit sur le forfait actuel)', async () => {
    adminFetch.mockResolvedValueOnce({ customerByIdentifier: null })
    await getCustomerByEmail('lea@exemple.fr')
    const query = adminFetch.mock.calls[0][0] as string
    expect(query).not.toMatch(/firstName|lastName|email\s*\{|emailAddress\s*\{|defaultEmailAddress|defaultPhoneNumber|phone\s*\}/)
  })
})

describe('createLotDiscount', () => {
  it('retire un nouveau code si le premier existe déjà', async () => {
    adminFetch
      .mockResolvedValueOnce({ discountCodeBasicCreate: { codeDiscountNode: null, userErrors: [{ message: 'Code must be unique', code: 'TAKEN' }] } })
      .mockResolvedValueOnce({ discountCodeBasicCreate: { codeDiscountNode: { id: 'gid://shopify/DiscountCodeNode/9' }, userErrors: [] } })
    const { code, endsAt } = await createLotDiscount(LOTS[0], 3.1)
    expect(code).toMatch(/^ROUE-[A-HJ-NP-Z2-9]{6}$/)
    expect(adminFetch).toHaveBeenCalledTimes(2)
    const days = (new Date(endsAt).getTime() - Date.now()) / 86400000
    expect(Math.round(days)).toBe(30)
  })

  it('autre erreur Shopify : échec explicite', async () => {
    adminFetch.mockResolvedValueOnce({ discountCodeBasicCreate: { codeDiscountNode: null, userErrors: [{ message: 'Access denied' }] } })
    await expect(createLotDiscount(LOTS[0], 3.1)).rejects.toThrow('Access denied')
  })
})

describe('markParticipant', () => {
  const customer: ShopCustomer = { id: 'gid://shopify/Customer/4', tags: [], jeuRoue: null }
  const result = { lotId: 'shaker' as const, code: 'ROUE-ABC234', endsAt: '2026-11-06T10:00:00Z', playedAt: '2026-10-07T10:00:00Z' }

  it('résultat en métachamp (sans contrôle), étiquettes, note ajoutée à la suite', async () => {
    adminFetch
      .mockResolvedValueOnce({ metafieldsSet: { userErrors: [] } })
      .mockResolvedValueOnce({ tagsAdd: { userErrors: [] } })
      .mockResolvedValueOnce({ customer: { note: 'Client fidèle' } })
      .mockResolvedValueOnce({ customerUpdate: { userErrors: [] } })
    await markParticipant(customer, lotById('shaker')!, result)
    const mf = adminFetch.mock.calls[0][1].metafields[0]
    expect(JSON.parse(mf.value)).toEqual(result)
    expect(mf).not.toHaveProperty('compareDigest')
    expect(adminFetch.mock.calls[1][1].tags).toEqual(['jeu-roue', 'jeu-roue-shaker'])
    expect(adminFetch.mock.calls[3][1].input.note).toBe('Client fidèle\nJeu roue 07/10/2026 : Un shaker, code ROUE-ABC234')
  })

  it('case offres cochée : étiquette jeu-roue-optin en plus', async () => {
    adminFetch
      .mockResolvedValueOnce({ metafieldsSet: { userErrors: [] } })
      .mockResolvedValueOnce({ tagsAdd: { userErrors: [] } })
      .mockResolvedValueOnce({ customer: { note: null } })
      .mockResolvedValueOnce({ customerUpdate: { userErrors: [] } })
    await markParticipant(customer, lotById('shaker')!, result, true)
    expect(adminFetch.mock.calls[1][1].tags).toEqual(['jeu-roue', 'jeu-roue-shaker', 'jeu-roue-optin'])
  })

  it('note illisible : rien n’est écrit dans la note, le reste est fait', async () => {
    adminFetch
      .mockResolvedValueOnce({ metafieldsSet: { userErrors: [] } })
      .mockResolvedValueOnce({ tagsAdd: { userErrors: [] } })
      .mockRejectedValueOnce(new Error('Shopify GraphQL: access denied'))
    await markParticipant(customer, lotById('shaker')!, result)
    expect(adminFetch).toHaveBeenCalledTimes(3)
    expect(adminFetch.mock.calls.some((c) => String(c[0]).includes('customerUpdate'))).toBe(false)
  })
})

describe('claimSpin', () => {
  const stale = { metafieldsSet: { userErrors: [{ field: ['metafields', '0'], message: 'stale', code: 'STALE_OBJECT' }] } }
  const current = (value: unknown) => ({ customer: { jeuRoue: { value: JSON.stringify(value), compareDigest: 'abc' } } })

  it('métachamp absent : réservé avec compareDigest null', async () => {
    adminFetch.mockResolvedValueOnce({ metafieldsSet: { userErrors: [] } })
    expect(await claimSpin('gid://shopify/Customer/4')).toEqual({ status: 'claimed' })
    const mf = adminFetch.mock.calls[0][1].metafields[0]
    expect(mf.compareDigest).toBeNull()
    expect(JSON.parse(mf.value).status).toBe('pending')
  })

  it('résultat déjà là : rien de nouveau, lot réaffiché', async () => {
    adminFetch.mockResolvedValueOnce(stale).mockResolvedValueOnce(current({ lotId: 'shaker', code: 'ROUE-ABC234', endsAt: 'e', playedAt: 'p' }))
    expect(await claimSpin('gid://shopify/Customer/4')).toEqual({
      status: 'played',
      result: { lotId: 'shaker', code: 'ROUE-ABC234', endsAt: 'e', playedAt: 'p' },
    })
    expect(adminFetch).toHaveBeenCalledTimes(2)
  })

  it('tirage en cours (moins de 2 min) : occupé', async () => {
    adminFetch.mockResolvedValueOnce(stale).mockResolvedValueOnce(current({ status: 'pending', at: new Date().toISOString() }))
    expect(await claimSpin('gid://shopify/Customer/4')).toEqual({ status: 'busy' })
  })

  it('réservation abandonnée (plus de 2 min) : reprise avec le compareDigest lu', async () => {
    adminFetch
      .mockResolvedValueOnce(stale)
      .mockResolvedValueOnce(current({ status: 'pending', at: new Date(Date.now() - 5 * 60_000).toISOString() }))
      .mockResolvedValueOnce({ metafieldsSet: { userErrors: [] } })
    expect(await claimSpin('gid://shopify/Customer/4')).toEqual({ status: 'claimed' })
    expect(adminFetch.mock.calls[2][1].metafields[0].compareDigest).toBe('abc')
  })
})
