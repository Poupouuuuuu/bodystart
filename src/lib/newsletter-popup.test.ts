import { describe, it, expect } from 'vitest'
import { isExcludedPath, seenRecently, timerAllowed, NEWSLETTER_COOLDOWN_MS } from './newsletter-popup'

describe('isExcludedPath', () => {
  it('jamais sur /conseil, /jeu, les fiches produit, la caisse, le checkout', () => {
    for (const p of ['/conseil', '/conseil/x', '/jeu', '/products/whey-native-protimuscle', '/staff', '/checkout/abc', null]) {
      expect(isExcludedPath(p)).toBe(true)
    }
  })
  it('accueil, catalogue, catégories, blog : autorisés', () => {
    for (const p of ['/', '/products', '/categories/proteines', '/blog/quand-prendre-sa-whey', '/conseiller']) {
      expect(isExcludedPath(p)).toBe(false)
    }
  })
})

describe('seenRecently', () => {
  const now = Date.parse('2026-10-08T12:00:00Z')
  it('une fois tous les 30 jours', () => {
    expect(seenRecently(null, now)).toBe(false)
    expect(seenRecently(String(now - 29 * 24 * 3600 * 1000), now)).toBe(true)
    expect(seenRecently(String(now - NEWSLETTER_COOLDOWN_MS - 1), now)).toBe(false)
  })
  it('ancien drapeau « 1 » : vu, valeur illisible : pas vu', () => {
    expect(seenRecently('1', now)).toBe(true)
    expect(seenRecently('abc', now)).toBe(false)
  })
})

describe('timerAllowed', () => {
  it('à partir de la 2ᵉ page vue', () => {
    expect(timerAllowed(1)).toBe(false)
    expect(timerAllowed(2)).toBe(true)
  })
})
