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
