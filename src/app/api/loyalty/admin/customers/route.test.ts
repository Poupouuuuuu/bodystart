import { describe, it, expect, vi, beforeEach } from 'vitest'

const { requireAdmin, adminFetch } = vi.hoisted(() => ({ requireAdmin: vi.fn(), adminFetch: vi.fn() }))
vi.mock('@/lib/loyalty/admin', () => ({ requireAdmin: () => requireAdmin() }))
vi.mock('@/lib/shopify/client', () => ({ shopifyAdminFetch: (...a: unknown[]) => adminFetch(...a) }))

import { GET } from './route'

const call = async (qs: string) => {
  const res = await GET(new Request(`http://x/api/loyalty/admin/customers${qs}`) as never)
  return { status: res.status, json: await res.json() }
}

beforeEach(() => {
  requireAdmin.mockReset().mockResolvedValue({ ok: true })
  adminFetch.mockReset()
})

describe('GET /api/loyalty/admin/customers', () => {
  it('réservé aux admins', async () => {
    requireAdmin.mockResolvedValue({ ok: false, status: 403 })
    expect((await call('?email=julie@exemple.fr')).status).toBe(403)
    expect(adminFetch).not.toHaveBeenCalled()
  })

  it('e-mail invalide : 400 sans appel Shopify', async () => {
    expect((await call('?email=julie')).status).toBe(400)
    expect((await call('?q=julie')).status).toBe(400)
    expect(adminFetch).not.toHaveBeenCalled()
  })

  it('compte trouvé ou absent, recherche PAR e-mail sans relire de donnée personnelle', async () => {
    adminFetch.mockResolvedValueOnce({ customers: { nodes: [{ id: 'gid://shopify/Customer/1' }] } })
    expect((await call('?email=%20Julie@Exemple.fr%20')).json).toEqual({ exists: true })
    const [query, vars] = adminFetch.mock.calls[0]
    expect(vars).toEqual({ q: 'email:"julie@exemple.fr"' })
    expect(query).not.toMatch(/firstName|lastName|displayName|email\s*$|email\s*\}|phone/m)

    adminFetch.mockResolvedValueOnce({ customers: { nodes: [] } })
    expect((await call('?email=inconnu@exemple.fr')).json).toEqual({ exists: false })
  })

  it('erreur Shopify : 502', async () => {
    adminFetch.mockRejectedValueOnce(new Error('Shopify GraphQL: boom'))
    expect((await call('?email=julie@exemple.fr')).status).toBe(502)
  })
})
