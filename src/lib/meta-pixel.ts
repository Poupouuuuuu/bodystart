// ============================================================
// Meta Pixel : helpers d'événements e-commerce (ViewContent, AddToCart)
// ============================================================
// Même pixel que le canal Facebook & Instagram de Shopify, donc même catalogue.
// Identifiant produit : le catalogue Meta de la boutique utilise l'ID NUMÉRIQUE
// de la variante Shopify (vérifié le 26/09/2026 : l'ID de contenu 53981934813526
// est la variante « Fruit Punch / 400g » de YEAAH EAA, et le pixel du canal
// envoie content_ids = [ID de variante] avec content_type 'product'). Un autre
// format empêcherait les pubs dynamiques de relier la visite au produit.
//
// Consentement : AUCUN appel à fbq sans accord « publicité » (catégorie
// marketing du bandeau). Un événement émis sans accord est abandonné, jamais
// mis de côté pour plus tard.
//
// InitiateCheckout et Purchase ne partent PAS d'ici : le checkout Shopify et le
// canal Facebook & Instagram s'en chargent (un doublon fausserait les stats).

import { isMarketingGranted } from './consent'

type FbqFn = (...args: unknown[]) => void

declare global {
  interface Window {
    fbq?: FbqFn
  }
}

export type MetaEventName = 'PageView' | 'ViewContent' | 'AddToCart'

/** 'gid://shopify/ProductVariant/53981934813526' → '53981934813526'. null si ce n'est pas une variante. */
export function variantNumericId(id: string | null | undefined): string | null {
  if (!id) return null
  const m = /^(?:gid:\/\/shopify\/ProductVariant\/)?(\d+)(?:\?.*)?$/.exec(id.trim())
  return m ? m[1] : null
}

/** Identifiant unique d'événement (déduplication avec une future API Conversions). */
export function newEventId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    /* contexte non sécurisé : repli ci-dessous */
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

// File d'attente : ViewContent part au montage de la fiche, souvent AVANT que
// le script du pixel soit injecté (afterInteractive). On ne met en file QUE si
// l'accord publicité est déjà donné ; MetaPixel vide la file dès que fbq existe.
type PendingEvent = { name: MetaEventName; params: Record<string, unknown>; eventID: string }
const MAX_PENDING = 20
let pending: PendingEvent[] = []

function send(e: PendingEvent): void {
  window.fbq?.('track', e.name, e.params, { eventID: e.eventID })
}

export function metaFlushQueue(): void {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return
  const queued = pending
  pending = []
  // Accord retiré entre-temps : la file est jetée sans rien envoyer.
  if (!isMarketingGranted()) return
  // PageView d'abord, puis les événements produit, dans leur ordre d'émission.
  queued.filter((e) => e.name === 'PageView').forEach(send)
  queued.filter((e) => e.name !== 'PageView').forEach(send)
}

/**
 * Envoi générique. Renvoie l'eventID, ou null si rien n'est parti.
 * - accord publicité absent → no-op total (aucun appel fbq, rien en file) ;
 * - fbq présent → envoi immédiat ;
 * - fbq pas encore chargé → mise en file (vidée par MetaPixel).
 */
export function metaTrack(name: MetaEventName, params: Record<string, unknown> = {}): string | null {
  if (typeof window === 'undefined') return null
  if (!isMarketingGranted()) return null
  const event: PendingEvent = { name, params, eventID: newEventId() }
  if (typeof window.fbq === 'function') send(event)
  else if (pending.length < MAX_PENDING) pending.push(event)
  return event.eventID
}

export interface MetaItem {
  /** GID Shopify de la variante (ou son ID numérique). */
  variantId: string
  name: string
  price?: number
  quantity?: number
  category?: string
}

function contentParams(item: MetaItem): Record<string, unknown> | null {
  const id = variantNumericId(item.variantId)
  if (!id) return null
  const quantity = item.quantity ?? 1
  const price = item.price ?? 0
  return {
    content_ids: [id],
    content_type: 'product',
    content_name: item.name,
    ...(item.category ? { content_category: item.category } : {}),
    contents: [{ id, quantity, item_price: price }],
    currency: 'EUR',
    value: Math.round(price * quantity * 100) / 100,
  }
}

export function metaViewContent(item: MetaItem): string | null {
  const params = contentParams({ ...item, quantity: 1 })
  return params ? metaTrack('ViewContent', params) : null
}

export function metaAddToCart(item: MetaItem): string | null {
  const params = contentParams(item)
  return params ? metaTrack('AddToCart', { ...params, num_items: item.quantity ?? 1 }) : null
}
