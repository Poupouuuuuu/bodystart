import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { moyensPaiement, REGLAGES_RELEVES_28_11_2026, REGLAGES_REPLI } from './paiement'

describe('moyensPaiement', () => {
  it('met en mots les réglages relevés le 28/11/2026, avec PayPal et Klarna vus au paiement', () => {
    const m = moyensPaiement(REGLAGES_RELEVES_28_11_2026)
    expect(m.texte).toBe('CB, Visa, Mastercard, American Express, Apple Pay, Google Pay, Shop Pay, PayPal, Klarna')
    expect(m.court).toBe('CB, Apple Pay, Google Pay, PayPal, Klarna')
    expect(m.phrase).toBe(
      'par carte (CB, Visa, Mastercard, American Express), Apple Pay, Google Pay, Shop Pay, PayPal ou Klarna'
    )
  })

  it('repli : les seules cartes déjà annoncées, sans portefeuille', () => {
    const m = moyensPaiement(REGLAGES_REPLI)
    expect(m.texte).toBe('CB, Visa, Mastercard, PayPal, Klarna')
    expect(m.court).toBe('CB, PayPal, Klarna')
  })

  it('ignore les valeurs inconnues et les doublons (Android Pay = Google Pay)', () => {
    const m = moyensPaiement({ cartes: ['AMERICAN_EXPRESS', 'INCONNUE'], portefeuilles: ['ANDROID_PAY', 'GOOGLE_PAY'] })
    expect(m.cartes).toEqual(['American Express'])
    expect(m.autres).toEqual(['Google Pay', 'PayPal', 'Klarna'])
    expect(m.texte).not.toContain('INCONNUE')
  })

  it('la fiche produit (composant client, texte figé) annonce la même liste courte', () => {
    const src = readFileSync(join(__dirname, '../components/product/v2/BuyBoxV2.tsx'), 'utf8')
    expect(src).toContain(`Paiement sécurisé (${moyensPaiement(REGLAGES_RELEVES_28_11_2026).court})`)
  })
})
