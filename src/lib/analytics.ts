// ============================================================
// Google Analytics 4 — helpers d'événements e-commerce
// ============================================================
// Tous les helpers sont des NO-OP tant que gtag n'est pas chargé (donc tant
// que l'utilisateur n'a pas accepté la mesure d'audience). Aucun risque
// d'appel avant consentement : window.gtag n'existe qu'après chargement.

import { isAnalyticsGranted } from './consent'

type GtagFn = (...args: unknown[]) => void

declare global {
  interface Window {
    gtag?: GtagFn
    dataLayer?: unknown[]
  }
}

// File d'attente : un event peut être émis avant que gtag.js soit injecté
// (ex. view_item au chargement direct d'une fiche produit, gtag se charge
// après l'hydratation). On ne met en file QUE si la mesure d'audience est déjà
// consentie → aucune fuite avant consentement. GoogleAnalytics vide la file
// dès que gtag est prêt.
type PendingEvent = { name: string; params?: Record<string, unknown> }
let pending: PendingEvent[] = []

export function gaFlushQueue(): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  const queued = pending
  pending = []
  for (const e of queued) window.gtag('event', e.name, e.params ?? {})
}

export interface GaItem {
  item_id: string // handle produit (ou SKU)
  item_name: string
  price?: number
  quantity?: number
  item_brand?: string
  item_variant?: string
}

/**
 * Envoi générique.
 * - gtag présent (consentement + script chargé) → envoi immédiat.
 * - gtag absent mais mesure consentie → mise en file (flush au chargement).
 * - mesure non consentie → no-op total (aucune trace, aucune fuite).
 */
export function gaEvent(name: string, params?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, params ?? {})
    return
  }
  if (isAnalyticsGranted()) pending.push({ name, params })
}

export function gaViewItem(item: GaItem): void {
  gaEvent('view_item', {
    currency: 'EUR',
    value: item.price ?? 0,
    items: [item],
  })
}

export function gaAddToCart(item: GaItem): void {
  gaEvent('add_to_cart', {
    currency: 'EUR',
    value: (item.price ?? 0) * (item.quantity ?? 1),
    items: [item],
  })
}

export function gaBeginCheckout(items: GaItem[], value: number): void {
  gaEvent('begin_checkout', {
    currency: 'EUR',
    value,
    items,
  })
}
