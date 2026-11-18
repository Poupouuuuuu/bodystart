// Sous-titre court des cartes produit (sous le nom). Avant le 08/10/2026 :
// la 1re étiquette Shopify « lisible », d'où « Caseine » sur une whey,
// « Creme-de-riz », « Glucides » en double avec la catégorie, voire une
// étiquette interne. Désormais : une liste blanche d'étiquettes, chacune avec
// un libellé propre en français, dans un ordre de priorité fixe ; en cas de
// doute, rien. Libellés descriptifs uniquement (forme, ingrédient), jamais
// d'allégation.

// Conditions :
// - 'vegetale' : seulement sur une Protéine ;
// - 'type-whey' : type de whey porté par sa propre étiquette (isolate,
//   clear-whey : une seule étiquette de sous-catégorie par produit depuis le
//   18/11/2026, la whey n'y est plus), jamais sur une protéine végétale ;
// - 'whey' : type de whey qui exige aussi l'étiquette whey (concentre).
type Regle = [tag: string, label: string, condition?: 'whey' | 'type-whey' | 'vegetale']

const LABELS: Regle[] = [
  // Protéines végétales d'abord : « isolate » sur une protéine vegan n'est pas une whey.
  ['vegan', 'Protéine végétale', 'vegetale'],
  // Mix avant isolate : un mélange de protéines n'est pas une whey isolat,
  // même s'il porte encore l'étiquette isolate.
  ['mix', 'Mix de protéines'],
  ['clear-whey', 'Whey claire', 'type-whey'],
  ['clear whey', 'Whey claire', 'type-whey'],
  ['isolate', 'Whey isolat', 'type-whey'],
  ['concentre', 'Whey concentrée', 'whey'],
  ['gainer', 'Gainer'],
  ['monohydrate', 'Créatine monohydrate'],
  ['eaa', 'Acides aminés essentiels'],
  ['bcaa', 'BCAA'],
  // Arginine avant citrulline : la L-Arginine porte aussi l'étiquette
  // citrulline (rangée sous Citrulline au catalogue, demande Boutique du 18/11/2026).
  ['arginine', 'Arginine'],
  ['citrulline', 'Citrulline'],
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

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

/** Le nom contient déjà le libellé, à partir d'un début de mot (« Shadowhey
 *  Isolate » ne contient pas « whey isolat »). */
const dansLeNom = (title: string, label: string) => ` ${title}`.includes(` ${norm(label)}`)

interface Contexte {
  /** Catégorie affichée au-dessus du nom : jamais répétée. */
  category?: string | null
  /** Nom du produit : un sous-titre qu'il contient déjà n'apporte rien. */
  title?: string | null
  productType?: string | null
}

/** Libellé propre, ou null. */
export function productSubtitle(tags: string[] | null | undefined, ctx: Contexte = {}): string | null {
  const have = new Set((tags ?? []).map((t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()))
  const category = ctx.category ? norm(ctx.category) : null
  const title = ctx.title ? norm(ctx.title) : ''
  const proteines = ctx.productType ? norm(ctx.productType) === 'proteines' : false
  const vegetale = have.has('vegan')
  for (const [tag, label, condition] of LABELS) {
    if (!have.has(tag)) continue
    if (condition === 'vegetale' && !proteines) continue
    if (condition === 'type-whey' && vegetale) continue
    if (condition === 'whey' && (vegetale || !have.has('whey'))) continue
    if (norm(label) === category || dansLeNom(title, label)) return null
    return label
  }
  return null
}

/**
 * Type de whey d'après les étiquettes (claire, isolat, concentrée), pour la
 * pastille de la fiche. null si le produit est végétal ou un mix, si le type
 * n'est pas précisé, ou si le nom le dit déjà. Isolat et claire se lisent sur
 * leur seule étiquette (plus d'étiquette whey sur eux depuis le 18/11/2026) ;
 * concentrée exige l'étiquette whey.
 * Avant le 08/10/2026, toute whey recevait « Whey isolat » (Whey Native
 * Protimuscle comprise).
 */
export function wheyLabel(tags: string[] | null | undefined, title?: string | null): string | null {
  const have = new Set((tags ?? []).map((t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()))
  if (have.has('vegan') || have.has('mix')) return null
  const t = title ? norm(title) : ''
  for (const [tag, label, condition] of LABELS) {
    if (!have.has(tag)) continue
    if (condition === 'type-whey' || (condition === 'whey' && have.has('whey'))) {
      return dansLeNom(t, label) ? null : label
    }
  }
  return null
}
