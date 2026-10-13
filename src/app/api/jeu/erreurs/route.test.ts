import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { lireJournal } = vi.hoisted(() => ({ lireJournal: vi.fn() }))
vi.mock('@/lib/jeu-roue/journal', async (orig) => ({
  ...(await orig<typeof import('@/lib/jeu-roue/journal')>()),
  lireJournal: () => lireJournal(),
}))

import { GET } from './route'

const SECRET = 'un-secret-de-test-assez-long-0123456789'
const call = (auth?: string) => GET(new Request('http://x/api/jeu/erreurs', { headers: auth ? { authorization: auth } : {} }))
const entree = { t: '2026-10-13T14:03:00.000Z', etape: 'register', source: 'page', niveau: 'erreur', http: 0, message: 'requête sans réponse (réseau)' }

beforeEach(() => {
  vi.stubEnv('CRON_SECRET', SECRET)
  lireJournal.mockReset().mockResolvedValue([entree])
})
afterEach(() => vi.unstubAllEnvs())

describe('GET /api/jeu/erreurs', () => {
  it('sans le secret : 401, journal non lu', async () => {
    expect((await call()).status).toBe(401)
    expect((await call('Bearer mauvais')).status).toBe(401)
    expect(lireJournal).not.toHaveBeenCalled()
  })
  it('avec le secret : les dernières erreurs, jamais en cache', async () => {
    const res = await call(`Bearer ${SECRET}`)
    expect(res.status).toBe(200)
    expect(res.headers.get('cache-control')).toBe('no-store')
    expect(await res.json()).toEqual({ max: 50, erreurs: [entree] })
  })
  it('sans CRON_SECRET configuré : refus (fail closed)', async () => {
    vi.stubEnv('CRON_SECRET', '')
    expect((await call(`Bearer ${SECRET}`)).status).toBe(401)
  })
})
