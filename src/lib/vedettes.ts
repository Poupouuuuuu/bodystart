// Produits mis en avant sur l'accueil (bloc « Ce qui part vite chez nous » et
// sélection de saison), règle de Claude Gestion du 19/10/2026 :
// - la liste du metafield boutique `bodystart.accueil_vedettes` fait foi, dans
//   son ordre, produits publiés sur le site et en stock seulement (les marques
//   exclues des blocs automatiques y sont admises : choix explicite) ;
// - s'il en manque, complément par les meilleures ventes en chiffre d'affaires
//   sur 60 jours, hors boissons, barres, snacks, accessoires, packs et produits
//   à moins de 20 €, marques exclues retirées (bloc automatique).
// Pur et sans dépendance serveur (testé).

import { familyOf, isAutoPromotable } from './merchandising'

/** Types Shopify jamais pris en complément (pas ce qu'on vient chercher sur le site). */
export const TYPES_HORS_COMPLEMENT = ['Boissons', 'Barres protéinées', 'Snacks', 'Accessoires'] as const

/** Prix minimal d'un produit de complément, en euros. */
export const PRIX_MIN_COMPLEMENT = 20

const HANDLE = /^[a-z0-9][a-z0-9-]{0,254}$/
const MAX_VEDETTES = 24

/** Handles du metafield (JSON `{ handles: [...] }`), dans l'ordre, sans doublon ; [] si illisible. */
export function lireVedettes(value: string | null | undefined): string[] {
  if (!value) return []
  let brut: unknown
  try {
    brut = JSON.parse(value)
  } catch {
    return []
  }
  const handles = (brut as { handles?: unknown } | null)?.handles
  if (!Array.isArray(handles)) return []
  const vus = new Set<string>()
  for (const h of handles) {
    if (typeof h === 'string' && HANDLE.test(h) && !vus.has(h)) vus.add(h)
    if (vus.size >= MAX_VEDETTES) break
  }
  return [...vus]
}

interface Candidat {
  handle: string
  vendor?: string | null
  productType?: string | null
  tags?: string[] | null
  availableForSale?: boolean
  priceRange?: { minVariantPrice?: { amount: string } | null } | null
}

const norm = (s?: string | null) =>
  (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const TYPES_EXCLUS = new Set(TYPES_HORS_COMPLEMENT.map(norm))

const enStock = (p: Candidat) => p.availableForSale !== false

/** Un produit peut-il compléter les vedettes ? */
export function eligibleComplement(p: Candidat): boolean {
  const prix = parseFloat(p.priceRange?.minVariantPrice?.amount ?? '0')
  return (
    enStock(p) &&
    isAutoPromotable(p) &&
    !TYPES_EXCLUS.has(norm(p.productType)) &&
    familyOf(p) !== 'pack' &&
    norm(p.productType) !== 'coffret' &&
    prix >= PRIX_MIN_COMPLEMENT
  )
}

/**
 * Vedettes en stock dans l'ordre du metafield (null = non publié sur le site,
 * retiré), puis complément jusqu'à `places` produits au moins.
 */
export function composerVedettes<T extends Candidat>(
  vedettes: (T | null | undefined)[],
  complement: T[],
  places: number
): T[] {
  const out: T[] = []
  const pris = new Set<string>()
  for (const p of vedettes) {
    if (!p || !enStock(p) || pris.has(p.handle)) continue
    out.push(p)
    pris.add(p.handle)
  }
  for (const p of complement) {
    if (out.length >= places) break
    if (pris.has(p.handle) || !eligibleComplement(p)) continue
    out.push(p)
    pris.add(p.handle)
  }
  return out
}
