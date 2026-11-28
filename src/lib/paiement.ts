// ============================================================
// Moyens de paiement affichés sur le site (A8, 28/11/2026)
// ============================================================
// Cartes et portefeuilles : Storefront `shop.paymentSettings`
// (acceptedCardBrands, supportedDigitalWallets), lus côté serveur par
// getMoyensPaiement() (lib/shopify/paiement.ts, cache 6 h). Ce fichier ne fait
// que les mettre en mots. Pur, sans réseau : testé dans paiement.test.ts.
//
// Relevé du 28/11/2026 (Storefront 2026-10) : cartes VISA, MASTERCARD,
// AMERICAN_EXPRESS ; portefeuilles SHOPIFY_PAY, APPLE_PAY, GOOGLE_PAY.

/** Réglages lus dans Shopify (valeurs des enums CardBrand et DigitalWallet). */
export interface ReglagesPaiement {
  cartes: string[]
  portefeuilles: string[]
}

/**
 * PayPal et Klarna ne figurent pas dans paymentSettings. Vus sur l'écran de
 * paiement le 28/11/2026 (panier de test d'un article, sans e-mail saisi) :
 * PayPal en paiement express et dans la section Paiement, Klarna dans la
 * section Paiement. À retirer d'ici s'ils disparaissent de la caisse.
 */
export const MOYENS_VUS_AU_PAIEMENT = ['PayPal', 'Klarna'] as const

/** Repli si la lecture échoue : seulement les cartes que le site annonçait déjà avant le 28/11/2026. */
export const REGLAGES_REPLI: ReglagesPaiement = { cartes: ['VISA', 'MASTERCARD'], portefeuilles: [] }

/** Valeurs relevées le 28/11/2026 (texte figé de la fiche produit, composant client : voir paiement.test.ts). */
export const REGLAGES_RELEVES_28_11_2026: ReglagesPaiement = {
  cartes: ['VISA', 'MASTERCARD', 'AMERICAN_EXPRESS'],
  portefeuilles: ['SHOPIFY_PAY', 'APPLE_PAY', 'GOOGLE_PAY'],
}

// Ordre d'affichage. Valeur inconnue : ignorée (jamais un nom technique à l'écran).
const CARTES: [string, string][] = [
  ['VISA', 'Visa'],
  ['MASTERCARD', 'Mastercard'],
  ['AMERICAN_EXPRESS', 'American Express'],
  ['DISCOVER', 'Discover'],
  ['DINERS_CLUB', 'Diners Club'],
  ['JCB', 'JCB'],
]
const PORTEFEUILLES: [string, string][] = [
  ['APPLE_PAY', 'Apple Pay'],
  ['GOOGLE_PAY', 'Google Pay'],
  ['ANDROID_PAY', 'Google Pay'],
  ['SHOPIFY_PAY', 'Shop Pay'],
]

export interface MoyensPaiement {
  /** « CB » puis les marques de cartes acceptées. */
  cartes: string[]
  /** Portefeuilles, puis PayPal et Klarna. */
  autres: string[]
  /** Liste complète : « CB, Visa, Mastercard, American Express, Apple Pay, Google Pay, Shop Pay, PayPal, Klarna ». */
  texte: string
  /** Version courte (pied de page, fiche) : « CB, Apple Pay, Google Pay, PayPal, Klarna ». */
  court: string
  /** Pour une phrase : « par carte (CB, Visa, Mastercard, American Express), Apple Pay, Google Pay, Shop Pay, PayPal ou Klarna ». */
  phrase: string
}

const unique = (xs: string[]) => [...new Set(xs)]

/** « a, b ou c » */
function enumerer(xs: string[], mot: string): string {
  if (xs.length <= 1) return xs.join('')
  return `${xs.slice(0, -1).join(', ')} ${mot} ${xs[xs.length - 1]}`
}

export function moyensPaiement(r: ReglagesPaiement): MoyensPaiement {
  const cartesShopify = new Set(r.cartes)
  const portefeuillesShopify = new Set(r.portefeuilles)
  const marques = CARTES.filter(([k]) => cartesShopify.has(k)).map(([, nom]) => nom)
  // Les cartes CB françaises sont co-badgées Visa ou Mastercard.
  const cb = cartesShopify.has('VISA') || cartesShopify.has('MASTERCARD')
  const cartes = cb ? ['CB', ...marques] : marques
  const portefeuilles = unique(PORTEFEUILLES.filter(([k]) => portefeuillesShopify.has(k)).map(([, nom]) => nom))
  const autres = [...portefeuilles, ...MOYENS_VUS_AU_PAIEMENT]

  const court = [...(cartes.length ? [cartes[0]] : []), ...autres.filter((m) => m !== 'Shop Pay')]
  const phrase = cartes.length
    ? enumerer([`par carte (${cartes.join(', ')})`, ...autres], 'ou')
    : `par ${enumerer(autres, 'ou')}`

  return { cartes, autres, texte: [...cartes, ...autres].join(', '), court: court.join(', '), phrase }
}
