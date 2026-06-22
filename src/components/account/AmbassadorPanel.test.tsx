// @vitest-environment jsdom
/**
 * Rendu réel (jsdom) du dashboard ambassadeur. Couvre les états visuels qui
 * n'apparaîtraient PAS dans les tests webhook : actif/expiré/sous-minimum/vide
 * + non-ambassadeur + loading. On mocke le hook useAmbassador (la donnée vient
 * déjà des tests API/webhook) pour piloter chaque état déterministe.
 *
 * NB : ceci vérifie la LOGIQUE de rendu (pas de crash, bons libellés/montants),
 * pas le rendu pixel/CSS (qui nécessiterait un vrai navigateur + session client).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'

const mockUseAmbassador = vi.fn()
vi.mock('@/hooks/useAmbassador', () => ({ useAmbassador: () => mockUseAmbassador() }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))

import { AmbassadorPanel } from './AmbassadorPanel'

afterEach(() => {
  cleanup()
  mockUseAmbassador.mockReset()
})

const baseData = {
  ambassador: {
    name: 'Julie',
    code: 'COACHJULIE',
    ratePct: 10,
    active: true,
    balanceCents: 2500,
    usableCents: 2500,
    expired: false,
    minToUseCents: 1000,
    lastActivityAt: '2026-06-01T00:00:00Z',
  },
  stats: { ordersCount: 12, revenueCents: 48000, newCustomers: 9, newCustomerRate: 75 },
  transactions: [
    { id: '1', type: 'commission' as const, amountCents: 500, balanceAfterCents: 2500, shopifyOrderId: 'gid://1', notes: null, createdAt: '2026-06-01T10:00:00Z' },
    { id: '2', type: 'revoke' as const, amountCents: 200, balanceAfterCents: 2300, shopifyOrderId: 'gid://2', notes: null, createdAt: '2026-05-20T10:00:00Z' },
  ],
}

describe('AmbassadorPanel (rendu)', () => {
  it('ambassadeur actif : cagnotte, code, stats et historique', () => {
    mockUseAmbassador.mockReturnValue({ kind: 'ambassador', data: baseData })
    render(<AmbassadorPanel />)
    expect(screen.getByText('Espace ambassadeur')).toBeTruthy()
    expect(screen.getByText('COACHJULIE')).toBeTruthy()
    expect(screen.getByText('25 €')).toBeTruthy() // solde 2500c
    expect(screen.getByText('12')).toBeTruthy() // ventes
    expect(screen.getByText('480 €')).toBeTruthy() // CA généré 48000c
    expect(screen.getByText('75%')).toBeTruthy() // % nouveaux
    expect(screen.getByText('Commission sur vente')).toBeTruthy()
    expect(screen.getByText('Reprise (remboursement)')).toBeTruthy()
  })

  it('cagnotte expirée : message d’expiration', () => {
    mockUseAmbassador.mockReturnValue({
      kind: 'ambassador',
      data: { ...baseData, ambassador: { ...baseData.ambassador, expired: true, usableCents: 0 } },
    })
    render(<AmbassadorPanel />)
    expect(screen.getByText(/Cagnotte expirée/)).toBeTruthy()
  })

  it('sous le minimum : affiche le reste à atteindre', () => {
    mockUseAmbassador.mockReturnValue({
      kind: 'ambassador',
      data: { ...baseData, ambassador: { ...baseData.ambassador, balanceCents: 600, usableCents: 0, expired: false } },
    })
    render(<AmbassadorPanel />)
    expect(screen.getByText(/Encore 4 € avant/)).toBeTruthy() // 1000-600 = 400c = 4 €
  })

  it('code désactivé : avertissement', () => {
    mockUseAmbassador.mockReturnValue({
      kind: 'ambassador',
      data: { ...baseData, ambassador: { ...baseData.ambassador, active: false } },
    })
    render(<AmbassadorPanel />)
    expect(screen.getByText(/code est actuellement désactivé/)).toBeTruthy()
  })

  it('historique vide : empty state', () => {
    mockUseAmbassador.mockReturnValue({ kind: 'ambassador', data: { ...baseData, transactions: [] } })
    render(<AmbassadorPanel />)
    expect(screen.getByText(/Aucun mouvement/)).toBeTruthy()
  })

  it('non-ambassadeur : message réservé', () => {
    mockUseAmbassador.mockReturnValue({ kind: 'not_ambassador' })
    render(<AmbassadorPanel />)
    expect(screen.getByText(/réservé aux ambassadeurs/)).toBeTruthy()
  })

  it('loading : spinner sans crash', () => {
    mockUseAmbassador.mockReturnValue({ kind: 'loading' })
    const { container } = render(<AmbassadorPanel />)
    expect(container.querySelector('svg')).toBeTruthy()
  })
})
