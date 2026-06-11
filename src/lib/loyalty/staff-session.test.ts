/**
 * Tests de l'auth staff (cœur de la caisse — touche à l'argent).
 * requireStaff (Server Components, redirect) + getStaffFromRequest (routes, null).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { requireStaff, getStaffFromRequest } from './staff-session'
import { createLoyaltyServerClient } from './supabase-server'
import { getLoyaltyAdminClient } from './supabase-admin'
import { redirect } from 'next/navigation'

vi.mock('next/navigation', () => ({
  // Comme le vrai redirect() de Next : interrompt l'exécution en throwant.
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  }),
}))
vi.mock('./supabase-server', () => ({ createLoyaltyServerClient: vi.fn() }))
vi.mock('./supabase-admin', () => ({ getLoyaltyAdminClient: vi.fn() }))

const mockServer = vi.mocked(createLoyaltyServerClient)
const mockAdmin = vi.mocked(getLoyaltyAdminClient)
const mockRedirect = vi.mocked(redirect)

function authClient(user: { id: string } | null, error: { message: string } | null = null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { auth: { getUser: vi.fn().mockResolvedValue({ data: { user }, error }) } } as any
}

function adminClient(staffRow: Record<string, unknown> | null, error: { message: string } | null = null) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q: any = {}
  for (const m of ['from', 'select', 'eq']) q[m] = vi.fn(() => q)
  q.maybeSingle = vi.fn().mockResolvedValue({ data: staffRow, error })
  return q
}

const ACTIVE_STAFF = {
  id: 'staff-1',
  email: 'caisse@bodystart.fr',
  full_name: 'Adam',
  role: 'admin',
  is_active: true,
}

beforeEach(() => vi.clearAllMocks())

describe('requireStaff', () => {
  it('pas de session Supabase → redirect /staff/login', async () => {
    mockServer.mockReturnValue(authClient(null))
    await expect(requireStaff()).rejects.toThrow('REDIRECT:/staff/login')
    expect(mockRedirect).toHaveBeenCalledWith('/staff/login')
  })

  it('session OK mais user absent de loyalty_staff → redirect not_staff', async () => {
    mockServer.mockReturnValue(authClient({ id: 'user-x' }))
    mockAdmin.mockReturnValue(adminClient(null))
    await expect(requireStaff()).rejects.toThrow('REDIRECT:/staff/login?reason=not_staff')
  })

  it('staff désactivé (is_active=false) → redirect not_staff', async () => {
    mockServer.mockReturnValue(authClient({ id: 'staff-1' }))
    mockAdmin.mockReturnValue(adminClient({ ...ACTIVE_STAFF, is_active: false }))
    await expect(requireStaff()).rejects.toThrow('REDIRECT:/staff/login?reason=not_staff')
  })

  it('staff actif → retourne le contexte mappé', async () => {
    mockServer.mockReturnValue(authClient({ id: 'staff-1' }))
    const admin = adminClient(ACTIVE_STAFF)
    mockAdmin.mockReturnValue(admin)
    const ctx = await requireStaff()
    expect(ctx).toEqual({ id: 'staff-1', email: 'caisse@bodystart.fr', fullName: 'Adam', role: 'admin' })
    expect(admin.from).toHaveBeenCalledWith('loyalty_staff')
    expect(admin.eq).toHaveBeenCalledWith('id', 'staff-1')
  })

  it('erreur de lecture loyalty_staff → redirect not_staff (fail closed)', async () => {
    mockServer.mockReturnValue(authClient({ id: 'staff-1' }))
    mockAdmin.mockReturnValue(adminClient(null, { message: 'db error' }))
    await expect(requireStaff()).rejects.toThrow('REDIRECT:/staff/login?reason=not_staff')
  })
})

describe('getStaffFromRequest', () => {
  it('pas de session → null (pas de redirect)', async () => {
    mockServer.mockReturnValue(authClient(null))
    expect(await getStaffFromRequest()).toBeNull()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('pas staff actif → null', async () => {
    mockServer.mockReturnValue(authClient({ id: 'user-x' }))
    mockAdmin.mockReturnValue(adminClient({ ...ACTIVE_STAFF, is_active: false }))
    expect(await getStaffFromRequest()).toBeNull()
  })

  it('staff actif → contexte', async () => {
    mockServer.mockReturnValue(authClient({ id: 'staff-1' }))
    mockAdmin.mockReturnValue(adminClient(ACTIVE_STAFF))
    expect(await getStaffFromRequest()).toEqual({
      id: 'staff-1',
      email: 'caisse@bodystart.fr',
      fullName: 'Adam',
      role: 'admin',
    })
  })

  it('exception interne (client KO) → null, jamais de throw', async () => {
    mockServer.mockImplementation(() => {
      throw new Error('env manquante')
    })
    expect(await getStaffFromRequest()).toBeNull()
  })
})
