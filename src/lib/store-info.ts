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

/**
 * Identité de la boutique : JSON-LD (Store unique, même @id sur toutes les
 * pages), llms.txt, pied de page. Vérifiée par Claude Gestion le 10/10/2026.
 */
export const STORE = {
  name: 'BodyStart Nutrition',
  /** Ancienne enseigne, encore cherchée : à garder. */
  alternateName: 'BodyFit Coignières',
  streetAddress: '8 Rue du Pont des Landes',
  postalCode: '78310',
  locality: 'Coignières',
  region: 'Île-de-France',
  country: 'FR',
  phoneE164: '+33761847580',
  phoneDisplay: '07 61 84 75 80',
  geo: { latitude: 48.736836, longitude: 1.909592 },
  /** Lundi au samedi, sans coupure ; fermé le dimanche. */
  openingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  opens: '11:00',
  closes: '19:00',
  googlePlaceId: 'ChIJR-Jgxiyd5kcRRb2BKNRdFNM',
} as const

/** Fiche Google Maps de la boutique (identifiant CID) : `hasMap` et `sameAs`. */
export const GOOGLE_MAPS_URL = 'https://maps.google.com/?cid=15209885007331048773'

/** Profils officiels (`sameAs`). Facebook et PagesJaunes à ajouter quand ils seront au bon nom. */
export const SAME_AS = [GOOGLE_MAPS_URL, 'https://www.instagram.com/bodystart_nutrition/']

/**
 * Itinéraire vers la boutique, ouvert sur la fiche Google (place_id) et non
 * sur des coordonnées nues : le visiteur voit le nom, les horaires et les avis.
 */
export const GOOGLE_DIRECTIONS_URL =
  'https://www.google.com/maps/dir/?api=1&destination=BodyStart+Nutrition&destination_place_id=ChIJR-Jgxiyd5kcRRb2BKNRdFNM'

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
