// Règles d'affichage du bandeau newsletter (08/10/2026). Pur, testé.
// - jamais au premier écran d'une visite : à partir de la 2ᵉ page vue, après
//   un court délai ; sur ordinateur, aussi à l'intention de sortie (souris qui
//   quitte la fenêtre par le haut), dès la 1re page ;
// - jamais sur /conseil, /jeu, les fiches produit, la caisse ni un checkout ;
// - une fois par visiteur tous les 30 jours.

export const NEWSLETTER_FLAG = 'bs_newsletter_popup'
export const PAGE_VIEWS_KEY = 'bs_pages_vues'
export const NEWSLETTER_DELAY_MS = 8000
export const NEWSLETTER_COOLDOWN_MS = 30 * 24 * 3600 * 1000

const EXCLUDED_PREFIXES = ['/staff', '/checkout', '/jeu', '/conseil']

export function isExcludedPath(pathname: string | null | undefined): boolean {
  if (!pathname) return true
  if (EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true
  // Fiche produit (/products/<handle>), pas le catalogue /products
  return /^\/products\/[^/]+/.test(pathname)
}

/**
 * Valeur du drapeau → déjà vu il y a moins de 30 jours ? L'ancien drapeau
 * « 1 » (sans date, avant le 08/10/2026) compte comme vu récemment : le
 * composant le remplace par la date du jour pour ne pas réafficher le bandeau
 * à tous les anciens visiteurs d'un coup.
 */
export function seenRecently(raw: string | null, now: number): boolean {
  if (!raw) return false
  if (raw === '1') return true
  const at = Number(raw)
  return Number.isFinite(at) && now - at < NEWSLETTER_COOLDOWN_MS
}

/** Le délai ne s'arme qu'à partir de la 2ᵉ page vue de la visite. */
export function timerAllowed(pageViews: number): boolean {
  return pageViews >= 2
}
