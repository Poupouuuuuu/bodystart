import { describe, it, expect, vi, beforeEach } from 'vitest'

const { shop, store, journal } = vi.hoisted(() => ({
  journal: { noterErreur: vi.fn() },
  shop: {
    findParticipant: vi.fn(),
    getCustomerByEmail: vi.fn(),
    upsertCustomer: vi.fn(),
    lotsAvailability: vi.fn(),
    createLotDiscount: vi.fn(),
    markParticipant: vi.fn(),
    claimSpin: vi.fn(),
    releaseSpin: vi.fn(),
  },
  store: {
    getStoredResult: vi.fn(),
    storeResult: vi.fn(),
    allowRequest: vi.fn(),
  },
}))
vi.mock('@/lib/jeu-roue/shopify', async (orig) => {
  const real = await orig<typeof import('@/lib/jeu-roue/shopify')>()
  return { ...real, ...Object.fromEntries(Object.keys(shop).map((k) => [k, (...a: unknown[]) => shop[k as keyof typeof shop](...a)])) }
})
vi.mock('@/lib/jeu-roue/journal', () => ({ noterErreur: (...a: unknown[]) => journal.noterErreur(...a) }))
vi.mock('@/lib/jeu-roue/store', () =>
  Object.fromEntries(Object.keys(store).map((k) => [k, (...a: unknown[]) => store[k as keyof typeof store](...a)]))
)

import { POST } from './route'

const form = { firstName: 'Léa', lastName: 'Dupont', email: 'Lea@Exemple.fr', phone: '06 12 34 56 78', optInSms: true, optInEmail: false }
const call = async (body: Record<string, unknown>) => {
  const res = await POST(new Request('http://x/api/jeu', { method: 'POST', body: JSON.stringify(body) }) as never)
  const texte = await res.text()
  return { status: res.status, json: texte ? JSON.parse(texte) : null }
}
const customer = (tags: string[] = []) => ({ id: 'gid://shopify/Customer/7', tags, jeuRoue: null })

beforeEach(() => {
  for (const f of [...Object.values(shop), ...Object.values(store), ...Object.values(journal)]) f.mockReset()
  journal.noterErreur.mockResolvedValue(undefined)
  store.allowRequest.mockResolvedValue(true)
  store.getStoredResult.mockResolvedValue(null)
  store.storeResult.mockResolvedValue(undefined)
  shop.findParticipant.mockResolvedValue(null)
  shop.claimSpin.mockResolvedValue({ status: 'claimed' })
  shop.releaseSpin.mockResolvedValue(undefined)
})

