// Sélection de saison de l'accueil (déco Halloween du 19/10/2026) : les packs
// de la collection `packs` d'abord, puis des meilleures ventes qui ne sont pas
// déjà dans le bloc « Meilleures ventes » juste en dessous. Produits en stock
// seulement. Aucune promo inventée : les cartes affichent les prix Shopify.

/** Nombre de cartes du bloc « Meilleures ventes » de l'accueil (BestSellersV3). */
export const MEILLEURES_VENTES_AFFICHEES = 5

interface Candidat {
  handle: string
  availableForSale?: boolean
}

/**
 * Jusqu'à `max` produits : `maxPacks` packs au plus, complétés par les
 * meilleures ventes. Moins de 4 au total : rien (la section n'est pas
 * affichée plutôt que de montrer une grille à moitié vide).
 */
export function composerSelection<T extends Candidat>(
  packs: T[],
  meilleures: T[],
  dejaAffiches: string[],
  { max = 6, maxPacks = 4 }: { max?: number; maxPacks?: number } = {}
): T[] {
  const enStock = (p: T) => p.availableForSale !== false
  const choisis = packs.filter(enStock).slice(0, maxPacks)
  const pris = new Set([...choisis.map((p) => p.handle), ...dejaAffiches])
  for (const p of meilleures) {
    if (choisis.length >= max) break
    if (!enStock(p) || pris.has(p.handle)) continue
    choisis.push(p)
    pris.add(p.handle)
  }
  return choisis.length >= 4 ? choisis : []
}
