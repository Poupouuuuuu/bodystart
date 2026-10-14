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

const entry = { firstName: 'Léa', lastName: 'Dupont', email: 'lea@exemple.fr', phone: '+33612345678', optInSms: true, optInEmail: true }

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
      title: 'Jeu roue : Une barre Crunch Bar (parfum au choix) : ROUE-ABC234',
      code: 'ROUE-ABC234',
      startsAt: '2026-10-07T10:00:00.000Z',
      endsAt: '2026-11-06T10:00:00.000Z',
      context: { all: 'ALL' },
      usageLimit: 1,
      appliesOncePerCustomer: false,
      combinesWith: { productDiscounts: true, orderDiscounts: true, shippingDiscounts: true },
      customerGets: {
        value: { discountAmount: { amount: '2.90', appliesOnEachItem: false } },
        items: { products: { productsToAdd: ['gid://shopify/Product/10832196010326'], productVariantsToAdd: [] } },
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
  const mutations = () => adminFetch.mock.calls.map((c) => (c[0] as string).match(/\{\s*(\w+)\(/)?.[1])

  it('nouveau client, les 4 combinaisons : un accord par case cochée, rien sinon', async () => {
    for (const [optInSms, optInEmail] of [[false, false], [true, false], [false, true], [true, true]]) {
      adminFetch.mockReset()
      adminFetch
        .mockResolvedValueOnce({ customerByIdentifier: null })
        .mockResolvedValueOnce({ customerCreate: { customer: { id: 'gid://shopify/Customer/2' }, userErrors: [] } })
      await upsertCustomer({ ...entry, optInSms, optInEmail })
      const input = adminFetch.mock.calls[1][1].input
      expect(input.phone).toBe('+33612345678')
      if (optInSms) expect(input.smsMarketingConsent).toMatchObject(SUBSCRIBED)
      else expect(input).not.toHaveProperty('smsMarketingConsent')
      if (optInEmail) expect(input.emailMarketingConsent).toMatchObject(SUBSCRIBED)
      else expect(input).not.toHaveProperty('emailMarketingConsent')
      expect(adminFetch).toHaveBeenCalledTimes(2)
    }
    expect(noterErreur).not.toHaveBeenCalled()
  })

  it('client existant, les 4 combinaisons : mise à jour, puis seulement les accords cochés', async () => {
    const attendu: Record<string, string[]> = {
      'false,false': ['customerByIdentifier', 'customerUpdate'],
      'true,false': ['customerByIdentifier', 'customerUpdate', 'customerSmsMarketingConsentUpdate'],
      'false,true': ['customerByIdentifier', 'customerUpdate', 'customerEmailMarketingConsentUpdate'],
      'true,true': ['customerByIdentifier', 'customerUpdate', 'customerEmailMarketingConsentUpdate', 'customerSmsMarketingConsentUpdate'],
    }
    for (const [cle, appels] of Object.entries(attendu)) {
      const [optInSms, optInEmail] = cle.split(',').map((v) => v === 'true')
      adminFetch.mockReset()
      adminFetch.mockImplementation(async (q: string) =>
        q.includes('customerByIdentifier')
          ? existante
          : { customerUpdate: { userErrors: [] }, customerEmailMarketingConsentUpdate: { userErrors: [] }, customerSmsMarketingConsentUpdate: { userErrors: [] } }
      )
      expect(await upsertCustomer({ ...entry, optInSms, optInEmail })).toBe('gid://shopify/Customer/3')
      expect(mutations()).toEqual(appels)
      expect(adminFetch.mock.calls[1][1].input).toMatchObject({ id: 'gid://shopify/Customer/3', firstName: 'Léa', phone: '+33612345678' })
    }
  })

  it('fiche déjà abonnée, aucune case cochée : aucun accord touché, jamais de désabonnement', async () => {
    adminFetch.mockResolvedValueOnce(existante).mockResolvedValueOnce({ customerUpdate: { userErrors: [] } })
    await upsertCustomer({ ...entry, optInSms: false, optInEmail: false })
    expect(adminFetch).toHaveBeenCalledTimes(2)
    const tout = JSON.stringify(adminFetch.mock.calls)
    expect(tout).not.toMatch(/MarketingConsent|UNSUBSCRIBED|NOT_SUBSCRIBED/)
  })

  it('nouveau client, téléphone déjà pris ailleurs, case SMS cochée : recréé sans téléphone ni accord SMS, noté au journal', async () => {
    adminFetch
      .mockResolvedValueOnce({ customerByIdentifier: null })
      .mockResolvedValueOnce({ customerCreate: { customer: null, userErrors: [{ field: ['phone'], message: 'Phone has already been taken' }] } })
      .mockResolvedValueOnce({ customerCreate: { customer: { id: 'gid://shopify/Customer/1' }, userErrors: [] } })
    expect(await upsertCustomer(entry)).toBe('gid://shopify/Customer/1')
    const first = adminFetch.mock.calls[1][1].input
    const second = adminFetch.mock.calls[2][1].input
    expect(first).toMatchObject({ phone: '+33612345678', smsMarketingConsent: SUBSCRIBED })
    expect(second).not.toHaveProperty('phone')
    expect(second).not.toHaveProperty('smsMarketingConsent')
    expect(second.emailMarketingConsent).toMatchObject(SUBSCRIBED)
    expect(noterErreur).toHaveBeenCalledTimes(1)
    expect(noterErreur.mock.calls[0][0]).toMatchObject({ etape: 'register', niveau: 'avertissement', message: expect.stringContaining('accord SMS non enregistré') })
    expect(JSON.stringify(noterErreur.mock.calls)).not.toMatch(/33612345678|lea@exemple/)
  })

  it('téléphone déjà pris, case SMS non cochée : rien au journal', async () => {
    adminFetch
      .mockResolvedValueOnce({ customerByIdentifier: null })
      .mockResolvedValueOnce({ customerCreate: { customer: null, userErrors: [{ field: ['phone'], message: 'Phone has already been taken' }] } })
      .mockResolvedValueOnce({ customerCreate: { customer: { id: 'gid://shopify/Customer/1' }, userErrors: [] } })
    await upsertCustomer({ ...entry, optInSms: false })
    expect(noterErreur).not.toHaveBeenCalled()
  })

  it('client existant, téléphone pris ailleurs, case SMS cochée : mis à jour sans téléphone, accord e-mail seul, noté au journal', async () => {
    adminFetch
      .mockResolvedValueOnce(existante)
      .mockResolvedValueOnce({ customerUpdate: { userErrors: [{ field: ['phone'], message: 'Phone has already been taken' }] } })
      .mockResolvedValueOnce({ customerUpdate: { userErrors: [] } })
      .mockResolvedValueOnce({ customerEmailMarketingConsentUpdate: { userErrors: [] } })
    expect(await upsertCustomer(entry)).toBe('gid://shopify/Customer/3')
    expect(adminFetch.mock.calls[2][1].input).not.toHaveProperty('phone')
    expect(mutations()).toEqual(['customerByIdentifier', 'customerUpdate', 'customerUpdate', 'customerEmailMarketingConsentUpdate'])
    expect(noterErreur).toHaveBeenCalledTimes(1)
    expect(noterErreur.mock.calls[0][0].message).toContain('accord SMS non enregistré')
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

  it('une étiquette par case cochée', async () => {
    const cas: [{ sms: boolean; email: boolean }, string[]][] = [
      [{ sms: true, email: false }, ['jeu-roue-optin-sms']],
      [{ sms: false, email: true }, ['jeu-roue-optin-email']],
      [{ sms: true, email: true }, ['jeu-roue-optin-sms', 'jeu-roue-optin-email']],
    ]
    for (const [accords, enPlus] of cas) {
      adminFetch.mockReset()
      adminFetch
        .mockResolvedValueOnce({ metafieldsSet: { userErrors: [] } })
        .mockResolvedValueOnce({ tagsAdd: { userErrors: [] } })
        .mockResolvedValueOnce({ customer: { note: null } })
        .mockResolvedValueOnce({ customerUpdate: { userErrors: [] } })
      await markParticipant(customer, lotById('shaker')!, result, accords)
      expect(adminFetch.mock.calls[1][1].tags).toEqual(['jeu-roue', 'jeu-roue-shaker', ...enPlus])
    }
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
