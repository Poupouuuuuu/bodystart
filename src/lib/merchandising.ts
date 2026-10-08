// ============================================================
// Mise en avant automatique (best-sellers, suggestions, panier)
// ============================================================
// Règles du 08/10/2026 :
// - les blocs AUTOMATIQUES (best-seller de l'accueil, « Ce qui part vite »,
//   suggestions sous une fiche, « Complète ta commande ») ne mettent jamais en
//   avant les marques exclues ci-dessous. Elles restent au catalogue.
// - une suggestion n'est jamais un produit CONCURRENT du produit affiché (pas
//   de whey sous une whey) : on propose ce qui va avec (créatine, shaker,
//   crème de riz, collation…).
// Pur et sans dépendance serveur : utilisé aussi par le tiroir panier.

/** Marques jamais mises en avant automatiquement. */
export const EXCLUDED_AUTO_VENDORS = ['Eric Favre', 'French Nutrition'] as const

/** Carte « Best-seller » de l'accueil, choisie à la main (08/10/2026). */
export const HOME_FEATURED_HANDLE = 'whey-native-protimuscle'

const norm = (s?: string | null) =>
  (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const EXCLUDED = new Set(EXCLUDED_AUTO_VENDORS.map(norm))

export function isAutoPromotable(p: { vendor?: string | null }): boolean {
  return !EXCLUDED.has(norm(p.vendor))
}

export type Family =
  | 'proteine'
  | 'gainer'
  | 'creatine'
  | 'glucides'
  | 'collation'
  | 'acides-amines'
  | 'pre-workout'
  | 'bruleur'
  | 'sante'
  | 'boisson'
  | 'shaker'
  | 'accessoire'
  | 'pack'
  | 'autre'

/** Famille d'un produit, d'après son type Shopify (et l'étiquette pour gainer / shaker). */
export function familyOf(p: { productType?: string | null; tags?: string[] | null }): Family {
  const type = norm(p.productType)
  const tags = (p.tags ?? []).map(norm)
  switch (type) {
    case 'pack':
      return 'pack'
    case 'proteines':
      return tags.includes('gainer') ? 'gainer' : 'proteine'
    case 'creatine':
      return 'creatine'
    case 'glucides':
      return 'glucides'
    case 'barres proteinees':
    case 'snacks':
      return 'collation'
    case 'acides amines':
      return 'acides-amines'
    case 'pre-workout':
    case 'boosters':
      return 'pre-workout'
    case 'bruleur':
      return 'bruleur'
    case 'sante':
      return 'sante'
    case 'boissons':
      return 'boisson'
    case 'accessoires':
      return tags.includes('shaker') ? 'shaker' : 'accessoire'
    default:
      return 'autre'
  }
}

/**
 * Ce qui complète une famille, par ordre de préférence. Jamais la famille
 * elle-même, ni une famille concurrente (gainer sous une whey et inversement).
 */
export const COMPLEMENTS: Record<Family, Family[]> = {
  proteine: ['creatine', 'shaker', 'glucides', 'collation'],
  gainer: ['creatine', 'shaker', 'collation'],
  creatine: ['proteine', 'shaker', 'collation'],
  glucides: ['proteine', 'creatine', 'shaker'],
  collation: ['proteine', 'creatine', 'boisson'],
  'acides-amines': ['creatine', 'proteine', 'shaker'],
  'pre-workout': ['creatine', 'acides-amines', 'shaker'],
  bruleur: ['proteine', 'collation', 'shaker'],
  sante: ['collation', 'creatine', 'proteine'],
  boisson: ['collation', 'creatine', 'proteine'],
  shaker: ['proteine', 'creatine', 'collation'],
  accessoire: ['proteine', 'creatine', 'collation'],
  pack: ['shaker', 'collation', 'creatine'],
  autre: ['proteine', 'creatine', 'collation'],
}

interface Candidate {
  handle: string
  vendor?: string | null
  productType?: string | null
  tags?: string[] | null
  availableForSale?: boolean
}

/**
 * Suggestions pour un produit affiché : produits des familles complémentaires,
 * marques exclues retirées, disponibles, UN SEUL par famille (le mieux vendu,
 * ordre du pool), dans l'ordre de préférence des familles. Moins de `n`
 * résultats plutôt que deux produits de la même famille (relecture du
 * 08/10/2026 : deux créatines proposées sous une whey) ou un concurrent.
 */
export function pickComplements<T extends Candidate>(current: Candidate, pool: T[], n = 4): T[] {
  const wanted = COMPLEMENTS[familyOf(current)]
  const byFamily = new Map<Family, T[]>(wanted.map((f) => [f, []]))
  const seen = new Set<string>([current.handle])
  for (const p of pool) {
    if (seen.has(p.handle) || p.availableForSale === false || !isAutoPromotable(p)) continue
    const list = byFamily.get(familyOf(p))
    if (!list) continue
    list.push(p)
    seen.add(p.handle)
  }
  const out: T[] = []
  for (const f of wanted) {
    const p = byFamily.get(f)?.[0]
    if (p && out.length < n) out.push(p)
  }
  return out
}

/**
 * Best-sellers de l'accueil : marques exclues retirées, carte mise en avant
 * (HOME_FEATURED_HANDLE) en tête si elle est disponible.
 */
export function homeBestSellers<T extends Candidate>(products: T[], featured?: T | null): T[] {
  const list = products.filter((p) => isAutoPromotable(p) && p.handle !== HOME_FEATURED_HANDLE)
  const pinned = featured ?? products.find((p) => p.handle === HOME_FEATURED_HANDLE)
  return pinned && pinned.availableForSale !== false && isAutoPromotable(pinned) ? [pinned, ...list] : list
}
