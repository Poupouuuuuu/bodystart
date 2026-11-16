// ============================================================
// Variantes masquées sur le site (décision du 16/11/2026)
// ============================================================
// Format arrêté (ex. Whey Native Protimuscle 500 g) : la variante reste dans
// Shopify (caisse, historique, commandes), mais le site ne la montre plus une
// fois épuisée. Pilotage : metafield de variante `bodystart.masquer_site`
// (booléen, définition avec accès Storefront en lecture), posé par l'Agent
// Digital ou Claude Gestion.
//
// Règle : masquée = metafield à true ET variante non achetable en ligne
// (availableForSale de l'API Storefront : stock des emplacements de vente en
// ligne, jamais celui des dépôts). Revenue en stock, elle réapparaît.
//
// Appliqué à la lecture des produits (lib/shopify) : fiche et sélecteur de
// saveurs et formats, lien ?variant=, prix « dès » des cartes, JSON-LD,
// recherche ; et dans le flux Merchant (google-feed.xml).
//
// Pur, sans réseau. Testé dans variantes-masquees.test.ts.

/** Champ GraphQL (Storefront et Admin) à ajouter aux variantes lues. */
export const CHAMP_MASQUE = `masque: metafield(namespace: "bodystart", key: "masquer_site") { value }`

export interface VarianteMasquable {
  availableForSale?: boolean
  masque?: { value: string } | null
}

/** Masquée : metafield à true et non achetable en ligne. */
export function estMasquee(v: VarianteMasquable): boolean {
  return v.masque?.value === 'true' && v.availableForSale === false
}

/**
 * Variantes à montrer. Si toutes seraient masquées, la liste reste entière :
 * une fiche n'a jamais zéro variante (elle s'affiche alors épuisée).
 */
export function variantesVisibles<V extends VarianteMasquable>(variantes: readonly V[]): V[] {
  const visibles = variantes.filter((v) => !estMasquee(v))
  return visibles.length ? visibles : [...variantes]
}
