// Sous-titre court des cartes produit (sous le nom). Avant le 08/10/2026 :
// la 1re étiquette Shopify « lisible », d'où « Caseine » sur une whey,
// « Creme-de-riz », « Glucides » en double avec la catégorie, voire une
// étiquette interne. Désormais : une liste blanche d'étiquettes, chacune avec
// un libellé propre, dans un ordre de priorité fixe ; sinon rien.
// Libellés descriptifs uniquement (forme, ingrédient), jamais d'allégation.

const LABELS: [tag: string, label: string][] = [
  ['clear-whey', 'Whey claire'],
  ['clear whey', 'Whey claire'],
  ['isolate', 'Whey isolate'],
  ['concentre', 'Whey concentrée'],
  ['gainer', 'Gainer'],
  ['monohydrate', 'Créatine monohydrate'],
  ['eaa', 'Acides aminés essentiels'],
  ['bcaa', 'BCAA'],
  ['citrulline', 'Citrulline'],
  ['arginine', 'Arginine'],
  ['glutamine', 'Glutamine'],
  ['beta-alanine', 'Bêta-alanine'],
  ['creme-de-riz', 'Crème de riz'],
  ['electrolytes', 'Électrolytes'],
  ['magnesium', 'Magnésium'],
  ['omega', 'Oméga 3'],
  ['vitamine-d', 'Vitamine D'],
  ['multivitamine', 'Multivitamines'],
  ['multivitamines', 'Multivitamines'],
  ['collagene', 'Collagène'],
  ['carnitine', 'L-carnitine'],
  ['l-carnitine', 'L-carnitine'],
  ['cla', 'CLA'],
  ['flapjack', 'Flapjack'],
  ['cookie', 'Cookie protéiné'],
  ['pancake', 'Mix à pancakes'],
  ['muesli', 'Muesli protéiné'],
  ['pret-a-boire', 'Prêt à boire'],
  ['shaker', 'Shaker'],
  ['sans-stimulant', 'Sans stimulant'],
  ['sans cafeine', 'Sans caféine'],
]

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** Libellé propre, ou null. Jamais identique à la catégorie affichée au-dessus. */
export function productSubtitle(tags: string[] | null | undefined, categoryLabel?: string | null): string | null {
  const have = new Set((tags ?? []).map(norm))
  const category = categoryLabel ? norm(categoryLabel) : null
  for (const [tag, label] of LABELS) {
    if (have.has(tag) && norm(label) !== category) return label
  }
  return null
}
