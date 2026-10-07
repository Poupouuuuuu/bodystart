import { describe, it, expect, vi, beforeEach } from 'vitest'

const { shop, store } = vi.hoisted(() => ({
  shop: {
    findParticipant: vi.fn(),
    getCustomerByEmail: vi.fn(),
    upsertCustomer: vi.fn(),
    lotsAvailability: vi.fn(),
    createLotDiscount: vi.fn(),
    markParticipant: vi.fn(),
  },
  store: {
    getStoredResult: vi.fn(),
    storeResult: vi.fn(),
    acquireLock: vi.fn(),
    releaseLock: vi.fn(),
    allowRequest: vi.fn(),
  },
}))
vi.mock('@/lib/jeu-roue/shopify', async (orig) => {
  const real = await orig<typeof import('@/lib/jeu-roue/shopify')>()
  return { ...real, ...Object.fromEntries(Object.keys(shop).map((k) => [k, (...a: unknown[]) => shop[k as keyof typeof shop](...a)])) }
})
vi.mock('@/lib/jeu-roue/store', () =>
  Object.fromEntries(Object.keys(store).map((k) => [k, (...a: unknown[]) => store[k as keyof typeof store](...a)]))
)

import { POST } from './route'

const form = { firstName: 'Léa', lastName: 'Dupont', email: 'Lea@Exemple.fr', phone: '06 12 34 56 78', optIn: true }
const call = async (body: Record<string, unknown>) => {
  const res = await POST(new Request('http://x/api/jeu', { method: 'POST', body: JSON.stringify(body) }) as never)
  return { status: res.status, json: await res.json() }
}
const customer = (tags: string[] = []) => ({ id: 'gid://shopify/Customer/7', tags, jeuRoue: null })

beforeEach(() => {
  for (const f of [...Object.values(shop), ...Object.values(store)]) f.mockReset()
  store.allowRequest.mockResolvedValue(true)
  store.getStoredResult.mockResolvedValue(null)
  store.acquireLock.mockResolvedValue(true)
  store.releaseLock.mockResolvedValue(undefined)
  shop.findParticipant.mockResolvedValue(null)
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

  it('register : nouveau joueur → fiche créée, prêt à tourner', async () => {
    shop.upsertCustomer.mockResolvedValue('gid://shopify/Customer/7')
    const r = await call({ ...form, action: 'register' })
    expect(r.json).toEqual({ status: 'ready', customerId: 'gid://shopify/Customer/7' })
    expect(shop.upsertCustomer.mock.calls[0][0]).toMatchObject({ email: 'lea@exemple.fr', phone: '+33612345678', optIn: true })
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
    // Résultat gardé AVANT le marquage Shopify
    expect(store.storeResult.mock.invocationCallOrder[0]).toBeLessThan(shop.markParticipant.mock.invocationCallOrder[0])
    expect(store.releaseLock).toHaveBeenCalled()
  })

  it('spin : fiche déjà marquée jeu-roue → pas de second tirage', async () => {
    shop.getCustomerByEmail.mockResolvedValue(customer(['jeu-roue']))
    const r = await call({ ...form, action: 'spin', customerId: 'gid://shopify/Customer/7' })
    expect(r.json.status).toBe('played')
    expect(shop.createLotDiscount).not.toHaveBeenCalled()
  })

  it('spin : double clic (verrou pris) → 409', async () => {
    shop.getCustomerByEmail.mockResolvedValue(customer())
    store.acquireLock.mockResolvedValue(false)
    expect((await call({ ...form, action: 'spin', customerId: 'gid://shopify/Customer/7' })).status).toBe(409)
  })
})
