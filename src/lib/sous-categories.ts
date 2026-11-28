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

/**
 * Pastilles de chaque rayon, par clé de rayon (= `?cat=` de /products = slug
 * de /categories/[slug]). Source unique du catalogue et des pages catégorie
 * (déplacées depuis ProductsPageClient le 28/11/2026, contenu inchangé).
 * Sous-catégories Protéines du 18/11/2026 (Gestion et Boutique) ; caséine
 * retirée (plus en rayon depuis le 25/10/2026).
 */
export const SOUS_CATEGORIES = {
  proteines: [
    { key: 'whey', label: 'Whey', tags: ['whey'] },
    { key: 'isolate', label: 'Isolate', tags: ['isolate'] },
    { key: 'mix', label: 'Mix', tags: ['mix'] },
    { key: 'clear-whey', label: 'Clear whey', tags: ['clear-whey'] },
    { key: 'gainer', label: 'Gainer', tags: ['gainer'] },
    { key: 'vegetale', label: 'Végétale et œuf', tags: ['vegan', 'oeuf'] },
  ],
  glucides: [{ key: 'riz', label: 'Riz', tags: ['riz'] }],
  creatine: [{ key: 'monohydrate', label: 'Monohydrate', tags: ['monohydrate'] }],
  'acides-amines': [
    { key: 'bcaa', label: 'BCAA', tags: ['bcaa'] },
    { key: 'eaa', label: 'EAA', tags: ['eaa'] },
    { key: 'glutamine', label: 'Glutamine', tags: ['glutamine'] },
    { key: 'citrulline', label: 'Citrulline', tags: ['citrulline'] },
    { key: 'beta-alanine', label: 'Bêta-alanine', tags: ['beta-alanine'] },
  ],
  bruleurs: [
    { key: 'carnitine', label: 'Carnitine', tags: ['carnitine'] },
    { key: 'cla', label: 'CLA', tags: ['cla'] },
    { key: 'thermo-draineur', label: 'Formules complètes', tags: ['thermo', 'draineur'] },
  ],
  boosters: [
    { key: 'pump', label: 'Pump', tags: ['pump'] },
    { key: 'plantes', label: 'Formules aux plantes', tags: ['testo'] },
  ],
  sante: [
    { key: 'omega', label: 'Oméga', tags: ['omega'] },
    { key: 'vitamine', label: 'Vitamines', tags: ['vitamine'] },
    { key: 'multivitamine', label: 'Multivitamines', tags: ['multivitamine'] },
    { key: 'collagene', label: 'Collagène', tags: ['collagene'] },
    { key: 'magnesium', label: 'Magnésium', tags: ['magnesium'] },
    { key: 'zinc', label: 'Zinc', tags: ['zinc'] },
    { key: 'mineraux', label: 'Minéraux', tags: ['mineraux'] },
    { key: 'electrolytes', label: 'Électrolytes', tags: ['electrolytes'] },
  ],
} satisfies Record<string, SousCategorie[]>

/** Ordre de priorité d'un rayon (pastilles exclusives), s'il en a un. */
export const PRIORITES: Partial<Record<string, readonly string[]>> = { proteines: PRIORITE_PROTEINES }

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
