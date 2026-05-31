import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getSiteUrl, getSiteDomain } from './site-url'

describe('site-url', () => {
  const originalEnv = process.env.NEXT_PUBLIC_SITE_URL

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalEnv
  })

  describe('getSiteUrl', () => {
    it('retourne la valeur de NEXT_PUBLIC_SITE_URL', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://bodystart.vercel.app'
      expect(getSiteUrl()).toBe('https://bodystart.vercel.app')
    })

    it('strip le trailing slash', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://bodystart-nutrition.fr/'
      expect(getSiteUrl()).toBe('https://bodystart-nutrition.fr')
    })

    it('retourne chaine vide si variable absente', () => {
      delete process.env.NEXT_PUBLIC_SITE_URL
      expect(getSiteUrl()).toBe('')
    })

    it('retourne chaine vide si variable vide', () => {
      process.env.NEXT_PUBLIC_SITE_URL = ''
      expect(getSiteUrl()).toBe('')
    })
  })

  describe('getSiteDomain', () => {
    it('strip le protocole https', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://bodystart-nutrition.fr'
      expect(getSiteDomain()).toBe('bodystart-nutrition.fr')
    })

    it('strip le protocole http', () => {
      process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
      expect(getSiteDomain()).toBe('localhost:3000')
    })

    it('retourne chaine vide si url vide', () => {
      delete process.env.NEXT_PUBLIC_SITE_URL
      expect(getSiteDomain()).toBe('')
    })
  })
})
