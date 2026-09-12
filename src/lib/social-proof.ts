/**
 * « Vu sur Instagram » — vidéos d'influenceurs tournées à la boutique,
 * affichées sur l'accueil (section VuSurInstagramV3). Pas d'embed Instagram
 * (script tiers + cookies → consentement) : une carte statique (capture de
 * la vidéo dans /public/instagram/) qui ouvre le reel sur Instagram.
 *
 * Liste vide = section masquée. Pour ajouter une vidéo : déposer la capture
 * (format portrait 4:5 ou 9:16, ≥ 800 px de large) dans public/instagram/
 * et ajouter une entrée ici.
 */
export interface InstagramFeature {
  /** Nom affiché (ex. « Venomette »). */
  author: string
  /** Handle Instagram sans @ (ex. « venomette »). */
  handle: string
  /** Une ligne : ce qu'on voit dans la vidéo. */
  title: string
  /** URL du reel / post Instagram. */
  url: string
  /** Capture locale, ex. « /instagram/venomette.jpg ». */
  image: string
}

export const INSTAGRAM_FEATURES: InstagramFeature[] = []
