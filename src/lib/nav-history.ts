/**
 * Suivi des navigations INTERNES (soft navigations App Router) du document
 * courant. Compteur en mémoire module : il repart à zéro à chaque chargement
 * complet de page — c'est voulu, c'est ce qui rend le signal fiable.
 *
 * Pourquoi : `window.history.length > 1` est vrai même quand la page
 * précédente est Google/Instagram — un « ← Retour » basé dessus éjectait le
 * visiteur HORS du site depuis les fiches produit (nos landing pages SEO).
 * `document.referrer` ne se met pas à jour lors des navigations client → pas
 * fiable non plus. Ici : si au moins UNE navigation interne a eu lieu depuis
 * le chargement du document, l'entrée précédente de l'historique est
 * forcément une page du site → back() est sûr.
 */

let internalNavCount = 0
let lastPathname: string | null = null

/** À appeler à chaque changement de pathname (cf. NavigationTracker). Le
 *  dédoublonnage par pathname absorbe le double-effet StrictMode en dev. */
export function recordNavigation(pathname: string): void {
  if (pathname === lastPathname) return
  lastPathname = pathname
  internalNavCount++
}

/** true ⇔ la page précédente de l'historique est une page du site. */
export function hasInternalHistory(): boolean {
  return internalNavCount > 1
}
