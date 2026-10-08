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
// Livraison locale 8,99 € (rayon 10 km, payante même au-delà du franco) :
// reprise de la politique d'expédition Shopify du 2026-10-06.

export const FREE_SHIPPING_THRESHOLD_CENTS = 8500 // livraison offerte dès 85 €

export interface ShippingMethod {
  key: 'mondial_relay' | 'colissimo' | 'click_and_collect' | 'local_delivery'
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

/**
 * Promesse de retrait en boutique (08/10/2026) : IMMÉDIAT pour un produit en
 * stock à Coignières, aux heures d'ouverture ; commande passée hors horaires :
 * prête dès l'ouverture (11 h). Sans stock en boutique, aucune promesse
 * d'immédiateté (elle serait fausse) : la fiche produit n'affiche « retrait
 * immédiat » que si le stock boutique de la variante est positif. Les textes
 * légaux lus depuis Shopify (CGV, politique d'expédition) gardent « sous 2 h »
 * comme délai maximum (CLICK_AND_COLLECT.delayLabel).
 */
export const PICKUP_PROMISE = {
  /** Mention courte : bandeaux, puces, pied de page. */
  court: 'Retrait immédiat si en stock',
  /** Phrase complète, pages d'information. */
  long: "Retrait immédiat en boutique pour les produits en stock, aux heures d'ouverture",
  /** Fiche produit, variante en stock à Coignières. */
  enStock: "Retrait immédiat à Coignières, aux heures d'ouverture",
  /** Commande passée en dehors des horaires. */
  horsHoraires: "Commande passée en dehors des horaires : prête dès l'ouverture, à 11 h.",
} as const

// Livrée par la boutique, en main propre, du lundi au samedi entre 19 h et
// 21 h : le soir même pour une commande passée avant 17 h, sinon le lendemain
// soir. JAMAIS offerte (le franco ne s'applique pas). Zone limitée à ~10 km :
// ne pas l'ajouter au JSON-LD Product (shippingDetails = toute la France).
export const LIVRAISON_LOCALE: ShippingMethod = {
  key: 'local_delivery',
  label: 'Livraison locale',
  priceCents: 899,
  transitDays: [0, 1],
  delayLabel: 'Le soir même si tu commandes avant\u00a017\u00a0h',
}

/** Préparation de commande (handling) pour le JSON-LD Product. */
export const HANDLING_DAYS: [number, number] = [0, 1]

/** "4,90 €" (espace insécable avant €) : format court FR pour les textes marketing. */
export function formatShippingPrice(cents: number): string {
  const euros = cents / 100
  return `${euros.toFixed(2).replace('.', ',').replace(',00', '')}\u00a0€`
}

export const FREE_SHIPPING_LABEL = `dès ${formatShippingPrice(FREE_SHIPPING_THRESHOLD_CENTS)}`
