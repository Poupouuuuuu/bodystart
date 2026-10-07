import { describe, it, expect, vi, beforeEach } from 'vitest'

const adminFetch = vi.fn()
vi.mock('@/lib/shopify/client', () => ({ shopifyAdminFetch: (...a: unknown[]) => adminFetch(...a) }))

import {
  discountInput,
  readResult,
  lotsAvailability,
  upsertCustomer,
  createLotDiscount,
  markParticipant,
  type ShopCustomer,
} from './shopify'
import { LOTS, lotById } from './lots'

const entry = { firstName: 'Léa', lastName: 'Dupont', email: 'lea@exemple.fr', phone: '+33612345678', optIn: true }

beforeEach(() => {
  adminFetch.mockReset()
})

describe('discountInput', () => {
  const start = new Date('2026-10-07T10:00:00Z')
  const end = new Date('2026-11-06T10:00:00Z')

  it('article offert : montant fixe une seule fois, limité aux cibles, 1 utilisation', () => {
    const input = discountInput(lotById('crunch-bar')!, 'ROUE-ABC234', 2.9, start, end)
    expect(input).toMatchObject({
      title: 'Jeu roue : Une barre Crunch Bar : ROUE-ABC234',
      code: 'ROUE-ABC234',
      startsAt: '2026-10-07T10:00:00.000Z',
      endsAt: '2026-11-06T10:00:00.000Z',
      context: { all: 'ALL' },
      usageLimit: 1,
      appliesOncePerCustomer: false,
      combinesWith: { productDiscounts: false, orderDiscounts: true, shippingDiscounts: true },
      customerGets: {
        value: { discountAmount: { amount: '2.90', appliesOnEachItem: false } },
        items: { products: { productsToAdd: [], productVariantsToAdd: lotById('crunch-bar')!.variants } },
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
        { __typename: 'ProductVariant', id: 'gid://shopify/ProductVariant/54097477534038', price: '2.90', inventoryItem: level(7) },
        { __typename: 'Product', id: 'gid://shopify/Product/11139051290966', variants: { nodes: [{ id: 'c', price: '6.90', inventoryItem: level(53) }] } },
        { __typename: 'ProductVariant', id: 'gid://shopify/ProductVariant/53981935206742', price: '36.90', inventoryItem: { inventoryLevel: null } },
        { __typename: 'ProductVariant', id: 'gid://shopify/ProductVariant/54095546483030', price: '44.90', inventoryItem: level(6) },
        { __typename: 'ProductVariant', id: 'gid://shopify/ProductVariant/54095546515798', price: '46.90', inventoryItem: level(0) },
      ],
    })
    const { available, prices } = await lotsAvailability()
    expect([...available].sort()).toEqual(['bon-5', 'crunch-bar', 'shaker', 'whey'])
    expect(prices.get('whey')).toBe(46.9)
    expect(prices.get('crunch-bar')).toBe(2.9)
    expect(adminFetch.mock.calls[0][1].loc).toBe('gid://shopify/Location/119350657366')
    expect(adminFetch.mock.calls[0][2]).toEqual({ apiVersion: '2026-04' })
  })
})

describe('upsertCustomer', () => {
  it('nouveau client : téléphone déjà pris ailleurs → recréé sans téléphone ni accord SMS', async () => {
    adminFetch
      .mockResolvedValueOnce({ customerByIdentifier: null })
      .mockResolvedValueOnce({ customerCreate: { customer: null, userErrors: [{ field: ['phone'], message: 'Phone has already been taken' }] } })
      .mockResolvedValueOnce({ customerCreate: { customer: { id: 'gid://shopify/Customer/1' }, userErrors: [] } })
    expect(await upsertCustomer(entry)).toBe('gid://shopify/Customer/1')
    const first = adminFetch.mock.calls[1][1].input
    const second = adminFetch.mock.calls[2][1].input
    expect(first).toMatchObject({ phone: '+33612345678', smsMarketingConsent: { marketingState: 'SUBSCRIBED' } })
    expect(second).not.toHaveProperty('phone')
    expect(second).not.toHaveProperty('smsMarketingConsent')
    expect(second.emailMarketingConsent).toMatchObject({ marketingState: 'SUBSCRIBED', marketingOptInLevel: 'SINGLE_OPT_IN' })
  })

  it('case décochée : aucun accord marketing envoyé', async () => {
    adminFetch
      .mockResolvedValueOnce({ customerByIdentifier: null })
      .mockResolvedValueOnce({ customerCreate: { customer: { id: 'gid://shopify/Customer/2' }, userErrors: [] } })
    await upsertCustomer({ ...entry, optIn: false })
    const input = adminFetch.mock.calls[1][1].input
    expect(input).not.toHaveProperty('emailMarketingConsent')
    expect(input).not.toHaveProperty('smsMarketingConsent')
  })

  it('client existant : mise à jour puis accords e-mail et SMS', async () => {
    adminFetch
      .mockResolvedValueOnce({ customerByIdentifier: { id: 'gid://shopify/Customer/3', defaultPhoneNumber: null, tags: [], note: null, jeuRoue: null } })
      .mockResolvedValueOnce({ customerUpdate: { userErrors: [] } })
      .mockResolvedValueOnce({ customerEmailMarketingConsentUpdate: { userErrors: [] } })
      .mockResolvedValueOnce({ customerSmsMarketingConsentUpdate: { userErrors: [] } })
    expect(await upsertCustomer(entry)).toBe('gid://shopify/Customer/3')
    expect(adminFetch.mock.calls[1][1].input).toMatchObject({ id: 'gid://shopify/Customer/3', firstName: 'Léa', phone: '+33612345678' })
    expect(adminFetch).toHaveBeenCalledTimes(4)
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
  it('étiquettes, note ajoutée à la suite, résultat en métachamp', async () => {
    adminFetch
      .mockResolvedValueOnce({ tagsAdd: { userErrors: [] } })
      .mockResolvedValueOnce({ customerUpdate: { userErrors: [] } })
      .mockResolvedValueOnce({ metafieldsSet: { userErrors: [] } })
    const customer: ShopCustomer = { id: 'gid://shopify/Customer/4', defaultEmailAddress: null, defaultPhoneNumber: null, tags: [], note: 'Client fidèle', jeuRoue: null }
    const result = { lotId: 'shaker' as const, code: 'ROUE-ABC234', endsAt: '2026-11-06T10:00:00Z', playedAt: '2026-10-07T10:00:00Z' }
    await markParticipant(customer, lotById('shaker')!, result)
    expect(adminFetch.mock.calls[0][1].tags).toEqual(['jeu-roue', 'jeu-roue-shaker'])
    expect(adminFetch.mock.calls[1][1].input.note).toBe('Client fidèle\nJeu roue 07/10/2026 : Un shaker, code ROUE-ABC234')
    expect(JSON.parse(adminFetch.mock.calls[2][1].metafields[0].value)).toEqual(result)
  })
})
