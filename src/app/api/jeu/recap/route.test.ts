import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { send, loadRecapData } = vi.hoisted(() => ({ send: vi.fn(), loadRecapData: vi.fn() }))
vi.mock('resend', () => ({ Resend: vi.fn(() => ({ emails: { send } })) }))
vi.mock('@/lib/jeu-roue/recap', async (orig) => ({
  ...(await orig<typeof import('@/lib/jeu-roue/recap')>()),
  loadRecapData: () => loadRecapData(),
}))

import { GET } from './route'

const SECRET = 'un-secret-de-test-assez-long-0123456789'
const call = (auth?: string) =>
  GET(new Request('http://x/api/jeu/recap', { headers: auth ? { authorization: auth } : {} }))

beforeEach(() => {
  vi.stubEnv('CRON_SECRET', SECRET)
  send.mockReset().mockResolvedValue({ data: { id: 'm1' }, error: null })
  loadRecapData.mockReset().mockResolvedValue({ codes: [], participants: [], uses: [], stock: new Map() })
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => vi.unstubAllEnvs())

describe('GET /api/jeu/recap', () => {
  it('sans le secret du cron : 401, rien n’est lu ni envoyé', async () => {
    expect((await call()).status).toBe(401)
    expect((await call('Bearer mauvais')).status).toBe(401)
    expect(loadRecapData).not.toHaveBeenCalled()
    expect(send).not.toHaveBeenCalled()
  })

  it('cron : récap envoyé à l’adresse de contact', async () => {
    const res = await call(`Bearer ${SECRET}`)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, plays: 0, used: 0, total: 0 })
    expect(send).toHaveBeenCalledTimes(1)
    const mail = send.mock.calls[0][0]
    expect(mail.to).toBe('contact@bodystart-nutrition.fr')
    expect(mail.subject).toMatch(/^Jeu de la roue : 0 participation du /)
    expect(mail.html).toContain('Depuis le lancement')
  })

  it('Shopify en échec : 502, pas d’e-mail', async () => {
    loadRecapData.mockRejectedValue(new Error('Shopify GraphQL: boom'))
    expect((await call(`Bearer ${SECRET}`)).status).toBe(502)
    expect(send).not.toHaveBeenCalled()
  })

  it('Resend en échec : 500 (Vercel le journalise)', async () => {
    send.mockResolvedValue({ data: null, error: { message: 'domain not verified' } })
    expect((await call(`Bearer ${SECRET}`)).status).toBe(500)
  })
})
