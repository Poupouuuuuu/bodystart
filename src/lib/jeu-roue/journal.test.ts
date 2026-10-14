import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { admin } = vi.hoisted(() => ({ admin: vi.fn() }))
vi.mock('@/lib/shopify/client', () => ({ shopifyAdminFetch: (...a: unknown[]) => admin(...a) }))

import { nettoyer, noterErreur, lireJournal, cleMetachamp, copierDansShopify, type EntreeJournal } from './journal'

const entree = (message: string): EntreeJournal => ({ t: '2026-10-14T10:00:00.000Z', etape: 'register', source: 'serveur', niveau: 'erreur', message })

beforeEach(() => {
  admin.mockReset()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('nettoyer', () => {
  it('masque e-mails, numéros de téléphone et identifiants longs', () => {
    const m = nettoyer('Phone +33 6 12 34 56 78 has already been taken (lea.dupont+jeu@exemple.fr) gid://shopify/Customer/10779482947926')
    expect(m).toBe('Phone [numéro] has already been taken ([e-mail]) gid://shopify/Customer/[numéro]')
    expect(nettoyer('tel 0612345678')).toBe('tel [numéro]')
  })
  it('garde les messages utiles et les courts nombres (HTTP 429), tronque à 300 caractères', () => {
    expect(nettoyer('Shopify GraphQL HTTP 429')).toBe('Shopify GraphQL HTTP 429')
    expect(nettoyer('x'.repeat(400))).toHaveLength(300)
  })
})

describe('sans Upstash ni Vercel (tests, dev local)', () => {
  it('écrire ne fait rien et ne lève pas, lire rend une liste vide', async () => {
    vi.stubEnv('VERCEL_ENV', '')
    await expect(noterErreur({ etape: 'register', source: 'serveur', niveau: 'erreur', message: 'x' })).resolves.toBeUndefined()
    await expect(lireJournal()).resolves.toEqual([])
    expect(admin).not.toHaveBeenCalled()
  })
})

describe('copie dans le métachamp boutique', () => {
  it('une clé par environnement, rien hors Vercel', () => {
    expect(cleMetachamp('production')).toBe('jeu_erreurs')
    expect(cleMetachamp('preview')).toBe('jeu_erreurs_preview')
    expect(cleMetachamp('')).toBeNull()
    expect(cleMetachamp(undefined)).toBeNull()
  })

  it('ajoute en tête, garde 50 entrées, écrit un json sur la boutique', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    const avant = Array.from({ length: 50 }, (_, i) => entree(`ancienne ${i}`))
    admin
      .mockResolvedValueOnce({ shop: { id: 'gid://shopify/Shop/1', metafield: { value: JSON.stringify(avant) } } })
      .mockResolvedValueOnce({ metafieldsSet: { userErrors: [] } })
    await copierDansShopify(entree('nouvelle'))
    expect(admin.mock.calls[0][1]).toEqual({ key: 'jeu_erreurs' })
    const [m] = admin.mock.calls[1][1].metafields
    expect(m).toMatchObject({ ownerId: 'gid://shopify/Shop/1', namespace: 'bodystart', key: 'jeu_erreurs', type: 'json' })
    const liste = JSON.parse(m.value) as EntreeJournal[]
    expect(liste).toHaveLength(50)
    expect(liste[0].message).toBe('nouvelle')
    expect(liste[49].message).toBe('ancienne 48')
  })

  it('métachamp absent ou illisible : repart d’une liste vide', async () => {
    vi.stubEnv('VERCEL_ENV', 'preview')
    admin
      .mockResolvedValueOnce({ shop: { id: 'gid://shopify/Shop/1', metafield: { value: 'pas du json' } } })
      .mockResolvedValueOnce({ metafieldsSet: { userErrors: [] } })
    await copierDansShopify(entree('seule'))
    const [m] = admin.mock.calls[1][1].metafields
    expect(m.key).toBe('jeu_erreurs_preview')
    expect(JSON.parse(m.value)).toEqual([entree('seule')])
  })

  it('Shopify en panne : ne lève pas et ne reboucle pas sur le journal', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    admin.mockRejectedValue(new Error('Shopify GraphQL HTTP 503'))
    await expect(copierDansShopify(entree('x'))).resolves.toBeUndefined()
    expect(admin).toHaveBeenCalledTimes(1)
  })

  it('noterErreur copie l’entrée nettoyée, même sans Upstash', async () => {
    vi.stubEnv('VERCEL_ENV', 'production')
    admin
      .mockResolvedValueOnce({ shop: { id: 'gid://shopify/Shop/1', metafield: null } })
      .mockResolvedValueOnce({ metafieldsSet: { userErrors: [] } })
    await noterErreur({ etape: 'spin', source: 'page', niveau: 'erreur', http: 0, message: 'échec pour lea@exemple.fr' })
    const [m] = admin.mock.calls[1][1].metafields
    expect(JSON.parse(m.value)[0]).toMatchObject({ etape: 'spin', source: 'page', http: 0, message: 'échec pour [e-mail]' })
  })
})
