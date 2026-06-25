// @vitest-environment jsdom
/**
 * Rendu (jsdom) du panneau admin — garantit le REPLI : quand la recherche
 * clients est indisponible (forfait Basic → /admin/customers 502), un CHAMP
 * EMAIL MANUEL doit rester présent pour que la création fonctionne toujours.
 * (Régression du bug : aucun champ email quand la recherche échouait.)
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup, fireEvent } from '@testing-library/react'

vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))

import { AdminAmbassadorsPanel } from './AdminAmbassadorsPanel'

function mockFetch(customersOk: boolean) {
  return vi.fn(async (url: string) => {
    const u = String(url)
    if (u.includes('/admin/customers')) {
      return customersOk
        ? ({ ok: true, json: async () => ({ customers: [] }) } as Response)
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

describe('AdminAmbassadorsPanel — repli email manuel', () => {
  it('recherche INDISPONIBLE (Basic) → champ email manuel présent, pas de boîte de recherche', async () => {
    vi.stubGlobal('fetch', mockFetch(false))
    render(<AdminAmbassadorsPanel />)
    // Le champ email est TOUJOURS là → création possible.
    expect(await screen.findByPlaceholderText('julie@email.com')).toBeTruthy()
    // La boîte de recherche n'est PAS rendue quand indispo.
    expect(screen.queryByPlaceholderText('Tape un nom ou un email…')).toBeNull()
    // Note explicative du repli.
    expect(await screen.findByText(/forfait Shopify supérieur/i)).toBeTruthy()
  })

  it('recherche DISPONIBLE → boîte de recherche ET champ email présents', async () => {
    vi.stubGlobal('fetch', mockFetch(true))
    render(<AdminAmbassadorsPanel />)
    expect(await screen.findByPlaceholderText('Tape un nom ou un email…')).toBeTruthy()
    expect(screen.getByPlaceholderText('julie@email.com')).toBeTruthy()
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
