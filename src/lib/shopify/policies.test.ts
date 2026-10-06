import fs from 'node:fs'
import path from 'node:path'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const shopifyFetch = vi.fn()
vi.mock('./client', () => ({ shopifyFetch: (...args: unknown[]) => shopifyFetch(...args) }))

import { getTermsOfSale, getLegalNotice, getRefundPolicy } from './policies'

const CGV_HTML = fs.readFileSync(
  path.join(__dirname, '../legal/fixtures/cgv-shopify-2026-10-06.html'),
  'utf8'
)

describe('getTermsOfSale', () => {
  beforeEach(() => {
    shopifyFetch.mockReset()
  })

  it('lit termsOfSale sur l’API 2026-04 et renvoie les 11 articles', async () => {
    shopifyFetch.mockResolvedValue({ shop: { termsOfSale: { body: CGV_HTML } } })
    const policy = await getTermsOfSale()
    expect(shopifyFetch).toHaveBeenCalledWith(expect.stringContaining('termsOfSale'), undefined, {
      apiVersion: '2026-04',
    })
    expect(policy.sections).toHaveLength(11)
    expect(policy.updatedLine).toBe('Dernière mise à jour : 6 octobre 2026')
  })

  it('lève une erreur (jamais de page vide) si la politique manque ou est vide', async () => {
    shopifyFetch.mockResolvedValue({ shop: { termsOfSale: null } })
    await expect(getTermsOfSale()).rejects.toThrow(/dernière version conservée/)
    shopifyFetch.mockResolvedValue({ shop: { termsOfSale: { body: '<p></p>' } } })
    await expect(getTermsOfSale()).rejects.toThrow(/dernière version conservée/)
  })

  it('laisse remonter une panne de l’API', async () => {
    shopifyFetch.mockRejectedValue(new Error('Shopify GraphQL HTTP 503'))
    await expect(getTermsOfSale()).rejects.toThrow('503')
  })
})

describe('getLegalNotice / getRefundPolicy', () => {
  beforeEach(() => {
    shopifyFetch.mockReset()
  })

  const read = (name: string) => fs.readFileSync(path.join(__dirname, '../legal/fixtures', name), 'utf8')

  it('mentions légales : legalNotice sur l’API 2026-04', async () => {
    shopifyFetch.mockResolvedValue({ shop: { legalNotice: { body: read('mentions-legales-shopify-2026-10-06.html') } } })
    const policy = await getLegalNotice()
    expect(shopifyFetch).toHaveBeenCalledWith(expect.stringContaining('legalNotice'), undefined, { apiVersion: '2026-04' })
    expect(policy.sections).toHaveLength(4)
  })

  it('remboursement : accepté sans titre h3, refusé s’il est vide', async () => {
    shopifyFetch.mockResolvedValue({ shop: { refundPolicy: { body: read('remboursement-shopify-2026-10-06.html') } } })
    const policy = await getRefundPolicy()
    expect(shopifyFetch).toHaveBeenCalledWith(expect.stringContaining('refundPolicy'), undefined, { apiVersion: '2026-04' })
    expect(policy.intro).toHaveLength(6)

    shopifyFetch.mockResolvedValue({ shop: { refundPolicy: { body: '   ' } } })
    await expect(getRefundPolicy()).rejects.toThrow(/dernière version conservée/)
    shopifyFetch.mockResolvedValue({ shop: { refundPolicy: null } })
    await expect(getRefundPolicy()).rejects.toThrow(/dernière version conservée/)
  })
})
