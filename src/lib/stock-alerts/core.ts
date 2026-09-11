/**
 * Alerte « me prévenir quand c'est de retour » — logique pure (testable).
 *
 * - Validation des entrées du formulaire (email, id de variante).
 * - Lecture du payload du webhook Shopify `inventory_levels/update`.
 * - Construction de l'email « De retour en stock » (Resend), dans le ton du
 *   site (tutoiement, palette V2).
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
export const VARIANT_GID_RE = /^gid:\/\/shopify\/ProductVariant\/\d+$/

export function isValidEmail(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 254 && EMAIL_RE.test(value)
}

export function isValidVariantGid(value: unknown): value is string {
  return typeof value === 'string' && VARIANT_GID_RE.test(value)
}

/** « gid://shopify/InventoryItem/123 » → « 123 » (clé du payload webhook). */
export function gidToNumericId(gid: string): string {
  const m = /\/(\d+)$/.exec(gid)
  if (!m) throw new Error(`gid invalide : ${gid}`)
  return m[1]
}

export interface InventoryLevelPayload {
  inventoryItemId: string
  available: number | null
  locationId: string | null
}

/**
 * Payload Shopify `inventory_levels/update` :
 *   { inventory_item_id: 123, location_id: 456, available: 3, updated_at: … }
 * Retourne null si le payload n'a pas la forme attendue.
 */
export function parseInventoryLevelPayload(payload: unknown): InventoryLevelPayload | null {
  if (!payload || typeof payload !== 'object') return null
  const p = payload as Record<string, unknown>
  const rawId = p.inventory_item_id
  if (typeof rawId !== 'number' && typeof rawId !== 'string') return null
  const inventoryItemId = String(rawId)
  if (!/^\d+$/.test(inventoryItemId)) return null
  const available =
    typeof p.available === 'number' ? p.available : p.available === null ? null : Number.NaN
  if (Number.isNaN(available)) return null
  const locationId =
    typeof p.location_id === 'number' || typeof p.location_id === 'string' ? String(p.location_id) : null
  return { inventoryItemId, available, locationId }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export interface BackInStockEmailInput {
  productTitle: string
  variantTitle: string | null
  productHandle: string
  siteUrl: string
}

export interface BackInStockEmail {
  subject: string
  html: string
  text: string
}

/** Variante « Default Title » = produit sans option → on ne l'affiche pas. */
export function displayVariantTitle(variantTitle: string | null | undefined): string | null {
  if (!variantTitle) return null
  const t = variantTitle.trim()
  if (!t || t.toLowerCase() === 'default title') return null
  return t
}

export function buildBackInStockEmail(input: BackInStockEmailInput): BackInStockEmail {
  const variant = displayVariantTitle(input.variantTitle)
  const name = variant ? `${input.productTitle} (${variant})` : input.productTitle
  const url = `${input.siteUrl.replace(/\/$/, '')}/products/${input.productHandle}`
  const safeName = escapeHtml(name)
  const subject = `De retour en stock : ${name}`

  const text = [
    `Bonne nouvelle : ${name} est de retour sur bodystart-nutrition.fr.`,
    `Il n'y en a pas beaucoup, alors ne traîne pas : ${url}`,
    '',
    'Retrait gratuit en boutique à Coignières ou livraison partout en France (offerte dès 85 €).',
    '',
    "Tu reçois cet email parce que tu as demandé à être prévenu du retour de ce produit. C'est une alerte unique, pas une newsletter.",
    'BodyStart Nutrition · 8 rue du Pont des Landes, 78310 Coignières · 07 61 84 75 80',
  ].join('\n')

  const html = `
<div style="margin:0;padding:0;background:#FAF8F3;font-family:Inter,Arial,Helvetica,sans-serif;color:#2A2A2A;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <p style="margin:0 0 24px;text-align:center;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#6B6B66;">BodyStart Nutrition</p>
    <div style="background:#FFFFFF;border-radius:20px;padding:32px 28px;">
      <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.15;color:#2D5A2D;">C&#39;est de retour&nbsp;!</h1>
      <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">Bonne nouvelle&nbsp;: <strong>${safeName}</strong> est de nouveau disponible sur bodystart-nutrition.fr.</p>
      <p style="margin:0 0 24px;font-size:16px;line-height:1.6;">Il n&#39;y en a pas beaucoup, alors ne traîne pas.</p>
      <p style="margin:0 0 28px;text-align:center;">
        <a href="${url}" style="display:inline-block;background:#3B7A3F;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:15px;padding:14px 28px;border-radius:999px;">Voir le produit</a>
      </p>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#6B6B66;">Retrait gratuit en boutique à Coignières ou livraison partout en France (offerte dès 85&nbsp;€).</p>
    </div>
    <p style="margin:24px 0 0;font-size:12px;line-height:1.6;color:#6B6B66;text-align:center;">
      Tu reçois cet email parce que tu as demandé à être prévenu du retour de ce produit. C&#39;est une alerte unique, pas une newsletter.<br>
      BodyStart Nutrition · 8 rue du Pont des Landes, 78310 Coignières · 07 61 84 75 80
    </p>
  </div>
</div>`.trim()

  return { subject, html, text }
}
