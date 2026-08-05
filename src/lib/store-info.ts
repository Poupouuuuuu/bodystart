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

/** Itinéraire vers la boutique (coordonnées exactes, déjà utilisées sur /stores). */
export const GOOGLE_DIRECTIONS_URL =
  'https://www.google.com/maps/dir/?api=1&destination=48.736836,1.909592'

/** Fiche Google Maps (LECTURE des avis) — URL stable par place_id. */
export const GOOGLE_LISTING_URL =
  'https://www.google.com/maps/place/?q=place_id:ChIJR-Jgxiyd5kcRRb2BKNRdFNM'

/**
 * Note Google RÉELLE, relevée à la main sur la fiche (2026-08-05 : 4,6/5,
 * 58 avis). Pas de flux automatique (l'API Places est payante) → rafraîchir
 * ces deux valeurs de temps en temps. Ne JAMAIS inventer ces chiffres.
 * ⚠️ Ne pas émettre d'aggregateRating JSON-LD avec cette note : les guidelines
 * Google réservent ce schema aux avis collectés sur le site lui-même.
 */
export const GOOGLE_RATING = { value: 4.6, count: 58 }
