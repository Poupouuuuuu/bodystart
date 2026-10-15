// Rayon et guides d'une fiche produit (SEO 2, Claude Gestion le 10/10/2026).
//
// - Fil d'Ariane « Accueil > [Rayon] > [Fiche] » : rayon déduit du type
//   Shopify, comme le menu. Page catégorie quand elle existe
//   (lib/categories), sinon le filtre du catalogue (Accessoires, Boissons,
//   Snacks), les packs, ou les coffrets pendant leur période.
// - 1 ou 2 guides par fiche, choisis dans les guides de son rayon d'après ses
//   étiquettes (gainer → guide gainer, isolate → whey ou isolate…).
//
// Pur, sans réseau. Testé dans rayon-fiche.test.ts.

import { CATEGORY_PAGES } from '@/lib/categories'
import { COFFRETS_CHEMIN, COFFRETS_LIBELLE, estCoffret } from '@/lib/coffrets'

export interface Rayon {
  label: string
  href: string
}

interface ProduitRayon {
  title?: string | null
  productType?: string | null
  tags?: string[] | null
}

const norm = (s?: string | null) =>
  (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** Types sans page catégorie : filtre du catalogue, comme le menu. */
const FILTRES_CATALOGUE: Record<string, Rayon> = {
  accessoires: { label: 'Accessoires', href: '/products?cat=accessoires' },
  boissons: { label: 'Boissons', href: '/products?cat=boissons' },
  snacks: { label: 'Snacks', href: '/products?cat=snacks' },
}

const CATALOGUE: Rayon = { label: 'Tous les produits', href: '/products' }

export function rayonDeFiche(p: ProduitRayon, { coffretsOuverts }: { coffretsOuverts: boolean }): Rayon {
  if (estCoffret(p)) return coffretsOuverts ? { label: COFFRETS_LIBELLE, href: COFFRETS_CHEMIN } : CATALOGUE
  const type = norm(p.productType)
  if (type === 'pack') return { label: 'Packs', href: '/packs' }
  const categorie = CATEGORY_PAGES.find((c) => norm(c.productType) === type)
  if (categorie) return { label: categorie.label, href: `/categories/${categorie.slug}` }
  return FILTRES_CATALOGUE[type] ?? CATALOGUE
}

/**
 * Guides par étiquette (ou par titre quand l'étiquette manque), du plus précis
 * au plus général : la première règle qui correspond donne les guides.
 */
export const GUIDES_PAR_ETIQUETTE: { types: string[]; etiquettes: string[]; titre?: RegExp; guides: string[] }[] = [
  { types: ['proteines'], etiquettes: ['gainer'], guides: ['gainer-prise-de-masse-comment-choisir', 'combien-de-proteines-par-jour'] },
  { types: ['proteines'], etiquettes: ['vegan'], guides: ['proteines-vegetales-musculation', 'combien-de-proteines-par-jour'] },
  { types: ['proteines'], etiquettes: ['isolate', 'clear whey', 'clear-whey'], guides: ['whey-ou-isolate-quelle-difference', 'quand-prendre-sa-whey'] },
  { types: ['proteines'], etiquettes: ['whey'], guides: ['quelle-whey-choisir-debutant', 'quand-prendre-sa-whey'] },
  { types: ['acides amines'], etiquettes: ['eaa', 'bcaa'], guides: ['eaa-ou-bcaa-lequel-prendre'] },
  { types: ['acides amines'], etiquettes: ['citrulline', 'arginine', 'beta-alanine', 'pump'], guides: ['pre-workout-avec-ou-sans-cafeine'] },
  { types: ['sante'], etiquettes: ['vitamine-d'], titre: /\bvitamin[e]?\s*d3?\b/i, guides: ['vitamine-d-combien-quand-pourquoi'] },
  { types: ['sante'], etiquettes: ['magnesium'], guides: ['magnesium-bienfaits-quelle-forme-choisir', 'mieux-dormir-recuperation'] },
  { types: ['sante'], etiquettes: ['collagene'], guides: ['collagene-bienfaits-comment-choisir'] },
  { types: ['sante'], etiquettes: ['multivitamine', 'multivitamines'], guides: ['multivitamines-utile-comment-choisir', 'complements-apres-40-ans'] },
  { types: ['sante'], etiquettes: ['sommeil', 'ashwagandha'], guides: ['mieux-dormir-recuperation'] },
  { types: ['boissons'], etiquettes: ['proteine', 'pret-a-boire'], guides: ['combien-de-proteines-par-jour'] },
  { types: ['boissons'], etiquettes: ['energy', 'cafeine', 'preworkout', 'pre-workout'], guides: ['pre-workout-avec-ou-sans-cafeine'] },
]

/** Sans étiquette qui parle : les guides du rayon, ou ceux-ci pour les types sans page. */
export const GUIDES_PAR_TYPE: Record<string, string[]> = {
  snacks: ['combien-de-proteines-par-jour'],
  'acides amines': ['complements-debutant-musculation'],
  sante: ['complements-apres-40-ans'],
  proteines: ['combien-de-proteines-par-jour', 'quelle-whey-choisir-debutant'],
}

/** Slugs des 1 ou 2 guides liés à la fiche (vide pour accessoires, packs, coffrets). */
export function guidesDeFiche(p: ProduitRayon, max = 2): string[] {
  if (estCoffret(p)) return []
  const type = norm(p.productType)
  const etiquettes = new Set((p.tags ?? []).map(norm))
  const regle = GUIDES_PAR_ETIQUETTE.find(
    (r) => r.types.includes(type) && (r.etiquettes.some((e) => etiquettes.has(norm(e))) || r.titre?.test(p.title ?? '')),
  )
  if (regle) return regle.guides.slice(0, max)
  if (GUIDES_PAR_TYPE[type]) return GUIDES_PAR_TYPE[type].slice(0, max)
  const categorie = CATEGORY_PAGES.find((c) => norm(c.productType) === type)
  return (categorie?.guides ?? []).map((g) => g.slug).slice(0, max)
}
