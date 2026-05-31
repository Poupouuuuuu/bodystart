/**
 * Helper pour acceder a l'URL canonique du site, injectee via
 * NEXT_PUBLIC_SITE_URL (env Vercel). Le domaine final n'est pas
 * tranche en mai 2026 : on n'inscrit JAMAIS d'URL en dur dans le code.
 *
 * Exemples valeurs possibles :
 *   - "https://bodystart.vercel.app" (preview)
 *   - "https://bodystart-nutrition.fr" (prod future)
 *   - "" (dev local sans config, on degrade proprement)
 */

export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL ?? ''
  return raw.replace(/\/$/, '')
}

export function getSiteDomain(): string {
  const url = getSiteUrl()
  return url.replace(/^https?:\/\//, '')
}
