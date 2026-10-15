// ============================================================
// Coffrets de Noël (périmètre validé par Claude Gestion le 15/10/2026)
// ============================================================
// Produits Shopify tagués `coffret-noel` : coffrets fixes (variantes à
// composants, requiresComponents = true). Page /coffrets-noel et bloc de
// l'accueil affichés du 2 novembre au 24 décembre inclus, heure de Paris,
// chaque année. Hors période, la page répond 404 et le bloc disparaît ; les
// fiches restent en vente tant que Shopify les publie.
//
// Pur, sans réseau. Testé dans coffrets.test.ts.

export const COFFRETS_TAG = 'coffret-noel'
export const COFFRETS_CHEMIN = '/coffrets-noel'
export const COFFRETS_LIBELLE = 'Coffrets de Noël'

/** Vrai si le produit est un coffret de Noël (tag Shopify, casse ignorée). */
export function estCoffret(product: { tags?: string[] | null }): boolean {
  return (product.tags ?? []).some((t) => t.trim().toLowerCase() === COFFRETS_TAG)
}

const jourDeParis = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Paris',
  month: 'numeric',
  day: 'numeric',
})

/** Période d'affichage : du 2 novembre 00:00 au 24 décembre 23:59, heure de Paris. */
export function coffretsVisibles(now: Date): boolean {
  const parts = jourDeParis.formatToParts(now)
  const mois = Number(parts.find((p) => p.type === 'month')?.value)
  const jour = Number(parts.find((p) => p.type === 'day')?.value)
  return (mois === 11 && jour >= 2) || (mois === 12 && jour <= 24)
}

/**
 * Date de référence : maintenant, ou celle de `?coffrets_date=` hors
 * production (vérifier la page et le bloc sur la preview avant le 2 novembre).
 * Ignorée en production.
 */
export function dateCoffrets(forcee: string | string[] | undefined, env: string | undefined, now = new Date()): Date {
  if (env === 'production' || typeof forcee !== 'string') return now
  const t = Date.parse(forcee)
  return Number.isNaN(t) ? now : new Date(t)
}
