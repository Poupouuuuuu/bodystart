// Prix affiché sur les cartes produit (catalogue, accueil, suggestions).
//
// Règles (08/10/2026, relecture des PR) :
// - le prix est celui de la variante EN STOCK la moins chère (sinon, produit
//   épuisé : la moins chère de toutes) ; « dès » si les variantes proposées
//   n'ont pas toutes le même prix ;
// - une remise ne s'affiche que si CETTE variante a un prix barré supérieur à
//   son prix. Avant : prix minimum d'une variante et prix barré d'une autre,
//   d'où une fausse remise (Tri Source Vegan « -30 % », 25,90 € / 73,90 €).
// Pur, utilisé côté serveur (lib/shopify) et dans les composants.

export interface Money {
  amount: string
  currencyCode: string
}

export interface PrixVariante {
  availableForSale: boolean
  price: Money
  compareAtPrice: Money | null
}

export interface CardPrice {
  price: Money
  /** Prix barré de la MÊME variante, seulement s'il y a une vraie remise. */
  compareAt: Money | null
  discountPct: number | null
  /** Les variantes proposées n'ont pas toutes le même prix : afficher « dès ». */
  from: boolean
}

const num = (m: Money) => parseFloat(m.amount)

/** Remise d'une variante (prix barré > prix), arrondie ; null sinon. */
export function discountPctOf(v: Pick<PrixVariante, 'price' | 'compareAtPrice'>): number | null {
  if (!v.compareAtPrice) return null
  const was = num(v.compareAtPrice)
  const now = num(v.price)
  if (!(was > now) || !(was > 0)) return null
  const pct = Math.round(((was - now) / was) * 100)
  return pct > 0 ? pct : null
}

export function computeCardPrice(variants: PrixVariante[] | null | undefined): CardPrice | null {
  const all = (variants ?? []).filter((v) => v?.price && Number.isFinite(num(v.price)))
  if (all.length === 0) return null
  const pool = all.some((v) => v.availableForSale) ? all.filter((v) => v.availableForSale) : all
  const cheapest = pool.reduce((a, b) => (num(b.price) < num(a.price) ? b : a))
  const pct = discountPctOf(cheapest)
  return {
    price: cheapest.price,
    compareAt: pct ? cheapest.compareAtPrice : null,
    discountPct: pct,
    from: pool.some((v) => num(v.price) !== num(cheapest.price)),
  }
}

/**
 * Prix de carte d'un produit : celui calculé côté serveur sur TOUTES les
 * variantes (lib/shopify), sinon calculé sur les variantes disponibles.
 */
export function cardPriceOf(p: {
  cardPrice?: CardPrice | null
  variants?: { nodes: PrixVariante[] }
}): CardPrice | null {
  return p.cardPrice ?? computeCardPrice(p.variants?.nodes)
}
