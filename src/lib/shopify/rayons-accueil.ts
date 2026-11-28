// Tuiles des rayons de l'accueil (refonte du 28/11/2026), côté serveur : un
// produit en stock par rayon (le plus vendu du productType, Storefront), pour
// l'image de la tuile. Une seule requête pour les 9 rayons, relue toutes les
// 6 heures au plus. Sans Shopify : les tuiles restent, sans image.

import { unstable_cache } from 'next/cache'
import { CATEGORY_PAGES } from '@/lib/categories'
import { shopifyFetch } from './client'

export interface RayonAccueil {
  slug: string
  label: string
  href: string
  image: { url: string; altText: string | null } | null
}

const requete = () => {
  const variables = CATEGORY_PAGES.map((_, i) => `$q${i}: String!`).join(', ')
  const champs = CATEGORY_PAGES.map(
    (_, i) => `r${i}: products(first: 1, sortKey: BEST_SELLING, query: $q${i}) { nodes { featuredImage { url altText } } }`
  ).join('\n')
  return `query RayonsAccueil(${variables}) { ${champs} }`
}

type Reponse = Record<string, { nodes: { featuredImage: { url: string; altText: string | null } | null }[] } | null>

const imagesEnCache = unstable_cache(
  async (): Promise<(RayonAccueil['image'])[]> => {
    const variables = Object.fromEntries(
      CATEGORY_PAGES.map((c, i) => [`q${i}`, `product_type:${JSON.stringify(c.productType)} AND available_for_sale:true`])
    )
    const data = await shopifyFetch<Reponse>(requete(), variables)
    return CATEGORY_PAGES.map((_, i) => data[`r${i}`]?.nodes[0]?.featuredImage ?? null)
  },
  ['rayons-accueil-v1'],
  { revalidate: 21600 }
)

/** Les 9 rayons (lib/categories), dans l'ordre du menu, avec une image quand Shopify en donne une. */
export async function getRayonsAccueil(): Promise<RayonAccueil[]> {
  const images = await imagesEnCache().catch(() => CATEGORY_PAGES.map(() => null))
  return CATEGORY_PAGES.map((c, i) => ({
    slug: c.slug,
    label: c.label,
    href: `/categories/${c.slug}`,
    image: images[i] ?? null,
  }))
}
