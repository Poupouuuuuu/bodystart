/**
 * Infos boutique physique — SOURCE UNIQUE pour les liens Google (avis, itinéraire).
 * NAP : BodyStart Nutrition, 8 Rue du Pont des Landes, 78310 Coignières.
 */

/**
 * Lien « Laisser un avis Google » — lien OFFICIEL de la fiche Google Business
 * Profile (fourni par Adam le 2026-07-03, vérifié : aboutit sur le formulaire
 * writereview, placeid ChIJR-Jgxiyd5kcRRb2BKNRdFNM). À réutiliser partout où on
 * sollicite un avis (fiches produit, /stores, emails post-achat).
 */
export const GOOGLE_REVIEW_URL = 'https://g.page/r/CUW9gSjUXRTTEBM/review'

/**
 * Adresse de contact publiée partout sur le site (pages légales, FAQ, boutique,
 * JSON-LD). Adresse du domaine (Infomaniak, redirigée vers la boîte Gmail de la
 * boutique) : jamais l'adresse Gmail elle-même, un client ne pourrait pas
 * distinguer un vrai message d'une usurpation créée sur une messagerie gratuite.
 */
export const CONTACT_EMAIL = 'contact@bodystart-nutrition.fr'

/** Itinéraire vers la boutique (coordonnées exactes, déjà utilisées sur /stores). */
export const GOOGLE_DIRECTIONS_URL =
  'https://www.google.com/maps/dir/?api=1&destination=48.736836,1.909592'

/** Fiche Google Maps (LECTURE des avis) — URL stable par place_id. */
export const GOOGLE_LISTING_URL =
  'https://www.google.com/maps/place/?q=place_id:ChIJR-Jgxiyd5kcRRb2BKNRdFNM'

export interface GoogleRating {
  value: number
  count: number
}

/**
 * Note Google RÉELLE de la fiche. Depuis le 08/10/2026, la source est Shopify
 * (métachamps boutique `bodystart.avis_google_note` / `avis_google_nombre`,
 * mis à jour chaque lundi), lue par getGoogleRating() dans
 * lib/shopify/google-rating.ts. Cette constante n'est que la valeur de REPLI
 * si la lecture échoue (relevé du 08/10/2026 : 4,7/5, 75 avis). Ne JAMAIS
 * inventer ces chiffres.
 * ⚠️ Ne pas émettre d'aggregateRating JSON-LD avec cette note : les guidelines
 * Google réservent ce schema aux avis collectés sur le site lui-même.
 */
export const GOOGLE_RATING: GoogleRating = { value: 4.7, count: 75 }
