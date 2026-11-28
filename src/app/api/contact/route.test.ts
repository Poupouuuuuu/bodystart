import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

const { send } = vi.hoisted(() => ({ send: vi.fn() }))
vi.mock('resend', () => ({ Resend: vi.fn(() => ({ emails: { send } })) }))

import { POST } from './route'
import { MESSAGE_CONTACT_NON_PARTI } from '@/lib/contact-validation'

const demande = (body: Record<string, unknown>) =>
  new NextRequest('https://bodystart-nutrition.fr/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

const avecEmail = { name: 'Léa', email: 'lea@exemple.fr', phone: '06 12 34 56 78', objectif: 'Prendre du muscle', message: 'x' }

beforeEach(() => {
  send.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

describe('POST /api/contact : le résultat de Resend est lu', () => {
  it('les deux e-mails partent : succès', async () => {
    send.mockResolvedValue({ data: { id: 'm1' }, error: null })
    const res = await POST(demande(avecEmail))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(send).toHaveBeenCalledTimes(2)
  })

  it('e-mail boutique refusé par Resend : 502 avec un message à afficher, pas d\'accusé au client', async () => {
    send.mockResolvedValueOnce({ data: null, error: { name: 'validation_error', message: 'x' } })
    const res = await POST(demande(avecEmail))
    expect(res.status).toBe(502)
    expect(await res.json()).toEqual({ error: MESSAGE_CONTACT_NON_PARTI })
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('e-mail boutique en exception (réseau) : 502 aussi', async () => {
    send.mockRejectedValueOnce(new Error('fetch failed'))
    const res = await POST(demande(avecEmail))
    expect(res.status).toBe(502)
    expect((await res.json()).error).toBe(MESSAGE_CONTACT_NON_PARTI)
  })

  it('seul l\'accusé de réception échoue : succès quand même (la boutique a la demande)', async () => {
    send
      .mockResolvedValueOnce({ data: { id: 'm1' }, error: null })
      .mockResolvedValueOnce({ data: null, error: { name: 'validation_error', message: 'x' } })
    const res = await POST(demande(avecEmail))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
  })

  it('accusé en exception : succès quand même', async () => {
    send.mockResolvedValueOnce({ data: { id: 'm1' }, error: null }).mockRejectedValueOnce(new Error('fetch failed'))
    const res = await POST(demande(avecEmail))
    expect(res.status).toBe(200)
  })

  it('sans e-mail client : un seul envoi', async () => {
    send.mockResolvedValue({ data: { id: 'm1' }, error: null })
    const res = await POST(demande({ ...avecEmail, email: '' }))
    expect(res.status).toBe(200)
    expect(send).toHaveBeenCalledTimes(1)
  })

  it('le message affiché donne le téléphone, sans tiret long', () => {
    expect(MESSAGE_CONTACT_NON_PARTI).toContain('07 61 84 75 80')
    expect(MESSAGE_CONTACT_NON_PARTI).not.toMatch(/[—–]/)
  })
})
