// ============================================================
// Sous-catégories du catalogue (pastilles de /products)
// ============================================================
// Un produit est rangé sous une sous-catégorie quand il porte l'une de ses
// étiquettes Shopify (casse et accents ignorés).
//
// Pastilles exclusives (Protéines, décision du 21/11/2026, Agent Digital et
// Boutique) : les étiquettes restent descriptives (une clear whey isolate
// porte whey, isolate et clear-whey ; la recherche du site s'en sert), et le
// produit n'apparaît que sous la première sous-catégorie de l'ordre de
// priorité qu'il porte. Retirer les étiquettes en trop aurait sorti 4 fiches
// de la recherche « whey » et 6 acides aminés de « pump » (mesuré le
// 21/11/2026 sur le catalogue réel).
//
// Pur, sans réseau. Testé dans sous-categories.test.ts.

export interface SousCategorie {
  key: string
  label: string
  tags: string[]
}

/** Ordre de priorité des pastilles Protéines (la première portée l'emporte). */
export const PRIORITE_PROTEINES = ['vegetale', 'mix', 'clear-whey', 'isolate', 'gainer', 'whey'] as const

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

/**
 * Clés des sous-catégories d'un produit. Sans `priorite` : toutes celles dont
 * il porte une étiquette. Avec `priorite` : la première de cet ordre, seule ;
 * une sous-catégorie absente de l'ordre reste cumulable (aucune ne l'est
 * aujourd'hui, l'ordre Protéines les liste toutes).
 */
export function sousCategoriesDe(
  tags: readonly string[] | null | undefined,
  sousCategories: readonly SousCategorie[],
  priorite?: readonly string[]
): string[] {
  const portees = new Set((tags ?? []).map(norm))
  const cles = sousCategories.filter((s) => s.tags.some((t) => portees.has(norm(t)))).map((s) => s.key)
  if (!priorite) return cles
  const premiere = priorite.find((k) => cles.includes(k))
  const horsOrdre = cles.filter((k) => !priorite.includes(k))
  return premiere ? [premiere, ...horsOrdre] : horsOrdre
}

/** Le produit apparaît-il sous la pastille `cle` ? */
export function dansSousCategorie(
  tags: readonly string[] | null | undefined,
  cle: string,
  sousCategories: readonly SousCategorie[],
  priorite?: readonly string[]
): boolean {
  return sousCategoriesDe(tags, sousCategories, priorite).includes(cle)
}