describe('POST /api/jeu', () => {
  it('champ invalide : 400 avec le champ en cause', async () => {
    const r = await call({ ...form, action: 'register', phone: '01 30 00 00 00' })
    expect(r.status).toBe(400)
    expect(r.json.field).toBe('phone')
  })

  it('register : déjà joué (Redis) → réaffiche le lot sans toucher à Shopify', async () => {
    store.getStoredResult.mockResolvedValue({ lotId: 'shaker', code: 'ROUE-ABC234', endsAt: 'e', playedAt: 'p' })
    const r = await call({ ...form, action: 'register' })
    expect(r.json).toEqual({ status: 'played', result: { lotId: 'shaker', label: 'Un shaker', code: 'ROUE-ABC234', endsAt: 'e' } })
    expect(shop.upsertCustomer).not.toHaveBeenCalled()
  })

  it('Crunch Bar (tous parfums) : libellé « parfum au choix », pas de ligne de parfums', async () => {
    store.getStoredResult.mockResolvedValue({ lotId: 'crunch-bar', code: 'ROUE-CCC333', endsAt: 'e', playedAt: 'p' })
    const r = await call({ ...form, action: 'register' })
    expect(r.json.result).toEqual({
      lotId: 'crunch-bar',
      label: 'Une barre Crunch Bar (parfum au choix)',
      code: 'ROUE-CCC333',
      endsAt: 'e',
    })
  })

  it('register : nouveau joueur → fiche créée, prêt à tourner', async () => {
    shop.upsertCustomer.mockResolvedValue('gid://shopify/Customer/7')
    const r = await call({ ...form, action: 'register' })
    expect(r.json).toEqual({ status: 'ready', customerId: 'gid://shopify/Customer/7' })
    expect(shop.upsertCustomer.mock.calls[0][0]).toMatchObject({ email: 'lea@exemple.fr', phone: '+33612345678', optInSms: true, optInEmail: false })
  })

  it('spin : refusé si la fiche de cet e-mail n’est pas celle de l’étape register', async () => {
    shop.getCustomerByEmail.mockResolvedValue({ ...customer(), id: 'gid://shopify/Customer/8' })
    const r = await call({ ...form, action: 'spin', customerId: 'gid://shopify/Customer/7' })
    expect(r.status).toBe(400)
    expect(shop.createLotDiscount).not.toHaveBeenCalled()
  })

  it('spin : tirage, code créé, résultat gardé puis fiche marquée', async () => {
    shop.getCustomerByEmail.mockResolvedValue(customer())
    shop.lotsAvailability.mockResolvedValue({ available: new Set(['bon-5']), prices: new Map() })
    shop.createLotDiscount.mockResolvedValue({ code: 'ROUE-XYZ789', endsAt: '2026-11-06T10:00:00.000Z' })
    const r = await call({ ...form, action: 'spin', customerId: 'gid://shopify/Customer/7' })
    expect(r.json).toEqual({
      status: 'won',
      result: { lotId: 'bon-5', label: '5 € dès 30 € d’achat', code: 'ROUE-XYZ789', endsAt: '2026-11-06T10:00:00.000Z' },
    })
    expect(shop.createLotDiscount.mock.calls[0][1]).toBe(5)
    // Cases cochées transmises au marquage (une étiquette par case)
    expect(shop.markParticipant.mock.calls[0][3]).toEqual({ sms: true, email: false })
    // Résultat gardé AVANT le marquage Shopify
    expect(store.storeResult.mock.invocationCallOrder[0]).toBeLessThan(shop.markParticipant.mock.invocationCallOrder[0])
    expect(shop.claimSpin.mock.invocationCallOrder[0]).toBeLessThan(shop.createLotDiscount.mock.invocationCallOrder[0])
    expect(shop.releaseSpin).not.toHaveBeenCalled()
  })

  it('spin : création du code en échec → réservation libérée, 503', async () => {
    shop.getCustomerByEmail.mockResolvedValue(customer())
    shop.lotsAvailability.mockResolvedValue({ available: new Set(['bon-5']), prices: new Map() })
    shop.createLotDiscount.mockRejectedValue(new Error('Shopify GraphQL: boom'))
    const r = await call({ ...form, action: 'spin', customerId: 'gid://shopify/Customer/7' })
    expect(r.status).toBe(503)
    expect(shop.releaseSpin).toHaveBeenCalledWith('gid://shopify/Customer/7')
    expect(shop.markParticipant).not.toHaveBeenCalled()
  })

  it('spin : réservation déjà finalisée par une requête parallèle → même lot réaffiché', async () => {
    shop.getCustomerByEmail.mockResolvedValue(customer())
    shop.claimSpin.mockResolvedValue({ status: 'played', result: { lotId: 'whey', code: 'ROUE-WWW222', endsAt: 'e', playedAt: 'p' } })
    const r = await call({ ...form, action: 'spin', customerId: 'gid://shopify/Customer/7' })
    expect(r.json).toEqual({
      status: 'played',
      result: {
        lotId: 'whey',
        label: 'Une whey Protimuscle 1 kg',
        parfums: 'Chocolat, Vanille, Choco-cookie ou Fraise',
        code: 'ROUE-WWW222',
        endsAt: 'e',
      },
    })
    expect(shop.createLotDiscount).not.toHaveBeenCalled()
  })

  it('spin : fiche déjà marquée jeu-roue → pas de second tirage', async () => {
    shop.getCustomerByEmail.mockResolvedValue(customer(['jeu-roue']))
    const r = await call({ ...form, action: 'spin', customerId: 'gid://shopify/Customer/7' })
    expect(r.json.status).toBe('played')
    expect(shop.createLotDiscount).not.toHaveBeenCalled()
  })

  it('spin : double envoi (réservation prise) → 409', async () => {
    shop.getCustomerByEmail.mockResolvedValue(customer())
    shop.claimSpin.mockResolvedValue({ status: 'busy' })
    expect((await call({ ...form, action: 'spin', customerId: 'gid://shopify/Customer/7' })).status).toBe(409)
  })

  it('erreur attrapée : 503 lisible et entrée au journal (étape, source serveur)', async () => {
    shop.getCustomerByEmail.mockResolvedValue(customer())
    shop.lotsAvailability.mockRejectedValue(new Error('Shopify GraphQL HTTP 429'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const r = await call({ ...form, action: 'spin', customerId: 'gid://shopify/Customer/7' })
    expect(r.status).toBe(503)
    expect(r.json.error).toMatch(/boutique/)
    expect(journal.noterErreur).toHaveBeenCalledWith({ etape: 'spin', source: 'serveur', niveau: 'erreur', http: 503, message: 'Shopify GraphQL HTTP 429' })
  })

  it('signal de la page : 204, entrée au journal, sans toucher à Shopify ni au formulaire', async () => {
    const r = await call({ action: 'signal', etape: 'register', type: 'reponse', http: 504, extrait: 'FUNCTION_INVOCATION_TIMEOUT' })
    expect(r.status).toBe(204)
    expect(journal.noterErreur).toHaveBeenCalledWith({
      etape: 'register', source: 'page', niveau: 'erreur', http: 504, message: 'réponse illisible : FUNCTION_INVOCATION_TIMEOUT',
    })
    expect(store.allowRequest).toHaveBeenCalledWith(expect.any(String), 'signal')
    expect(shop.findParticipant).not.toHaveBeenCalled()
    expect(shop.upsertCustomer).not.toHaveBeenCalled()
  })

  it('signal réseau : message fixe ; signal invalide : 400 sans écriture', async () => {
    await call({ action: 'signal', etape: 'spin', type: 'reseau', http: 0, extrait: '' })
    expect(journal.noterErreur).toHaveBeenCalledWith(expect.objectContaining({ etape: 'spin', http: 0, message: 'requête sans réponse (réseau)' }))
    journal.noterErreur.mockClear()
    expect((await call({ action: 'signal', etape: 'autre', type: 'reseau', http: 0 })).status).toBe(400)
    expect((await call({ action: 'signal', etape: 'spin', type: 'reseau', http: 'x' })).status).toBe(400)
    expect(journal.noterErreur).not.toHaveBeenCalled()
  })

  it('signal au-delà de la limite par IP : ignoré (204), rien d’écrit', async () => {
    store.allowRequest.mockResolvedValue(false)
    expect((await call({ action: 'signal', etape: 'register', type: 'reseau', http: 0 })).status).toBe(204)
    expect(journal.noterErreur).not.toHaveBeenCalled()
  })
})
