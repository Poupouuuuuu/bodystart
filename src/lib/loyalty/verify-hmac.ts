/**
 * Verification HMAC SHA256 du webhook Shopify (signature 'X-Shopify-Hmac-Sha256').
 *
 * Shopify signe le RAW BODY du webhook avec le secret partage de la boutique
 * (Settings → Notifications → "All your webhooks will be signed with..." →
 * Click to reveal). On compare cette signature avec celle qu'on recalcule.
 *
 * Comparaison timing-safe via crypto.timingSafeEqual pour eviter les attaques
 * par timing.
 */
import crypto from 'node:crypto'

export interface VerifyShopifyHmacInput {
  rawBody: string
  hmacHeader: string | null | undefined
  secret: string
}

/**
 * Retourne true si le HMAC du raw body matche celui du header.
 * Retourne false dans tous les autres cas (header manquant, mauvaise longueur,
 * mismatch, secret manquant).
 *
 * IMPORTANT : passer le RAW body (pas un JSON re-stringify). Sinon les
 * whitespaces/ordre des cles cassent la signature.
 */
export function verifyShopifyHmac({ rawBody, hmacHeader, secret }: VerifyShopifyHmacInput): boolean {
  if (typeof rawBody !== 'string') return false
  if (typeof hmacHeader !== 'string' || hmacHeader.length === 0) return false
  if (typeof secret !== 'string' || secret.length === 0) return false

  const computed = crypto
    .createHmac('sha256', secret)
    .update(rawBody, 'utf8')
    .digest('base64')

  // Buffers de meme taille obligatoires pour timingSafeEqual
  const a = Buffer.from(computed, 'utf8')
  const b = Buffer.from(hmacHeader, 'utf8')
  if (a.length !== b.length) return false

  try {
    return crypto.timingSafeEqual(a, b)
  } catch {
    return false
  }
}
