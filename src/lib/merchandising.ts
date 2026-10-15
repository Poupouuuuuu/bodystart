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

/** Empreinte stable d'une chaîne (FNV-1a 32 bits) : même fiche, même choix. */
function empreinte(s: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/**
 * Suggestions pour un produit affiché : produits des familles complémentaires,
 * marques exclues retirées, disponibles, UN SEUL par famille, dans l'ordre de
 * préférence des familles. Moins de `n` résultats plutôt que deux produits de
 * la même famille (relecture du 08/10/2026 : deux créatines proposées sous une
 * whey) ou un concurrent.
 *
 * `parmi` : le produit de chaque famille est pris parmi ses `parmi` meilleures
 * ventes (ordre du pool), selon une empreinte de la fiche affichée. Stable d'un
 * rendu à l'autre, mais varié d'une fiche à l'autre (SEO 2 : avec 1, toutes
 * les wheys proposaient les 4 mêmes produits). Par défaut 1 : la meilleure
 * vente de chaque famille.
 */
export function pickComplements<T extends Candidate>(current: Candidate, pool: T[], n = 4, parmi = 1): T[] {
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
    const list = byFamily.get(f) ?? []
    const choix = Math.min(list.length, Math.max(1, parmi))
    const p = choix > 0 ? list[empreinte(`${current.handle}|${f}`) % choix] : undefined
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
