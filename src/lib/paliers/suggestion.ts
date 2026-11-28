// Suggestion d'un article pour atteindre le prochain palier du tiroir panier
// (28/11/2026). Pur, sans réseau : testé dans suggestion.test.ts.
//
// - Livraison offerte, s'il manque 5 € ou moins : le moins cher des articles
//   qui font atteindre le seuil, sinon le moins cher.
// - Palier cadeau, s'il manque 15 € ou moins : le moins cher des articles de
//   la base des cadeaux (collection de la remise Shopify) qui font atteindre le
//   palier ; base inconnue ou aucun article suffisant : pas de suggestion.
// L'article est en stock (filtré par /api/cross-sell), mono-variante (ajout
// direct), pas déjà au panier, jamais le cadeau d'une période en cours ou à
// venir (acheté, il serait absorbé par la remise et le panier n'avancerait
// pas), jamais une canette (pas de canette dans les colis ; dans le doute, une
// boisson est exclue, voir estCanette), ni un pack, ni une marque exclue des
// blocs automatiques (lib/merchandising).

import { isAutoPromotable, type Family } from '@/lib/merchandising'
import { prochainPalier, type EtatPalier, type Palier, type Periode } from './index'

/** Écart maximal (en euros) pour proposer un article. */
export const ECART_MAX: Record<Palier['type'], number> = { livraison: 5, cadeau: 15 }

export interface ArticleSuggerable {
  handle: string
  title: string
  price: string
  variantId: string | null
  /** Identifiant numérique du produit (base des cadeaux). */
  productId?: string
  family?: Family
  vendor?: string | null
}

export interface Suggestion<T> {
  article: T
  palier: EtatPalier
  /** L'article suffit à atteindre le palier (sinon il en rapproche seulement). */
  suffit: boolean
}

/** Variantes cadeaux de toutes les périodes en cours ou à venir à `now`. */
export function variantesCadeaux(periodes: Pick<Periode, 'au' | 'paliers'>[], now: Date): Set<string> {
  const t = now.getTime()
  return new Set(
    periodes
      .filter((p) => p.au === null || Date.parse(p.au) >= t)
      .flatMap((p) => p.paliers)
      .flatMap((palier) => (palier.variantes ?? []).map((v) => v.id))
  )
}

const prix = (a: ArticleSuggerable) => Number(a.price)

/** Volume en ml lu dans le titre (« 330 ml », « 33 cl », « 0,5 L »), null si absent. */
function volumeMl(titre: string): number | null {
  const m = titre.match(/(\d+(?:[.,]\d+)?)\s*(ml|cl|l)\b/i)
  if (!m) return null
  const n = Number(m[1].replace(',', '.'))
  const unite = m[2].toLowerCase()
  return unite === 'ml' ? n : unite === 'cl' ? n * 10 : n * 1000
}

/**
 * Canette, jamais dans un colis (règle du métachamp des paliers). Dans le doute,
 * exclue : une boisson ne passe que si on la sait autre chose qu'une canette
 * (shot, pastilles, poudre, brique, bouteille, ou moins de 250 ml).
 */
export function estCanette(a: { title: string; family?: Family }): boolean {
  if (/canette|\bcans?\b/i.test(a.title)) return true
  if (a.family !== 'boisson') return false
  if (/\bshots?\b|pastille|comprim|tablet|poudre|brique|bouteille/i.test(a.title)) return false
  const ml = volumeMl(a.title)
  return ml === null || ml >= 250
}

function suggerable(a: ArticleSuggerable, panier: ReadonlySet<string>, cadeaux: ReadonlySet<string>): boolean {
  return (
    !!a.variantId &&
    prix(a) > 0 &&
    !panier.has(a.handle) &&
    !cadeaux.has(a.variantId) &&
    a.family !== 'pack' &&
    !estCanette(a) &&
    isAutoPromotable(a)
  )
}

export function choisirSuggestion<T extends ArticleSuggerable>({
  etats,
  candidats,
  handlesPanier,
  variantesCadeaux: cadeaux,
  baseCadeau,
}: {
  etats: EtatPalier[]
  candidats: T[]
  handlesPanier: ReadonlySet<string>
  /** Variantes cadeaux en cours ou à venir ; null = inconnues : aucune suggestion. */
  variantesCadeaux: ReadonlySet<string> | null
  /** Produits (identifiants numériques) qui comptent pour un palier cadeau ; null = inconnu. */
  baseCadeau: (palier: Palier) => ReadonlySet<string> | null
}): Suggestion<T> | null {
  if (!cadeaux) return null
  const palier = prochainPalier(etats)
  if (!palier || palier.reste <= 0 || palier.reste > ECART_MAX[palier.palier.type]) return null

  let pool = candidats.filter((a) => suggerable(a, handlesPanier, cadeaux))
  if (palier.palier.type === 'cadeau') {
    const base = baseCadeau(palier.palier)
    if (!base) return null
    pool = pool.filter((a) => !!a.productId && base.has(a.productId))
  }
  // Moins cher d'abord ; à prix égal, ordre stable (handle).
  pool = [...new Map(pool.map((a) => [a.handle, a])).values()].sort((a, b) => prix(a) - prix(b) || a.handle.localeCompare(b.handle))

  const suffisant = pool.find((a) => prix(a) + 0.005 >= palier.reste)
  if (suffisant) return { article: suffisant, palier, suffit: true }
  if (palier.palier.type === 'cadeau' || pool.length === 0) return null
  return { article: pool[0], palier, suffit: false }
}
