import { describe, it, expect } from 'vitest'
import { nettoyer, noterErreur, lireJournal } from './journal'

describe('nettoyer', () => {
  it('masque e-mails, numéros de téléphone et identifiants longs', () => {
    const m = nettoyer('Phone +33 6 12 34 56 78 has already been taken (lea.dupont+jeu@exemple.fr) gid://shopify/Customer/10779482947926')
    expect(m).toBe('Phone [numéro] has already been taken ([e-mail]) gid://shopify/Customer/[numéro]')
    expect(nettoyer('tel 0612345678')).toBe('tel [numéro]')
  })
  it('garde les messages utiles et les courts nombres (HTTP 429), tronque à 300 caractères', () => {
    expect(nettoyer('Shopify GraphQL HTTP 429')).toBe('Shopify GraphQL HTTP 429')
    expect(nettoyer('x'.repeat(400))).toHaveLength(300)
  })
})

describe('sans Upstash (tests, dev local)', () => {
  it('écrire ne fait rien et ne lève pas, lire rend une liste vide', async () => {
    await expect(noterErreur({ etape: 'register', source: 'serveur', niveau: 'erreur', message: 'x' })).resolves.toBeUndefined()
    await expect(lireJournal()).resolves.toEqual([])
  })
})
