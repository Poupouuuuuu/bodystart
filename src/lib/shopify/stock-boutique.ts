// Stock d'une variante dans une boutique (fiche produit, Click & Collect).
//
// Produit composé (pack, coffret : requiresComponents = true) : le parent n'a
// pas de quantité propre à l'emplacement (niveau vide dans l'API Admin).
// Shopify calcule `sellableOnlineQuantity` sur le composant le moins
// disponible (quantité par coffret comprise) des emplacements qui servent la
// vente en ligne, aujourd'hui BodyStart Coignières seule : les dépôts n'en
// font pas partie (cf. disponibilite.ts). Constaté le 15/10/2026 : Coffret
// Gourmand 5, comme la Crunch Bar Dark Chocolate PB à Coignières (17 en tout,
// dépôt GymCoach compris). À revoir si une 2ᵉ boutique vend en ligne : ce
// nombre ne serait plus celui d'un seul magasin.

export interface VarianteStock {
  id: string
  title: string
  requiresComponents?: boolean | null
  sellableOnlineQuantity?: number | null
  inventoryItem: {
    inventoryLevels: {
      nodes: { location: { id: string }; quantities: { name: string; quantity: number }[] }[]
    }
  }
}

export function stockBoutique(variante: VarianteStock, locationId: string): number {
  if (variante.requiresComponents) return Math.max(0, variante.sellableOnlineQuantity ?? 0)
  const niveau = variante.inventoryItem.inventoryLevels.nodes.find((l) => l.location.id === locationId)
  return niveau?.quantities.find((q) => q.name === 'available')?.quantity ?? 0
}
