import { describe, it, expect } from 'vitest'
import crypto from 'node:crypto'
import { verifyShopifyHmac } from './verify-hmac'

function signBody(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body, 'utf8').digest('base64')
}

const SECRET = 'shopify_webhook_secret_test_only_do_not_use'

describe('verifyShopifyHmac', () => {
  it('accepte un HMAC valide pour un body donne', () => {
    const body = JSON.stringify({ id: 12345, total_price: '49.90' })
    const signature = signBody(body, SECRET)
    expect(verifyShopifyHmac({ rawBody: body, hmacHeader: signature, secret: SECRET })).toBe(true)
  })

  it('rejette un HMAC altere (1 char different)', () => {
    const body = JSON.stringify({ id: 12345 })
    const signature = signBody(body, SECRET)
    const tampered = signature.slice(0, -1) + (signature.endsWith('A') ? 'B' : 'A')
    expect(verifyShopifyHmac({ rawBody: body, hmacHeader: tampered, secret: SECRET })).toBe(false)
  })

  it('rejette un HMAC signe avec un mauvais secret', () => {
    const body = JSON.stringify({ id: 12345 })
    const wrongSig = signBody(body, 'wrong_secret')
    expect(verifyShopifyHmac({ rawBody: body, hmacHeader: wrongSig, secret: SECRET })).toBe(false)
  })

  it('rejette si le body a ete modifie apres signature', () => {
    const original = JSON.stringify({ id: 12345 })
    const signature = signBody(original, SECRET)
    const tampered = JSON.stringify({ id: 99999 })
    expect(verifyShopifyHmac({ rawBody: tampered, hmacHeader: signature, secret: SECRET })).toBe(false)
  })

  it('rejette si header manquant', () => {
    const body = JSON.stringify({ id: 1 })
    expect(verifyShopifyHmac({ rawBody: body, hmacHeader: null, secret: SECRET })).toBe(false)
    expect(verifyShopifyHmac({ rawBody: body, hmacHeader: undefined, secret: SECRET })).toBe(false)
    expect(verifyShopifyHmac({ rawBody: body, hmacHeader: '', secret: SECRET })).toBe(false)
  })

  it('rejette si secret manquant', () => {
    const body = JSON.stringify({ id: 1 })
    const sig = signBody(body, SECRET)
    expect(verifyShopifyHmac({ rawBody: body, hmacHeader: sig, secret: '' })).toBe(false)
  })

  it('rejette si rawBody non-string', () => {
    // @ts-expect-error : runtime guard
    expect(verifyShopifyHmac({ rawBody: null, hmacHeader: 'x', secret: SECRET })).toBe(false)
    // @ts-expect-error
    expect(verifyShopifyHmac({ rawBody: { a: 1 }, hmacHeader: 'x', secret: SECRET })).toBe(false)
  })

  it('accepte un body vide signe correctement', () => {
    const body = ''
    const signature = signBody(body, SECRET)
    expect(verifyShopifyHmac({ rawBody: body, hmacHeader: signature, secret: SECRET })).toBe(true)
  })

  it('rejette si tailles HMAC different (longueur differente)', () => {
    const body = JSON.stringify({ id: 1 })
    expect(verifyShopifyHmac({ rawBody: body, hmacHeader: 'short', secret: SECRET })).toBe(false)
  })
})
