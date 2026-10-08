// @vitest-environment jsdom
/**
 * Rendu (jsdom) du panneau admin. Forfait Shopify Basic : pas de recherche
 * par nom (données clients illisibles), l'e-mail est saisi à la main et on
 * vérifie seulement qu'un compte client existe avec cet e-mail.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))

import { AdminAmbassadorsPanel } from './AdminAmbassadorsPanel'

function mockFetch(customersOk: boolean, exists = true) {
  return vi.fn(async (url: string) => {
    const u = String(url)
    if (u.includes('/admin/customers')) {
      return customersOk
        ? ({ ok: true, json: async () => ({ exists }) } as Response)
        : ({ ok: false, status: 502, json: async () => ({ error: 'search_failed' }) } as unknown as Response)
    }
    // liste ambassadeurs
    return { ok: true, json: async () => ({ ambassadors: [] }) } as Response
  })
}

const SAMPLE_AMB = {
  id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
  name: 'Julie Coaching', email: 'julie@email.com', code: 'COACHJULIE',
  ratePct: 10, balanceCents: 3500, active: true, ordersCount: 2, revenueCents: 12000,
}
function mockFetchWithAmb() {
  return vi.fn(async (url: string) => {
    const u = String(url)
    if (u.includes('/admin/customers')) {
      return { ok: false, status: 502, json: async () => ({ error: 'search_failed' }) } as unknown as Response
    }
    if (u.includes('/transactions')) {
      return { ok: true, json: async () => ({ transactions: [] }) } as Response
    }
    return { ok: true, json: async () => ({ ambassadors: [SAMPLE_AMB] }) } as Response
  })
}

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

describe('AdminAmbassadorsPanel — e-mail du compte client', () => {
  it('champ e-mail présent, plus de recherche par nom, aucun appel tant que l’e-mail est incomplet', async () => {
    const f = mockFetch(true)
    vi.stubGlobal('fetch', f)
    render(<AdminAmbassadorsPanel />)
    expect(await screen.findByPlaceholderText('julie@email.com')).toBeTruthy()
    expect(screen.queryByPlaceholderText('Tape un nom ou un email…')).toBeNull()
    expect(screen.getByText(/exact/)).toBeTruthy()
    expect(f.mock.calls.some(([u]) => String(u).includes('/admin/customers'))).toBe(false)
  })

  it('e-mail complet → vérification : compte trouvé', async () => {
    const f = mockFetch(true, true)
    vi.stubGlobal('fetch', f)
    render(<AdminAmbassadorsPanel />)
    fireEvent.change(await screen.findByPlaceholderText('julie@email.com'), { target: { value: 'Julie@Email.com' } })
    expect(await screen.findByText('Compte client trouvé', {}, { timeout: 2000 })).toBeTruthy()
    expect(f.mock.calls.some(([u]) => String(u).includes('/admin/customers?email=julie%40email.com'))).toBe(true)
  })

  it('e-mail sans compte → avertissement, création toujours possible', async () => {
    vi.stubGlobal('fetch', mockFetch(true, false))
    render(<AdminAmbassadorsPanel />)
    fireEvent.change(await screen.findByPlaceholderText('julie@email.com'), { target: { value: 'nouveau@email.com' } })
    expect(await screen.findByText(/Aucun compte client avec cet e-mail/, {}, { timeout: 2000 })).toBeTruthy()
  })

  it('vérification en échec → message neutre', async () => {
    vi.stubGlobal('fetch', mockFetch(false))
    render(<AdminAmbassadorsPanel />)
    fireEvent.change(await screen.findByPlaceholderText('julie@email.com'), { target: { value: 'julie@email.com' } })
    expect(await screen.findByText(/Vérification indisponible/, {}, { timeout: 2000 })).toBeTruthy()
  })

  it('mode « Entrée de suivi » → champ code présent', async () => {
    vi.stubGlobal('fetch', mockFetch(false))
    render(<AdminAmbassadorsPanel />)
    await screen.findByPlaceholderText('julie@email.com')
    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByPlaceholderText('BODYSTART15')).toBeTruthy()
  })
})

describe('AdminAmbassadorsPanel — ajustement manuel de cagnotte', () => {
  it('bouton « Ajuster » ouvre le panneau (montant + motif + aperçu plancher 0)', async () => {
    vi.stubGlobal('fetch', mockFetchWithAmb())
    render(<AdminAmbassadorsPanel />)
    // l'ambassadeur est listé
    const btn = await screen.findByRole('button', { name: /Ajuster/i })
    fireEvent.click(btn)
    // champs présents
    const amount = screen.getByPlaceholderText('20,00') as HTMLInputElement
    const reason = screen.getByPlaceholderText(/Dépense 20/i)
    expect(amount).toBeTruthy()
    expect(reason).toBeTruthy()
    // déduction 50 € sur 35 € → aperçu plancher 0 : déduction plafonnée au solde
    fireEvent.change(amount, { target: { value: '50' } })
    expect(screen.getByText(/plafonné au solde/i)).toBeTruthy()
  })
})
