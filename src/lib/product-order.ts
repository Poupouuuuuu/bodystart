/**
 * Ordre d'affichage produits — règle transverse boutique (décision Adam 2026-07) :
 * les produits épuisés vont TOUJOURS en fin de liste, quel que soit le tri
 * choisi. Un « Épuisé » en haut de grille fait fouiller le client et donne
 * une impression de boutique mal tenue.
 *
 * Partition STABLE et non mutante : l'ordre relatif de chaque groupe est
 * conservé (ex. base BEST_SELLING → les disponibles restent classés par
 * meilleures ventes, les épuisés aussi, mais derrière).
 *
 * `availableForSale` est optionnel sur ShopifyProduct : seul `false` est
 * traité comme épuisé (undefined = info absente → considéré disponible).
 */
export function availableFirst<T extends { availableForSale?: boolean }>(items: T[]): T[] {
  const available: T[] = []
  const soldOut: T[] = []
  for (const item of items) {
    if (item.availableForSale === false) soldOut.push(item)
    else available.push(item)
  }
  return [...available, ...soldOut]
}
