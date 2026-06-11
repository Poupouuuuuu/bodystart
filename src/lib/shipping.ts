// ============================================================
// LIVRAISON — SOURCE UNIQUE DE VÉRITÉ
// ============================================================
// Toute mention de tarif/délai de livraison sur le site DOIT venir d'ici :
// FAQ (+ JSON-LD FAQPage), /livraison, JSON-LD Product (shippingDetails),
// seuil franco du panier et du cross-sell.
//
// Valeurs alignées sur les rates réellement configurés dans Shopify
// (vérifiés au checkout le 2026-06-06 : Mondial Relay 4,90 € / Colissimo
// 6,90 € / franco ≥ 85 €). Si les rates changent dans Shopify
// (Settings → Shipping), répercuter ICI et nulle part ailleurs.
// (Lecture auto via l'Admin API impossible : scope read_shipping absent.)

export const FREE_SHIPPING_THRESHOLD_CENTS = 8500 // livraison offerte dès 85 €

export interface ShippingMethod {
  key: 'mondial_relay' | 'colissimo' | 'click_and_collect'
  label: string
  priceCents: number
  /** Jours ouvrés [min, max] de transit. null = retrait immédiat (C&C). */
  transitDays: [number, number] | null
  /** Texte délai affichable, dérivé de transitDays. */
  delayLabel: string
}

export const MONDIAL_RELAY: ShippingMethod = {
  key: 'mondial_relay',
  label: 'Mondial Relay',
  priceCents: 490,
  transitDays: [2, 3],
  delayLabel: '2 à 3 jours ouvrés',
}

export const COLISSIMO: ShippingMethod = {
  key: 'colissimo',
  label: 'Colissimo à domicile',
  priceCents: 690,
  transitDays: [2, 4],
  delayLabel: '2 à 4 jours ouvrés',
}

export const CLICK_AND_COLLECT: ShippingMethod = {
  key: 'click_and_collect',
  label: 'Click & Collect',
  priceCents: 0,
  transitDays: null,
  delayLabel: 'Prêt sous 2h',
}

/** Préparation de commande (handling) pour le JSON-LD Product. */
export const HANDLING_DAYS: [number, number] = [0, 1]

/** "4,90€" — format court FR pour les textes marketing. */
export function formatShippingPrice(cents: number): string {
  const euros = cents / 100
  return `${euros.toFixed(2).replace('.', ',').replace(',00', '')}€`
}

export const FREE_SHIPPING_LABEL = `dès ${FREE_SHIPPING_THRESHOLD_CENTS / 100}€`
