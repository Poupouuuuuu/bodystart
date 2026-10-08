import { describe, it, expect, vi, beforeEach } from 'vitest'

const shopifyFetch = vi.fn()
vi.mock('./client', () => ({ shopifyFetch: (...a: unknown[]) => shopifyFetch(...a) }))

import { getGoogleRating, parseGoogleRating, formatRating } from './google-rating'

beforeEach(() => {
  shopifyFetch.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

describe('parseGoogleRating', () => {
  it('valeurs Shopify valides', () => {
    expect(parseGoogleRating('4.7', '75')).toEqual({ value: 4.7, count: 75 })
    expect(parseGoogleRating('4.66', '120')).toEqual({ value: 4.7, count: 120 })
  })
  it('valeurs absentes ou incohérentes : null', () => {
    expect(parseGoogleRating(null, '75')).toBeNull()
    expect(parseGoogleRating('4.7', '')).toBeNull()
    expect(parseGoogleRating('6', '75')).toBeNull()
    expect(parseGoogleRating('4.7', '0')).toBeNull()
    expect(parseGoogleRating('4.7', '7.5')).toBeNull()
    expect(parseGoogleRating('abc', '75')).toBeNull()
  })
})

describe('getGoogleRating', () => {
  it('lit les métachamps boutique', async () => {
    shopifyFetch.mockResolvedValue({ shop: { note: { value: '4.8' }, nombre: { value: '81' } } })
    expect(await getGoogleRating()).toEqual({ value: 4.8, count: 81 })
    expect(String(shopifyFetch.mock.calls[0][0])).toContain('avis_google_nombre')
  })
  it('lecture en échec ou métachamp vide : valeur de repli, jamais d’erreur', async () => {
    shopifyFetch.mockRejectedValueOnce(new Error('Shopify GraphQL: boom'))
    expect(await getGoogleRating()).toEqual({ value: 4.7, count: 75 })
    shopifyFetch.mockResolvedValueOnce({ shop: { note: null, nombre: { value: '81' } } })
    expect(await getGoogleRating()).toEqual({ value: 4.7, count: 75 })
  })
  it('format français', () => {
    expect(formatRating({ value: 4.7, count: 75 })).toBe('4,7')
  })
})
