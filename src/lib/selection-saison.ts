// Sélection de saison de l'accueil (déco Halloween du 19/10/2026) : les packs
// de la collection `packs` d'abord, puis des vedettes de l'accueil
// (lib/vedettes) qui ne sont pas déjà dans le bloc « Ce qui part vite ».
// Produits en stock seulement. Aucune promo inventée : prix Shopify.

/** Nombre de cartes du bloc « Ce qui part vite » de l'accueil (BestSellersV3). */
export const MEILLEURES_VENTES_AFFICHEES = 5

interface Candidat {
  handle: string
  availableForSale?: boolean
}

/**
 * Les packs (en stock, `maxPacks` au plus) et des meilleures ventes (en stock,
 * ni pack ni déjà dans le bloc « Meilleures ventes », `maxProduits` au plus).
 * Moins de 4 au total : rien (la section n'est pas affichée plutôt que de
 * montrer une grille à moitié vide).
 */
export function composerSelection<T extends Candidat>(
  packs: T[],
  meilleures: T[],
  dejaAffiches: string[],
  { maxPacks = 3, maxProduits = 3 }: { maxPacks?: number; maxProduits?: number } = {}
): { packs: T[]; produits: T[] } {
  const enStock = (p: T) => p.availableForSale !== false
  const choisis = packs.filter(enStock).slice(0, maxPacks)
  const pris = new Set([...packs.map((p) => p.handle), ...dejaAffiches])
  const produits: T[] = []
  for (const p of meilleures) {
    if (produits.length >= maxProduits) break
    if (!enStock(p) || pris.has(p.handle)) continue
    produits.push(p)
    pris.add(p.handle)
  }
  return choisis.length + produits.length >= 4 ? { packs: choisis, produits } : { packs: [], produits: [] }
}
