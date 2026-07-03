/**
 * Infos boutique physique — SOURCE UNIQUE pour les liens Google (avis, itinéraire).
 * NAP : BodyStart Nutrition, 8 Rue du Pont des Landes, 78310 Coignières.
 */

/**
 * Lien « Laisser un avis Google ».
 *
 * ⚠️ INTÉRIMAIRE : ouvre la fiche Google Maps de la boutique (le bouton « Avis »
 * y est accessible). L'ancien lien https://g.page/r/bodystart-coignieres/review
 * était un slug inventé qui redirigeait vers google.com (mort, vérifié).
 *
 * À REMPLACER par le lien direct du formulaire d'avis, récupérable par Adam dans
 * Google Business Profile → « Demander des avis », de la forme :
 *   https://g.page/r/<TOKEN>/review
 * ou https://search.google.com/local/writereview?placeid=<PLACE_ID>
 */
export const GOOGLE_REVIEW_URL =
  'https://www.google.com/maps/search/?api=1&query=BodyStart+Nutrition+8+Rue+du+Pont+des+Landes+78310+Coigni%C3%A8res'

/** Itinéraire vers la boutique (coordonnées exactes, déjà utilisées sur /stores). */
export const GOOGLE_DIRECTIONS_URL =
  'https://www.google.com/maps/dir/?api=1&destination=48.736836,1.909592'
