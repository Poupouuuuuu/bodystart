/**
 * Modèle de contenu du blog (/blog).
 *
 * Les articles vivent dans src/content/blog/ sous forme de données typées
 * (pas de CMS, pas de MDX) : blocs structurés rendus par ArticleRenderer.
 * Inline autorisé dans les textes : **gras** et [libellé](/route-interne).
 *
 * SEO/GEO : chaque article est answer-first (excerpt = réponse en 2 phrases),
 * H2 = questions naturelles, FAQ visible en fin de page (= schema FAQPage mot
 * pour mot), maillage ≥ 2 produits + 1 catégorie, allégations UE 1924/2006.
 */

export type ArticleBlock =
  | { type: 'p'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'steps'; items: string[] }
  | { type: 'table'; headers: string[]; rows: string[][] }

export interface ArticleSection {
  h2: string
  blocks: ArticleBlock[]
}

export interface BlogArticle {
  slug: string
  /** H1. */
  title: string
  /** Title SEO sans suffixe global (≤ 60 car.). */
  metaTitle: string
  /** ≤ 155 car. */
  metaDescription: string
  /** Réponse directe à la question en ≤ 2 phrases (chapeau + listing + GEO). */
  excerpt: string
  datePublished: string // YYYY-MM-DD
  dateModified: string
  sections: ArticleSection[]
  /** FAQ visible en fin d'article — reprise MOT POUR MOT dans le schema FAQPage. */
  faq: { q: string; a: string }[]
  /** Étapes HowTo (optionnel — émet un schema HowTo en plus). */
  howToSteps?: { name: string; text: string }[]
  /** Vitrine produits en fin d'article (handles réels). */
  products: { handle: string; label: string }[]
  /** Catégories liées (slugs de src/lib/categories.ts). */
  categories: { slug: string; label: string }[]
  /** Autres articles liés. */
  related: string[]
}

export const BLOG_AUTHOR = {
  name: 'Adam — BodyStart Nutrition',
  url: '/about',
} as const

export function formatArticleDate(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
